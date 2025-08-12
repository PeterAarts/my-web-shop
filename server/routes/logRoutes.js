const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const OrderStatusLog = require('../models/OrderStatusLog');
const EmailLog = require('../models/EmailStatusLog');

// @route   GET api/logs/:orderId
// @desc    Get a combined history of status and email logs for an order
// @access  Admin
router.get('/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch both types of logs concurrently
    const [statusLogs, emailLogs] = await Promise.all([
      OrderStatusLog.find({ orderId }).populate('changedBy', 'username').lean(),
      EmailLog.find({ orderId }).lean()
    ]);

    // Combine and format the logs into a single timeline
    const timeline = [
      ...statusLogs.map(log => ({ ...log, type: 'status', date: log.createdAt })),
      ...emailLogs.map(log => ({ ...log, type: 'email', date: log.createdAt }))
    ];

    // Sort the combined timeline by date, most recent first
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(timeline);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;