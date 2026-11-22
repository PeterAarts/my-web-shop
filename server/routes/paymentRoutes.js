// FILE: server/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const crypto = require('crypto'); // NEW: Import crypto for token generation
const PaymentProvider = require('../models/PaymentProvider');
const authOptional = require('../middleware/authOptional');
const { priceOrder, takeStock, giveBackStock } = require('../services/orderPricingService');
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
// The provider module for a payment method name, or null. (Object.hasOwn: a name like
// "constructor" must not match something built into every JavaScript object.)
const providerFor = name => (typeof name === 'string' && Object.hasOwn(providers, name) ? providers[name] : null);

// Errors from priceOrder/takeStock carry a status and details for the checkout page.
function sendOrderError(res, error) {
  if (error.status === 400) {
    return res.status(400).json({ msg: error.message, outOfStockItems: error.outOfStockItems, priceChanged: error.priceChanged });
  }
  console.error('Order error:', error);
  res.status(500).json({ msg: 'Something went wrong while placing your order. Please try again.' });
}

// @route   POST api/payment/initiate
// @desc    Starts the payment for an order. Prices are calculated by the server.
// @access  Public (guests and logged-in customers)
router.post('/initiate', authOptional, async (req, res) =>  {
    const { paymentMethod, orderDetails } = req.body;

    try {
        const providerModule = providerFor(paymentMethod);
        if (!providerModule) {
            return res.status(400).json({ msg: 'Invalid payment method.' });
        }
        const providerConfig = await PaymentProvider.findOne({ moduleName: paymentMethod });
        if (!providerConfig || !providerConfig.isEnabled) {
            return res.status(400).json({ msg: 'This payment method is not available.' });
        }
        if (providerConfig.requiresRegistration && !req.user) {
            return res.status(403).json({ msg: 'Please log in to use this payment method.' });
        }

        const priced = await priceOrder(orderDetails);

        if (!providerModule.isOnline) {
            const paymentDetails = { paymentMethod, paymentStatus: 'pending', paymentDate: new Date() };
            const { finalOrder, viewToken } = await placeFinalOrder(priced, req.user?.id, paymentDetails);
            return res.json({ success: true, order: finalOrder, action: 'confirm', viewToken: viewToken });
        }

        if (providerModule.initiate) {
            // The provider is asked to collect the server's total, not the browser's.
            const result = await providerModule.initiate(priced, providerConfig);
            return res.json({ success: true, ...result });
        }

        res.status(400).json({ msg: 'This payment method cannot be initiated.' });

    } catch (error) {
        sendOrderError(res, error);
    }
});

// @route   POST api/payment/capture
// @desc    Completes a PayPal payment after the customer approved it, then places the order.
// @access  Public (guests and logged-in customers; guests can pay with PayPal too)
router.post('/capture', authOptional, async (req, res) => {
    const { paymentMethod, paymentDetails, orderDetails } = req.body;
    if (paymentMethod !== 'paypal') {
        return res.status(400).json({ msg: 'Invalid payment method for capture.' });
    }
    const paypalOrderId = paymentDetails?.paymentTransactionId;
    if (typeof paypalOrderId !== 'string' || !/^[A-Za-z0-9-]{5,64}$/.test(paypalOrderId)) {
        return res.status(400).json({ msg: 'Invalid PayPal payment.' });
    }

    try {
        const paypalProvider = providerFor('paypal');
        const paypalConfig = await PaymentProvider.findOne({ moduleName: 'paypal' });
        if (!paypalProvider || !paypalConfig || !paypalConfig.isEnabled) {
            return res.status(400).json({ msg: 'PayPal is not available.' });
        }

        // One PayPal payment pays for one order.
        if (await Order.exists({ 'paymentDetails.paymentTransactionId': paypalOrderId })) {
            return res.status(409).json({ msg: 'This payment was already used for an order.' });
        }

        const priced = await priceOrder(orderDetails);

        const captureData = await paypalProvider.captureOrder(paypalOrderId, paypalConfig);
        if (captureData.status !== 'COMPLETED') {
            return res.status(400).json({ msg: 'PayPal payment could not be completed.' });
        }

        // What PayPal actually received must be the order's total.
        const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
        const paid = Number(capture?.amount?.value);
        const currency = capture?.amount?.currency_code;
        if (currency !== 'EUR' || !Number.isFinite(paid) || Math.abs(paid - priced.totalAmount) > 0.005) {
            console.error(`[PayPal] AMOUNT MISMATCH for PayPal order ${paypalOrderId}: received ${paid} ${currency}, ` +
                          `order total ${priced.totalAmount} EUR. No order placed; refund this payment in PayPal.`);
            return res.status(400).json({ msg: 'The amount paid does not match your order. Please contact us; we will refund the payment.' });
        }

        const { finalOrder, viewToken } = await placeFinalOrder(priced, req.user?.id, {
            paymentMethod: 'paypal',
            paymentStatus: 'paid',
            paymentDate: new Date(),
            paymentTransactionId: paypalOrderId,
        });
        res.json({ success: true, order: finalOrder, viewToken: viewToken });

    } catch (error) {
        if (error.status === 400) return sendOrderError(res, error);
        console.error(error.message);
        res.status(500).json({ msg: 'Error capturing payment.' });
    }
});


// --- HELPER FUNCTIONS ---

// Places an order from a priced cart (see services/orderPricingService.js).
// Stock is taken first, all or nothing; if saving the order fails, it is given back.
async function placeFinalOrder(priced, userId, paymentDetails) {
    const orderData = {
      orderNumber: `ORD-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      user: userId,
      customerDetails: priced.customerDetails,
      items: priced.items,
      totalAmount: priced.totalAmount,
      shippingDetails: priced.shippingDetails,
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
    // A secure token so a guest can view their order confirmation for one hour
    const token = crypto.randomBytes(32).toString('hex');
    orderData.viewToken = token;
    orderData.viewTokenExpires = Date.now() + 3600000;

    await takeStock(priced.items);
    let savedOrder;
    try {
        savedOrder = await new Order(orderData).save();
    } catch (err) {
        await giveBackStock(priced.items);
        throw err;
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
        if (user && !user.shippingAddress?.street && priced.structuredAddress) {
            await User.findByIdAndUpdate(userId, {
                $set: { shippingAddress: priced.structuredAddress }
            });
        }
    } catch (error) {
        console.error('Could not save shipping address to user profile:', error);
    }
    
    // MODIFIED: Return both the saved order and the new token
    return { finalOrder: savedOrder, viewToken: token };
}

module.exports = router;