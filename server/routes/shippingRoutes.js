// FILE: server/routes/shippingRoutes.js
// This file contains the main logic for calculating shipping options.

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const ShippingProvider = require('../models/ShippingProvider');
const Setting = require('../models/Setting');
const Product = require('../models/Product');
const Order = require('../models/Order'); 
const auth = require('../middleware/authMiddleware.js'); 

// --- Directory Setup ---
// Create a dedicated directory for labels if it doesn't exist.
// This runs once when the server starts.
const labelsDir = path.join(__dirname, '..', 'public', 'labels');
if (!fs.existsSync(labelsDir)) {
    fs.mkdirSync(labelsDir, { recursive: true });
    console.log(`✅ Created directory for shipping labels at: ${labelsDir}`);
} else {
  console.log(`✅ Directory for shipping labels available : ${labelsDir}`);
}

// --- Dynamic Provider Loading ---
const providers = {};
const providersDirectory = path.join(__dirname, '../shipping-providers');

// Check if the directory exists before trying to read it
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
    
    console.log('   --- Shipping Calculation Start ---');
    console.log(`       Calculated Order Dimensions:`);
    console.log(`       - Total Weight: ${totalWeight}g`);
    console.log(`       - Total Volume: ${totalVolume}cm³`);
    console.log(`       - Max Item Dimension: ${maxDimension}cm`);
    console.log('   ------------------------------------');

    if (totalWeight === 0) {
      return res.status(400).json({ msg: 'Cannot calculate shipping for zero-weight items.' });
    }

    const fittingPackages = shopSettings.shippingPackages.filter(pkg => {
      const packageVolume = pkg.length * pkg.width * pkg.height;
      const packageMaxDim = Math.max(pkg.length, pkg.width, pkg.height);
      
      const fitsWeight = totalWeight <= pkg.maxWeight;
      const fitsVolume = totalVolume <= packageVolume;
      const fitsDimension = maxDimension <= packageMaxDim;

    //  console.log(`Checking Package: "${pkg.name}"`);
    //  console.log(`  - Weight Check: ${totalWeight}g <= ${pkg.maxWeight}g -> ${fitsWeight ? '✅' : '❌'}`);
    //  console.log(`  - Volume Check: ${totalVolume}cm³ <= ${packageVolume.toFixed(1)}cm³ -> ${fitsVolume ? '✅' : '❌'}`);
    //  console.log(`  - Dimension Check: ${maxDimension}cm <= ${packageMaxDim}cm -> ${fitsDimension ? '✅' : '❌'}`);
      return fitsWeight && fitsVolume && fitsDimension;
    });

    if (fittingPackages.length === 0) {
      console.log('   --- No fitting packages found. Responding with empty array. ---');
      return res.json([]); 
    }
    
    // Sort packages by volume to create a prioritized list (smallest first)
    fittingPackages.sort((a, b) => (a.length * a.width * a.height) - (b.length * b.width * b.height));

  //  console.log(`Found ${fittingPackages.length} fitting package(s):`, fittingPackages.map(p => p.name));
    console.log(`   -> Prioritized Package List: [${fittingPackages.map(p => p.name).join(', ')}]`);
    console.log('   ------------------------------------');

    const ratePromises = enabledProvidersFromDB.map(providerConfig => {
      const providerModule = providers[providerConfig.moduleName]; 
      if (providerModule) {
        console.log(`   -> Calling provider: "${providerConfig.name}" (key: ${providerConfig.moduleName})`);
        
        // Pass the entire sorted list of fitting packages to the provider
        return providerModule.getRates(address, fittingPackages, totalWeight, providerConfig)
          .catch(error => {
            console.error(`   Error from ${providerConfig.name}:`, error.message);
            return [];
          });
      }
      console.log(`   -> Skipping provider "${providerConfig.name}" (no local module found for key: ${providerConfig.moduleName})`);
      return Promise.resolve([]);
    });

    const results = await Promise.all(ratePromises);
// console.log('--- Provider Results (raw) ---');
//    console.log(JSON.stringify(results, null, 2));
//    console.log('------------------------------');
    
    const allRates = results.flat().sort((a, b) => a.price - b.price);

//    console.log('--- Final Rates Sent to Client ---');
//    console.log(JSON.stringify(allRates, null, 2));
//    console.log('----------------------------------');

    res.json({
      rates: allRates,
      totalWeight: totalWeight 
    });

  } catch (err) {
    console.error('   - Shipping Rate Calculation Error:', err.stack);
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

    const order = await Order.findById(orderId);
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

    // 1. Decode the Base64 data into a buffer
    const labelBuffer = Buffer.from(labelResult.labelData, 'base64');

    // 2. Create a unique filename and the full path
    const fileName = `${order.orderNumber}-${labelResult.trackingNumber}.pdf`;
    const filePath = path.join(labelsDir, fileName);

    // 3. Write the buffer to a file on the server's disk
    fs.writeFileSync(filePath, labelBuffer);
    console.log(`Label saved to: ${filePath}`);

    // 4. Create the public-facing URL for the file
    const fileUrl = `/api/shipping/labels/${fileName}`;

    // 5. Save the URL and tracking info to the order document
    order.shippingDetails = {
      provider: moduleName,
      trackingNumber: labelResult.trackingNumber,
      labelUrl: fileUrl, // Store the URL, not the raw data
      labelFormat: 'pdf'
    };
    order.status = 'ready for shipment'; //
    await order.save();

    // 6. Respond to the client with the success and the new URL
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

  // Basic security check to prevent path traversal attacks
  if (fileName.includes('..') || fileName.includes('/')) {
      return res.status(400).send('Invalid filename.');
  }
  
  const filePath = path.join(labelsDir, fileName);

  if (fs.existsSync(filePath)) {
    // If the file exists, send it to the client.
    // The browser will typically open it in a new tab or prompt a download.
    res.sendFile(filePath);
  } else {
    res.status(404).json({ msg: 'Label not found.' });
  }
});

module.exports = router;
