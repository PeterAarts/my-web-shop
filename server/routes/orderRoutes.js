// FILE: server/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const Setting = require('../models/Setting');
const Product = require('../models/Product');
const OrderStatusLog = require('../models/OrderStatusLog');
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
// @desc    Update an order's status and handle side-effects
// @access  Protected
router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['created', 'received', 'processing', 'ready for shipment', 'pending payment', 'shipped', 'cancelled'];
  if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Invalid status provided' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized to update this order.' });
    }
    
    const oldStatus = order.status;
    
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity }
        });
      }
      console.log(`Stock restored for cancelled order: ${order.orderNumber}`);
    }

    order.status = status;
    const updatedOrder = await order.save();
    await OrderStatusLog.create({
        orderId: order._id,
        orderNumber: order.orderNumber,
        changedBy: req.user.id, // The logged-in admin's ID
        oldStatus: oldStatus,
        newStatus: status,
    });

    const fullOrderDetails = await Order.findById(updatedOrder._id).populate('user', 'name email');

    if (status === 'shipped' && oldStatus !== 'shipped') {
      sendOrderShippedEmail(fullOrderDetails);
    } else if (status === 'cancelled' && oldStatus !== 'cancelled') {
      sendOrderCancelledEmail(fullOrderDetails);
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   PUT /api/orders/bulk-status
// @desc    Update the status of multiple orders
// @access  Protected
router.put('/bulk-status', auth, async (req, res) => {
  const { orderIds, status } = req.body;
  if (!orderIds || !status || !Array.isArray(orderIds)) {
    return res.status(400).json({ msg: 'Invalid request data' });
  }
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized for bulk updates.' });
    }
    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { status: status } }
    );
    res.json({ msg: `${result.modifiedCount} orders updated successfully.` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/orders/:id/picklist
// @desc    Generate a PDF pick list for a single order
// @access  Protected
router.get('/:id/picklist', auth, async (req, res) => {
  try {
    // 1. Fetch the fully populated order data, just like before
    const order = await Order.findById(req.params.id).populate({
      path: 'items.productId',
      model: 'Product',
      select: 'name dimensions weight sku'
    });

    if (!order) {
      return res.status(404).send('Order not found');
    }

    // 2. Create a new PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // 3. Set HTTP headers to trigger a PDF download in the browser
    const filename = `PickList-Order-${order.orderNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Added a try...catch block for the logo
    try {
        // This will attempt to load the logo from server/assets/logo.png
        doc.image('assets/logo.png', 50, 45, { width: 150 });
    } catch (error) {
        console.log('Logo file not found, using fallback text.');
        // If the logo is not found, this fallback text will be used
        doc.fontSize(12).font('Helvetica-Bold').text('Shop Manager', 50, 45);
    }

    // 4. Pipe the PDF output directly to the response stream
    doc.pipe(res);

    // --- 5. Draw the PDF Content ---
    doc.fontSize(20).text(setting.shopTitle + ' Pick List', 50, 50);

    doc.fontSize(10);
    const topPosition = 90;
    const leftColumnX = 50;
    const rightColumnX = 350;

    // Left Column
    doc.font('Helvetica-Bold').text('Order Number:', leftColumnX, topPosition);
    doc.font('Helvetica').text(order.orderNumber, 200, topPosition);

    doc.font('Helvetica-Bold').text('Customer:', leftColumnX, topPosition + 15);
    doc.font('Helvetica').text(`${order.customerDetails.name} (${order.customerDetails.email})`, 200, topPosition + 15);

    doc.font('Helvetica-Bold').text('Shipping:', leftColumnX, topPosition + 30);
    doc.font('Helvetica').text(order.shippingDetails.shippingMethodName, 200, topPosition + 30);

    // Right Column
    doc.font('Helvetica-Bold').text('Order Date:', rightColumnX, topPosition);
    doc.font('Helvetica').text(new Date(order.createdAt).toLocaleDateString(), 450, topPosition);

    doc.font('Helvetica-Bold').text('Payment:', rightColumnX, topPosition + 15);
    doc.font('Helvetica').text(`${order.paymentDetails.paymentMethod} (${order.paymentDetails.paymentStatus})`, 450, topPosition + 15);

    doc.moveDown(4);
    // Items Table Rows
    doc.fontSize(11);
    for (const item of order.items) {
        const product = item.productId;
        const y = doc.y;
        
        // Quantity and Product Name
        doc.text(`${item.quantity}x`, 50, y, { width: 40 });
        doc.font('Helvetica').fontSize(9).text(`SKU: ${product.sku}`, col2X, doc.y + 2);
        doc.text(product.name, 90, y, { width: 250 });
        
        // Specs
        let specs = [];
        if (product.weight > 0) specs.push(`${product.weight}g`);
        if (product.dimensions && product.dimensions.length > 0) specs.push(`${product.dimensions.length}x${product.dimensions.width}x${product.dimensions.height}cm`);
        doc.text(specs.join(' / '), 350, y, { width: 150 });
        
        // "Picked" Checkbox
        doc.rect(520, y - 5, 20, 20).stroke();
        
        doc.moveDown(1.5);
    }

    // 6. Finalize the PDF and end the stream
    doc.end();

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;