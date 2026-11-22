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
const { requireAdmin, requireStaff } = require('../middleware/requireRole');
const { changeOrderStatus } = require('../services/orderStatusService');

// --- Directory Setup ---
// Labels go to a private directory (LABELS_DIR in .env, see lib/paths.js)
const { LABELS_DIR: labelsDir } = require('../lib/paths');
const { quoteRates } = require('../services/shippingQuoteService');
{
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

// Weight/volume calculation and rates: see services/shippingQuoteService.js

// @route   POST api/shipping/rates
// @desc    Calculate shipping rates using a robust fitting algorithm.
// @access  Public
router.post('/rates', async (req, res) => {
  const { address, cartItems } = req.body;
  if (!address || typeof address !== 'object' || !Array.isArray(cartItems) || cartItems.length === 0 || cartItems.length > 100) {
    return res.status(400).json({ msg: 'Missing address or cart items.' });
  }

  try {
    const quote = await quoteRates(address, cartItems);
    if (quote.outcome === 'noWeight') return res.json({ rates: [], totalWeight: 0 });
    if (quote.outcome === 'noPackage') return res.json([]);
    res.json({ rates: quote.rates, totalWeight: quote.totalWeight });
  } catch (err) {
    if (err.notConfigured) return res.status(500).json({ msg: err.message });
    console.error('Shipping Rate Calculation Error:', err.stack);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/shipping/label
// @desc    Create a shipping label and save it locally.
// @access  Private
router.post('/label', auth, requireAdmin, async (req, res) => {
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
router.get('/labels/:fileName', auth, requireStaff, (req, res) => {
  const { fileName } = req.params;

  if (path.basename(fileName) !== fileName || fileName.startsWith('.')) {
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
