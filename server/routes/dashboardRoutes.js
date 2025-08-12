// FILE: server/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Story = require('../models/StoryItem');
const Order = require('../models/Order');

// Middleware to check if the user is an admin or reviewer
const adminAuth = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'reviewer')) {
        return res.status(403).json({ msg: 'Access denied. Admins or Reviewers only.' });
    }
    next();
};

// @route   GET api/dashboard/stats
router.get('/stats', auth, adminAuth, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sessionsCollection = mongoose.connection.collection('sessions');

        const [
            totalProducts, totalUsers, totalStories, newOrders, activeVisitors, salesData
        ] = await Promise.all([
            Product.countDocuments(),
            User.countDocuments(),
            Story.countDocuments(),
            Order.countDocuments({ status: 'created' }),
            sessionsCollection.countDocuments({ expires: { $gte: new Date() } }),
            Order.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);

        res.json({
            totalProducts, totalUsers, totalStories, newOrders,
            activeSessions: activeVisitors,
            salesTotal: salesData.length > 0 ? salesData[0].total : 0,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/dashboard/activity
router.get('/activity', auth, adminAuth, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activity = await Order.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $project: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, productsSold: { $sum: "$items.quantity" } } },
            { $group: { _id: "$date", ordersPerDay: { $sum: 1 }, productsSoldPerDay: { $sum: "$productsSold" } } },
            { $sort: { _id: 1 } }
        ]);
        
        res.json(activity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/dashboard/recent-orders
router.get('/recent-orders', auth, adminAuth, async (req, res) => {
    try {
        // UPDATED: Re-added .populate() now that the Order model supports it.
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'username'); // This will now work
        res.json(recentOrders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
