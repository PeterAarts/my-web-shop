// FILE: server/routes/shippingRoutes.js
// This file contains the main logic for calculating shipping options.
// It handles requests for shipping rates and label creation, integrating with various shipping providers.

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const ShippingProvider = require('../models/ShippingProvider');
const Setting = require('../models/Setting');
const Product = require('../models/Product');
const Order = require('../models/Order'); 
const auth = require('../middleware/authMiddleware.js'); 
const { changeOrderStatus } = require('../services/orderStatusService');

// --- Directory Setup ---
// Save labels to a private 'storage' directory for security
const labelsDir = path.join(__dirname, '..', 'storage', 'labels');
if (!fs.existsSync(labelsDir)) {
    fs.mkdirSync(labelsDir, { recursive: true });
    console.log(`✅ Created secure directory for shipping labels at: ${labelsDir}`);
} else {
  console.log(`✅ Secure directory for shipping labels available : ${labelsDir}`);
}

// --- Dynamic Provider Loading ---
const providers = {};
const providersDirectory = path.join(__dirname, '../shipping-providers');

if (fs.existsSync(providersDirectory)) {
    fs.readdirSync(providersDirectory).forEach(file => {
        if (file.endsWith('.js')) {
            try {
                const providerModule = require(path.join(providersDirectory, file));
                if (providerModule.key) {
                    providers[providerModule.key] = providerModule;
                }
            } catch (error) {
                console.error(`❌ Failed to load shipping provider from ${file}:`, error);
            }
        }
    });
}
console.log(`✅ Loaded ${Object.keys(providers).length} local shipping provider modules.`);

/**
 * Calculates the total weight, volume, and max dimension for a list of cart items.
 * @param {Array} cartItems - Array of items from the request body.
 * @returns {Promise<object>} An object with totalWeight, totalVolume, and maxDimension.
 */
async function calculateOrderDimensions(cartItems) {
  let totalWeight = 0;
  let totalVolume = 0;
  let maxDimension = 0;

  const productIds = cartItems.map(item => item.productId || item._id);
  const products = await Product.find({ '_id': { $in: productIds } });
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  for (const item of cartItems) {
    const product = productMap.get(item.productId || item._id);
    if (product) {
      const quantity = item.quantity || 1;
      const dims = product.dimensions || { length: 0, width: 0, height: 0 };
      totalWeight += (product.weight || 0) * quantity;
      totalVolume += (dims.length * dims.width * dims.height) * quantity;
      
      const currentMax = Math.max(dims.length, dims.width, dims.height);
      if (currentMax > maxDimension) {
        maxDimension = currentMax;
      }
    }
  }
  return { totalWeight, totalVolume, maxDimension };
}

// @route   POST api/shipping/rates
// @desc    Calculate shipping rates using a robust fitting algorithm.
// @access  Public
router.post('/rates', async (req, res) => {
  const { address, cartItems } = req.body;
  if (!address || !cartItems || cartItems.length === 0) {
    return res.status(400).json({ msg: 'Missing address or cart items.' });
  }

  try {
    const [enabledProvidersFromDB, shopSettings] = await Promise.all([
      ShippingProvider.find({ isEnabled: true }),
      Setting.getSingleton()
    ]);

    if (!shopSettings?.shippingPackages?.length) {
      return res.status(500).json({ msg: 'Shipping packages are not configured.' });
    }

    const { totalWeight, totalVolume, maxDimension } = await calculateOrderDimensions(cartItems);
    if (totalWeight === 0) {
      return res.json({ rates: [], totalWeight: 0 }); 
    }

    const fittingPackages = shopSettings.shippingPackages.filter(pkg => {
      const packageVolume = pkg.length * pkg.width * pkg.height;
      const packageMaxDim = Math.max(pkg.length, pkg.width, pkg.height);
      const fitsWeight = totalWeight <= pkg.maxWeight;
      const fitsVolume = totalVolume <= packageVolume;
      const fitsDimension = maxDimension <= packageMaxDim;
      return fitsWeight && fitsVolume && fitsDimension;
    });

    if (fittingPackages.length === 0) {
      return res.json([]); 
    }
    
    fittingPackages.sort((a, b) => (a.length * a.width * a.height) - (b.length * b.width * b.height));

    const ratePromises = enabledProvidersFromDB.map(providerConfig => {
      const providerModule = providers[providerConfig.moduleName]; 
      if (providerModule) {
        return providerModule.getRates(address, fittingPackages, totalWeight, providerConfig)
          .catch(error => {
            console.error(`   Error from ${providerConfig.name}:`, error.message);
            return [];
          });
      }
      return Promise.resolve([]);
    });

    const results = await Promise.all(ratePromises);
    const allRates = results.flat().sort((a, b) => a.price - b.price);

    res.json({
      rates: allRates,
      totalWeight: totalWeight 
    });

  } catch (err) {
    console.error('Shipping Rate Calculation Error:', err.stack);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/shipping/label
// @desc    Create a shipping label and save it locally.
// @access  Private
router.post('/label', auth, async (req, res) => {
  const { orderId, rateId } = req.body;
  if (!orderId || !rateId) {
    return res.status(400).json({ msg: 'Order ID and Rate ID are required.' });
  }

  try {
    const [moduleName, zone, productCode, serviceLevel] = rateId.split('-');
    if (!moduleName || !productCode) {
        return res.status(400).json({ msg: 'Invalid Rate ID format.' });
    }

    const order = await Order.findById(orderId).populate('items.productId', 'weight');
    if (!order) { return res.status(404).json({ msg: 'Order not found.' }); }

    const providerConfig = await ShippingProvider.findOne({ moduleName: moduleName });
    if (!providerConfig || !providerConfig.isEnabled) {
        return res.status(400).json({ msg: 'Shipping provider not found or is disabled.' });
    }

    const providerModule = providers[moduleName];
    if (!providerModule || typeof providerModule.createLabel !== 'function') {
        return res.status(501).json({ msg: `Label creation is not implemented for '${moduleName}'.` });
    }

    // --- Core Logic Starts Here ---
    console.log(`Creating label for Order ${orderId} via provider: ${moduleName}`);
    const labelResult = await providerModule.createLabel(order, productCode, providerConfig);
    const labelBuffer = Buffer.from(labelResult.labelData, 'base64');
    const fileName = `${order.orderNumber}-${labelResult.trackingNumber}.pdf`;
    const filePath = path.join(labelsDir, fileName);

    fs.writeFileSync(filePath, labelBuffer);
    console.log(`Label saved to: ${filePath}`);

    const fileUrl = `${fileName}`;

    // Update the shipping details on the order
    order.shippingDetails.provider = moduleName;
    order.shippingDetails.trackingNumber = labelResult.trackingNumber;
    order.shippingDetails.labelUrl = fileUrl;
    order.shippingDetails.labelFormat = 'pdf';
    
    // THIS IS THE FIX: Explicitly tell Mongoose that the nested object has changed.
    order.markModified('shippingDetails');
    
    await order.save();

    // UPDATED: Use the status service to change status to 'processing'
     await changeOrderStatus(
      orderId,
      'processing',
      req.user.id,
      `Shipping label created. Provider: ${providerConfig.name}, Tracking: ${labelResult.trackingNumber}`
    );

    res.json({
      success: true,
      message: 'Label created successfully.',
      trackingNumber: labelResult.trackingNumber,
      labelUrl: fileUrl
    });

  } catch (err) {
    console.error('Label Creation Error:', err.stack);
    res.status(500).json({ msg: 'Server error during label creation.', error: err.message });
  }
});

// @route   GET /api/shipping/labels/:fileName
// @desc    Serve a specific shipping label file securely.
// @access  Private
router.get('/labels/:fileName', auth, (req, res) => {
  const { fileName } = req.params;

  if (fileName.includes('..') || fileName.includes('/')) {
      return res.status(400).send('Invalid filename.');
  }
  
  const filePath = path.join(labelsDir, fileName);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ msg: 'Label not found.' });
  }
});

module.exports = router;
