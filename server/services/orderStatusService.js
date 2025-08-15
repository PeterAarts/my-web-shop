const Order = require('../models/Order');
const Product = require('../models/Product');
const OrderStatusLog = require('../models/OrderStatusLog');
const { generateAndSavePickList } = require('./pickListService');
const {
  sendOrderShippedEmail,
  sendOrderCancelledEmail,
  sendPaymentReceivedEmail,
} = require('./templateEmailService');

// Defines the "State Machine": which status can transition to which.
const VALID_TRANSITIONS = {
  'created': ['pending payment', 'processing', 'cancelled'],
  'pending payment': ['received', 'cancelled'],
  'received': ['processing', 'cancelled'],
  'processing': ['ready for shipment', 'shipped', 'cancelled'],
  'ready for shipment': ['shipped', 'cancelled'],
  'shipped': [], // Terminal status, cannot be changed
  'cancelled': [], // Terminal status, cannot be changed
};

/**
 * Changes the status of an order, enforcing business rules and handling side effects.
 * @param {string} orderId - The ID of the order to update.
 * @param {string} newStatus - The target status.
 * @param {string} userId - The ID of the user performing the change.
 * @param {string} [comment] - An optional comment for the log.
 * @returns {Promise<Order>} The updated order document.
 */
const changeOrderStatus = async (orderId, newStatus, userId, comment = '') => {
  // UPDATED: Populate product details needed for picklist generation
  const order = await Order.findById(orderId).populate('items.productId', 'sku name weight dimensions');

  if (!order) {
    throw new Error('Order not found');
  }

  const originalStatus = order.status;

  // 1. VALIDATION: Check if the transition is allowed by the state machine
  if (!VALID_TRANSITIONS[originalStatus]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from "${originalStatus}" to "${newStatus}".`);
  }

  // 2. SIDE EFFECTS: Handle logic based on the new status

  // --- Automatic Picklist Generation ---
  // UPDATED: Check for 'picklistFilename' and save the returned filename
  if (newStatus === 'received' && !order.picklistFilename) {
    try {
      const picklistFilename = await generateAndSavePickList(order);
      order.picklistFilename = picklistFilename; // Save the filename to the order
    } catch (err) {
      console.error(`Failed to generate picklist for order ${order.orderNumber}:`, err);
      // For now, we'll just log the error and continue with the status change.
    }
  }

  // Restore stock if an order is cancelled
  if (newStatus === 'cancelled' && originalStatus !== 'cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity } });
    }
    await sendOrderCancelledEmail(order, order.viewToken);
  }

  // Decrement stock when moving to fulfillment
  const unfulfilledStatuses = ['created', 'received', 'pending payment'];
  if (unfulfilledStatuses.includes(originalStatus) && ['processing', 'shipped'].includes(newStatus)) {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: -item.quantity } });
    }
  }

  // Send emails for key fulfillment milestones
  if (newStatus === 'shipped') {
    await sendOrderShippedEmail(order, order.viewToken);
  }
  if (newStatus === 'received' && originalStatus === 'pending payment') {
    await sendPaymentReceivedEmail(order, order.viewToken);
  }

  // 3. UPDATE & SAVE: Apply the new status to the order
  order.status = newStatus;
  const updatedOrder = await order.save();

  // 4. LOGGING: Create an audit trail entry for the change
  await OrderStatusLog.create({
    orderId: updatedOrder._id,
    orderNumber: updatedOrder.orderNumber,
    changedBy: userId,
    oldStatus: originalStatus,
    newStatus: newStatus,
    comment: comment,
  });

  return updatedOrder;
};

module.exports = { changeOrderStatus };
