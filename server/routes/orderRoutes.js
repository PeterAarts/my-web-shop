// FILE: server/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { requireAdmin, requireStaff, currentRole, isStaffRole } = require('../middleware/requireRole');
const { PICKLIST_DIR } = require('../lib/paths');
const Order = require('../models/Order');
const Setting = require('../models/Setting');
const Product = require('../models/Product');
const OrderStatusLog = require('../models/OrderStatusLog');
const { changeOrderStatus } = require('../services/orderStatusService');
const PDFDocument = require('pdfkit');
const { generateAndSavePickList } = require('../services/pickListService');
const path = require('path');
const fs = require('fs');
const {
  sendOrderConfirmationEmail,
  sendPendingPaymentEmail,
  sendOrderShippedEmail,
  sendOrderCancelledEmail,
  sendPaymentReceivedEmail,
} = require('../services/templateEmailService');


// @route   GET api/orders/my-orders
// @desc    Get all orders for the logged-in user
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/orders
// @desc    Get all orders for admin (defaults to active)
// @access  Private
router.get('/', auth, requireStaff, async (req, res) => {
  try {
    const filter = { active: true };
    if (req.query.active === 'false') {
      filter.active = false;
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/orders/:id
// @desc    Get a single order by ID
// @access  Protected
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate({ 
          path: 'items.productId', 
          model: 'Product',
          select: 'name dimensions weight images category' // Select only the fields you need
      });
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    const role = await currentRole(req);
    const ownerId = order.user && (order.user._id || order.user).toString();
    if (!isStaffRole(role) && ownerId !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view this order' });
    }
    res.json(order);
  } catch (err)
 {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// This public route allows guest users to view their order confirmation
// using a secure, short-lived token.
// @route   GET /api/orders/public/:id/:token
// @desc    Get a single order using a special view token
// @access  Public
router.get('/public/:id/:token', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    // Security checks to ensure the token is valid and correct
    if (
      !order ||
      !order.viewToken ||
      order.viewToken !== req.params.token ||
      order.viewTokenExpires < Date.now()
    ) {
      // Use the same error message to avoid revealing which part failed
      return res.status(403).json({ msg: 'Not authorized to view this order' });
    }

    res.json(order);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// @route   GET /api/orders/public/confirmation/:id/:token
// @desc    Get minimal order details for the confirmation page
// @access  Public
router.get('/public/confirmation/:id/:token', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    // Perform the same security checks
    if (
      !order ||
      !order.viewToken ||
      order.viewToken !== req.params.token ||
      order.viewTokenExpires < Date.now()
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this order' });
    }

    // Create a smaller, safer object to send to the frontend
    const confirmationDetails = {
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      shippingMethodName: order.shippingDetails.shippingMethodName,
      paymentStatus: order.paymentStatus,
      customerEmail: order.customerDetails.email
    };

    res.json(confirmationDetails);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// @route   GET /api/orders/confirmation/:id
// @desc    Get minimal order details for a logged-in user's confirmation page
// @access  Private
router.get('/confirmation/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    // Security check: must be staff or the user who owns the order
    if (!order || (!isStaffRole(await currentRole(req)) && order.user?.toString() !== req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized to view this order confirmation' });
    }

    // Create the same smaller, safer object to send to the frontend
    const confirmationDetails = {
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      shippingMethodName: order.shippingDetails.shippingMethodName,
      paymentStatus: order.paymentStatus,
      customerEmail: order.customerDetails.email
    };

    res.json(confirmationDetails);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/orders (create an order directly) was removed: nothing used it, it could not
// work (it referred to variables that don't exist) and it copied the request into the order.
// Orders are created by POST /api/payment/initiate, with prices calculated by the server.

// @route   POST api/orders/archive
// @desc    Run the auto-archive process for old orders
// @access  Private
router.post('/archive', auth, requireStaff, async (req, res) => {
    try {
        const settings = await Setting.findOne();
        if (!settings || !settings.archiveOrdersDays) {
            return res.status(400).json({ msg: 'Archiving settings not configured.' });
        }
        const { archiveOrdersDays, archiveOrdersStatuses } = settings;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - archiveOrdersDays);
        const result = await Order.updateMany(
            { active: true, status: { $in: archiveOrdersStatuses }, updatedAt: { $lt: cutoffDate } },
            { $set: { active: false } }
        );
        res.json({
            msg: `Archiving process complete. ${result.modifiedCount} order(s) archived.`,
            archivedCount: result.modifiedCount
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/orders/:id
// @desc    Update an order's details and/or status securely
// @access  Private
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    const originalStatus = order.status;
    const newStatus = req.body.status;

    // --- NEW SECURE LOGIC ---
    // Check if the status is being changed in the request.
    if (newStatus && newStatus !== originalStatus) {
      
      // A status change is requested. Use the secure service.
      // The service handles validation, side effects (stock, emails), and logging.
      await changeOrderStatus(
        req.params.id,
        newStatus,
        req.user.id,
        req.body.comment // Pass along any comment
      );

    } 
    
    // --- GENERAL UPDATE LOGIC ---
    // Update any other fields that were sent in the request body.
    // We create a copy of the request body and delete the status
    // property to avoid conflicts with the service.
    const otherUpdates = { ...req.body };
    delete otherUpdates.status;
    delete otherUpdates.comment;

    // Apply the remaining updates if there are any
    if (Object.keys(otherUpdates).length > 0) {
        order.set(otherUpdates);
    }
    
    // Save all changes and get the final, updated document.
    const updatedOrder = await order.save();

    res.json({
      msg: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (err) {
    // This will now catch errors from the changeOrderStatus service,
    // like "Invalid status transition".
    console.error(`Error updating order ${req.params.id}:`, err.message);
    res.status(400).json({ msg: err.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update an order's status using the centralized service
// @access  Protected (Admin)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, comment } = req.body;

    if (!status || typeof status !== 'string') {
      return res.status(400).json({ msg: 'New status is required.' });
    }

    // Admins may change any order. A customer may only cancel their own order,
    // and only while it is still waiting for payment.
    const role = await currentRole(req);
    if (role !== 'admin') {
      const order = await Order.findById(req.params.id).select('user status');
      const ownsIt = order && order.user && order.user.toString() === req.user.id;
      if (!ownsIt || status !== 'cancelled' || order.status !== 'pending payment') {
        return res.status(403).json({ msg: 'You can only cancel your own order while it is waiting for payment.' });
      }
    }

    const updatedOrder = await changeOrderStatus(
      req.params.id,
      status,
      req.user.id,
      comment
    );

    res.json({
      msg: `Order status successfully changed to "${status}"`,
      order: updatedOrder
    });

  } catch (err) {
    // Catches errors from the service, like "Invalid transition"
    console.error(`Status Change Error: ${err.message}`);
    res.status(400).json({ msg: err.message });
  }
});

// @route   GET /api/orders/:id/picklist
// @desc    Securely serves the picklist PDF for a single order
// @access  Protected (Admin)
router.get('/:id/picklist', auth, requireStaff, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order || !order.picklistFilename) {
      return res.status(404).json({ msg: 'Picklist not found for this order.' });
    }

    const filePath = path.join(PICKLIST_DIR, path.basename(order.picklistFilename));

    if (fs.existsSync(filePath)) {
      // --- UPDATED: More robust file streaming method ---
      // Set headers to tell the browser it's a PDF file for download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=${order.picklistFilename}`);
      
      console.log(`Serving picklist for order ${order._id}: ${order.picklistFilename}`);

      // Create a read stream from the file and pipe it to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      // --- END UPDATED METHOD ---
    } else {
      console.error(`File not found on disk: ${filePath}`);
      return res.status(404).json({ msg: 'Picklist file is missing.' });
    }

  } catch (err) {
    console.error("Error serving picklist:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/orders/:id/generate-picklist
// @desc    Manually generates a picklist for an order
// @access  Protected (Admin)
router.post('/:id/generate-picklist', auth, requireStaff, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    const picklistFilename = await generateAndSavePickList(order);
    order.picklistFilename = picklistFilename;
    await order.save();

    res.json({ 
      msg: 'Picklist generated successfully.',
      order: order 
    });

  } catch (err) {
    console.error("Error manually generating picklist:", err.message);
    res.status(500).send('Server Error');
  }
});
module.exports = router;