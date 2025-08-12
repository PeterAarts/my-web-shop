// File: server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// --- ROUTES FOR ANY LOGGED-IN USER ---
// MOVED UP: These specific routes must come before the generic /:id routes.

// @route   GET api/users/me
// @desc    Get current logged-in user's profile
// @access  Private (Any authenticated user)
router.get('/me', auth, async (req, res) => {
  try {
    // req.user is already populated by the auth middleware, so we can just send it.
    // The middleware already removed the password.
    if (!req.user) {
        return res.status(404).json({ msg: 'User not found' });
    }
    res.json(req.user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/me
// @desc    Update current logged-in user's profile (username, newsletter, address)
// @access  Private
router.put('/me', auth, async (req, res) => {
    // MERGED: Added shippingAddress to the destructured body and update logic.
    const { username, newsletterSubscribed, shippingAddress } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (username) user.username = username;
        if (newsletterSubscribed !== undefined) user.newsletterSubscribed = newsletterSubscribed;
        if (shippingAddress) user.shippingAddress = shippingAddress;
        
        await user.save();
        
        // Return the updated user object without the password
        const userToReturn = user.toObject();
        delete userToReturn.password;
        res.json(userToReturn);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/me/password
// @desc    Change current logged-in user's password
// @access  Private
router.put('/me/password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        // Select '+password' to explicitly include it, as it's excluded by default
        const user = await User.findById(req.user.id).select('+password');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Incorrect current password.' });

        user.password = newPassword;
        await user.save();
        res.json({ msg: 'Password updated successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/users/me
// @desc    Delete current logged-in user's account
// @access  Private
router.delete('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        await user.deleteOne();
        res.json({ msg: 'Your account has been permanently deleted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- ADMIN-ONLY ROUTES ---

// Middleware to check if the user is an admin
const adminAuth = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }
    next();
};

// @route   GET api/users
// @desc    Get all users (Admin)
// @access  Admin
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ username: 1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users
// @desc    Create a new user (Admin)
// @access  Admin
router.post('/', auth, adminAuth, async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User with this email already exists.' });
    }
    user = new User({ username, email, password, role, isVerified: true });
    await user.save();
    res.status(201).json({ msg: 'User created successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id
// @desc    Update a user's role or password (Admin)
// @access  Admin
router.put('/:id', auth, adminAuth, async (req, res) => {
  const { role, newPassword } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    if (role) user.role = role;
    if (newPassword) user.password = newPassword;
    await user.save({ validateModifiedOnly: true });
    res.json({ msg: 'User updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete a user (Admin)
// @access  Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.id === req.user.id) {
        return res.status(400).json({ msg: 'Admins cannot delete their own account from this panel.' });
    }
    await user.deleteOne();
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;