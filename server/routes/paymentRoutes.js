// FILE: server/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const crypto = require('crypto'); // NEW: Import crypto for token generation
const PaymentProvider = require('../models/PaymentProvider');
const authOptional = require('../middleware/authOptional');
const auth = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Setting = require('../models/Setting');
const User = require('../models/User');
const {
  sendOrderConfirmationEmail,
  sendPendingPaymentEmail
} = require('../services/templateEmailService');

// Dynamically load provider modules
const fs = require('fs');
const path = require('path');
const providers = {};
const providersDirectory = path.join(__dirname, '../payment-providers');
if (fs.existsSync(providersDirectory)) {
    fs.readdirSync(providersDirectory).forEach(file => {
        if (file.endsWith('.js')) {
            const providerModule = require(path.join(providersDirectory, file));
            if (providerModule.key) providers[providerModule.key] = providerModule;
        }
    });
}
// @route   GET api/payment/options
// @desc    Get available payment providers and info for the checkout page
// @access  Public (with optional authentication)
router.get('/options', authOptional, async (req, res) => {
  try {
    const allEnabledProviders = await PaymentProvider.find({ isEnabled: true });
    
    const availableForUser = [];
    const requiresRegistrationOptions = [];

    for (const provider of allEnabledProviders) {
      // Create the safe provider object to send to the client
      const safeProvider = {
        _id: provider._id,
        name: provider.name,
        moduleName: provider.moduleName,
        isOnline: provider.isOnline,
        instructions: provider.instructions,
        clientId: provider.isOnline && provider.credentials ? provider.credentials.clientId : null,
      };

      // Use the explicit flag from your model to sort providers
      if (provider.requiresRegistration) {
        // This option is for registered users only
        requiresRegistrationOptions.push(provider.name);
        if (req.user) {
          // If the user is logged in, add it to their list of available options
          availableForUser.push(safeProvider);
        }
      } else {
        // This option does not require registration, so it's available to everyone
        availableForUser.push(safeProvider);
      }
    }
    
    // Return a structured object with both lists
    res.json({
      available: availableForUser,
      requiresRegistration: requiresRegistrationOptions,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// @route   POST api/payment/initiate
// @desc    Initiates the payment process for any given method.
// @access  Private
router.post('/initiate', authOptional, async (req, res) =>  {
    const { paymentMethod, orderDetails } = req.body;

    try {
        await verifyStock(orderDetails.items);
        const providerModule = providers[paymentMethod];
        if (!providerModule) {
            return res.status(400).json({ msg: 'Invalid payment method.' });
        }

        if (!providerModule.isOnline) {
            // MODIFIED: Construct a paymentDetails object for the helper function
            const paymentDetails = {
                paymentMethod: paymentMethod,
                paymentStatus: 'pending',
                paymentDate: new Date()
            };
            const { finalOrder, viewToken } = await placeFinalOrder(orderDetails, req.user?.id, paymentDetails);
            return res.json({ success: true, order: finalOrder, action: 'confirm', viewToken: viewToken });
        }
        
        if (providerModule.initiate) {
            const providerConfig = await PaymentProvider.findOne({ moduleName: paymentMethod });
            if (!providerConfig || !providerConfig.isEnabled) {
                return res.status(400).json({ msg: `${providerConfig.name} is not available.` });
            }
            const result = await providerModule.initiate(orderDetails, providerConfig);
            return res.json({ success: true, ...result });
        }

        res.status(400).json({ msg: 'This payment method cannot be initiated.' });

    } catch (error) {
        res.status(error.outOfStockItems ? 400 : 500).json({
            msg: error.message,
            outOfStockItems: error.outOfStockItems
        });
    }
});

// @route   POST api/payment/capture
// @desc    Captures the payment after online approval (e.g., from PayPal)
// @access  Private
router.post('/capture', auth, async (req, res) => {
    const { paymentMethod, paymentDetails, orderDetails } = req.body;

    if (paymentMethod === 'paypal') {
        try {
            const paypalProvider = providers['paypal'];
            const paypalConfig = await PaymentProvider.findOne({ moduleName: 'paypal' });
            if (!paypalProvider || !paypalConfig) throw new Error('PayPal provider not configured.');

            const captureData = await paypalProvider.captureOrder(paymentDetails.paymentTransactionId, paypalConfig);
            if (captureData.status !== 'COMPLETED') {
                return res.status(400).json({ msg: 'PayPal payment could not be completed.' });
            }

            // MODIFIED: Pass the detailed paymentDetails object directly to the helper
            const { finalOrder, viewToken } = await placeFinalOrder(orderDetails, req.user.id, paymentDetails);
            res.json({ success: true, order: finalOrder, viewToken: viewToken });

        } catch (error) {
            console.error(error.message);
            res.status(500).json({ msg: 'Error capturing payment.' });
        }
    } else {
        res.status(400).json({ msg: 'Invalid payment method for capture.' });
    }
});


// --- HELPER FUNCTIONS ---

async function verifyStock(items) {
    const productIds = items.map(item => item.productId);
    const productsInCart = await Product.find({ '_id': { $in: productIds } });
    const productMap = new Map(productsInCart.map(p => [p._id.toString(), p]));
    
    const outOfStockItems = [];
    for (const item of items) {
        const product = productMap.get(item.productId.toString());
        if (!product || product.stock < item.quantity) {
            outOfStockItems.push({
                name: product ? product.name : 'Unknown Product',
                requested: item.quantity,
                available: product ? product.stock : 0,
            });
        }
    }
    if (outOfStockItems.length > 0) {
        const error = new Error('One or more items are out of stock.');
        error.outOfStockItems = outOfStockItems;
        throw error;
    }
}

async function placeFinalOrder(orderDetails, userId, paymentDetails) {
    const orderData = {
      orderNumber: `ORD-${Date.now()}`,
      user: userId,
      customerDetails: orderDetails.customerDetails,
      items: orderDetails.items,
      totalAmount: orderDetails.totalAmount,
      shippingDetails: orderDetails.shippingDetails,
      paymentDetails: paymentDetails,
      status: 'received' // Default status for a confirmed order
    };
    if (paymentDetails.paymentStatus === 'pending') {
        const settings = await Setting.findOne();
        const reservationDays = settings?.bankTransferReservationDays || 7;
        orderData.status = 'pending payment';
        const now = new Date();
        orderData.reservationExpiresAt = new Date(now.setDate(now.getDate() + reservationDays));
    }
    // NEW: Generate and add the secure view token
    const token = crypto.randomBytes(32).toString('hex');
    orderData.viewToken = token;
    orderData.viewTokenExpires = Date.now() + 3600000; // Token expires in 1 hour

    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();
    
    // Stock adjustment logic with corrected field name
    // This now runs for ALL orders created via this function (PayPal and Bank Transfer)
    for (const item of savedOrder.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity }
      });
    }

        // the email sending logic here ---
    try {
        console.log(`--- Triggering email for Order #${savedOrder.orderNumber} with status "${savedOrder.status}" ---`);
        const settings = await Setting.findOne();
        // The service functions need the full order object.
        const fullOrderDetails = await Order.findById(savedOrder._id); 

        // Send the correct email based on the final order status
        if (fullOrderDetails.status === 'pending payment') {
            await sendPendingPaymentEmail(fullOrderDetails, settings, token);
        } else {
            await sendOrderConfirmationEmail(fullOrderDetails, settings, token);
        }
        console.log(`--- Email sent successfully for Order #${savedOrder.orderNumber} ---`);
    } catch (emailError) {
        console.error(`--- FAILED to send email for Order #${savedOrder.orderNumber}: ---`, emailError);
    }
    
    try {
        const user = await User.findById(userId);
        if (user && !user.shippingAddress?.street && orderDetails.structuredAddress) {
            await User.findByIdAndUpdate(userId, {
                $set: { shippingAddress: orderDetails.structuredAddress }
            });
        }
    } catch (error) {
        console.error('Could not save shipping address to user profile:', error);
    }
    
    // MODIFIED: Return both the saved order and the new token
    return { finalOrder: savedOrder, viewToken: token };
}

module.exports = router;