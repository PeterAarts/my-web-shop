// FILE: server/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const Setting = require('../models/Setting');
const Product = require('../models/Product');
const OrderStatusLog = require('../models/OrderStatusLog');
const { changeOrderStatus } = require('../services/orderStatusService');
const PDFDocument = require('pdfkit');
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
router.get('/', auth, async (req, res) => {
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
    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
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

    // Security check: must be admin or the user who owns the order
    if (!order || (req.user.role !== 'admin' && order.user?.toString() !== req.user.id)) {
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

// @route   POST /api/orders
// @desc    Create a new order directly
// @access  Protected
router.post('/', auth, async (req, res) => {
  try {
    const newOrderData = new Order({
      orderNumber: `ORD-${Date.now()}`,
      user: req.user.id,
        shippingDetails: {
        shippingMethodId: selectedShipping.id, // Make sure you pass this from the frontend
        shippingMethodName: selectedShipping.name,
        shippingMethodCost: selectedShipping.price
      },
      paymentHistory: [{
        paymentMethod: paymentMethodModuleName, // e.g., 'banktransfer' or 'paypal'
        paymentStatus: 'pending', // Initial status
        paymentDate: new Date(),
        paymentComments: 'Order created.'
      }],
      ...req.body
    });
    const newOrder = await newOrderData.save();
    await OrderStatusLog.create({
        orderId: newOrder._id,
        orderNumber: newOrder.orderNumber,
        changedBy: req.user.id, // The logged-in admin's ID
        oldStatus: null,
        newStatus: newOrder.status,
    });



    const fullOrderDetails = await Order.findById(newOrder._id).populate('user', 'name email');
    const settings = await Setting.findOne();

    if (fullOrderDetails.status === 'pending payment') {
      sendOrderConfirmationEmail(fullOrderDetails);
      sendPendingPaymentEmail(fullOrderDetails, settings);
    } else {
      sendOrderConfirmationEmail(fullOrderDetails);
    }

    res.status(201).json({ msg: 'Order created successfully', order: newOrder });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/orders/archive
// @desc    Run the auto-archive process for old orders
// @access  Private
router.post('/archive', auth, async (req, res) => {
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

router.put('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    const originalStatus = order.status;
    order.set(req.body);

    if (req.body.paymentDetails && req.body.paymentDetails.paymentStatus === 'rejected') {
      order.status = 'cancelled';
    }
    const newStatus = order.status;
    // --- Side-Effect Logic ---
    if (newStatus !== originalStatus) {
      const unfulfilledStatuses = ['created', 'received', 'pending payment'];
      // Decrement stock
      if (unfulfilledStatuses.includes(originalStatus) && (newStatus === 'processing' || newStatus === 'shipped')) {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: -item.quantity } });
        }
      }
      // Restore stock
      if (newStatus === 'cancelled') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity } });
        }
      }
    }
    const updatedOrder = await order.save();
    // Log the status change
    if (newStatus !== originalStatus) {
      await OrderStatusLog.create({
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        changedBy: req.user.id,
        oldStatus: originalStatus,
        newStatus: newStatus,
      });
      // --- NEW: Email logic placed directly here ---
      try {
          const token = updatedOrder.viewToken;
          if (newStatus === 'shipped') {
              await sendOrderShippedEmail(updatedOrder, token);
          } else if (newStatus === 'cancelled') {
              await sendOrderCancelledEmail(updatedOrder, token);
          } else if (newStatus === 'received' && originalStatus === 'pending payment') {
              await sendPaymentReceivedEmail(updatedOrder, token);
          }
      } catch (emailError) {
          console.error(`Email failed to send for order ${updatedOrder.orderNumber}:`, emailError);
      }
    }
    res.json({
      msg: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update an order's status using the centralized service
// @access  Protected (Admin)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, comment } = req.body;

    if (!status) {
      return res.status(400).json({ msg: 'New status is required.' });
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
// @desc    Generate a PDF pick list for a single order
// @access  Protected
router.get('/:id/picklist', auth, async (req, res) => {
  console.log("Picklist being created for :"+req.params.id);
  try {
    let setting = await Setting.findOne();
    if (!setting) {
        setting = { shopTitle: 'My Shop' }; 
    }

    const order = await Order.findById(req.params.id).populate({
      path: 'items.productId',
      model: 'Product',
      select: 'name dimensions weight sku'
    });

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const filename = `PickList-Order-${order.orderNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    doc.pipe(res);

    // --- Helper function for drawing sections ---
    const drawSection = (title, contentLines) => {
        doc.fontSize(10).font('Helvetica-Bold').text(title, 40, doc.y);
        doc.strokeColor('#aaaaaa').lineWidth(0.5).moveTo(40, doc.y + 2).lineTo(550, doc.y + 2).stroke();
        doc.moveDown(1.0);
        doc.fontSize(10).font('Helvetica');
        contentLines.forEach(line => doc.text(line, { indent: 10 }));
        doc.moveDown(1.5);
    };
    
    // --- Draw the PDF Content ---
    
    // Main Header
    doc.fontSize(20).font('Helvetica-Bold').text(`Pick List #${order.orderNumber}`, 50, 50);
    doc.moveDown(2);

    // Customer Section
    const customerLines = [
        `${order.customerDetails.name}`,
        // Using the single address field from the model
        `${order.customerDetails.address}`
    ];
    drawSection('Customer', customerLines);

    // Shipping Section
    const shippingLines = [
        `${order.shippingDetails.shippingMethodName} , cost: € ${order.shippingCost || '0.00'}`
    ];
    drawSection('Shipping', shippingLines);

    // Payment Section - Simplified to match the model
    let paymentLines = [
        `Method: ${order.paymentDetails.paymentMethod || 'N/A'}, Status: ${order.paymentDetails.paymentStatus || 'N/A'},  Amount: € ${order.totalAmount}`,
    ];
    if (order.paymentDetails.paymentDate) {
        paymentLines.push(`Date: ${new Date(order.paymentDetails.paymentDate).toLocaleDateString()}`);
    }
    if (order.paymentDetails.paymentTransactionId) {
        paymentLines.push(`Transaction ID: ${order.paymentDetails.paymentTransactionId}`);
    }
    drawSection('Payment', paymentLines);

    doc.moveDown(1);
    
    // Table Header
    const tableTop = doc.y;
    doc.font('Helvetica').fontSize(10);
    doc.text('Qty', 40, tableTop);
    doc.text('sku', 70, tableTop);
    doc.text('Product Name', 140, tableTop);
    doc.text('Specs', 420, tableTop);
    doc.text('-', 540, tableTop);
    doc.rect(40, tableTop + 20, 520, 0.5).stroke();
    doc.moveDown(2);


    // Items Table Rows
    doc.font('Helvetica').fontSize(9);
    for (const item of order.items) {
        const product = item.productId;
        const y = doc.y;
        
        if (product) {
            doc.text(`${item.quantity}x`, 40, y, { width: 30 });
            doc.text(`${product.sku || 'N/A'}`, 70, y , { width: 70 });
            doc.text(product.name, 140, y, { width: 250 });
            
            let specs = [];
            if (product.weight > 0) specs.push(`${product.weight} g`);
            if (product.dimensions && product.dimensions.length > 0) specs.push(`${product.dimensions.length} x ${product.dimensions.width} x ${product.dimensions.height} cm`);
            doc.font('Helvetica').fontSize(9).text(specs.join(' / '), 420, y, { width: 150 });
        } else {
            doc.text(`${item.quantity}x`, 50, y, { width: 40 });
            doc.font('Helvetica-Bold').fillColor('red').text('[Product not found in database]', 90, y, { width: 400 });
            doc.fillColor('black');
        }
        
        doc.rect(540, y - 5, 20, 20).stroke();
        
        doc.moveDown(1.5);
    }

    doc.end();

  } catch (err) {
    console.error("Error generating picklist:", err.message);
    res.status(500).send('Server Error while generating picklist');
  }
});


module.exports = router;