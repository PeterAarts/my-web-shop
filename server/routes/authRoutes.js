// FILE: server/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Setting = require('../models/Setting');
// UPDATED: Import the new service functions
const { sendRegistrationEmail, sendPasswordResetEmail } = require('../services/templateEmailService');

// @route   POST /api/auth/register
// @desc    Register a new user for the public shop
// @access  Public (conditional)
router.post('/register', async (req, res) => {
    try {
        const settings = await Setting.getSingleton();
        if (!settings.allowShopRegistration) {
            return res.status(403).json({ msg: 'Sorry, user registration is currently disabled.' });
        }

        const { username, email, password, newsletterSubscribed } = req.body;

        let userByEmail = await User.findOne({ email });
        if (userByEmail) {
            return res.status(400).json({ msg: 'A user with this email already exists.' });
        }
        let userByUsername = await User.findOne({ username });
        if (userByUsername) {
            return res.status(400).json({ msg: 'This username is already taken.' });
        }

        user = new User({
            username,
            email,
            password,
            newsletterSubscribed,
            role: 'customer' // Public registration is always for customers
        });

        const verificationToken = user.generateVerificationToken();
        await user.save();

        // UPDATED: Replaced hardcoded email with a call to the template service
        const verificationUrl = `${process.env.VUE_APP_URL}/verify-email/${verificationToken}`;
        await sendRegistrationEmail(user, verificationUrl);
        
        res.status(201).json({ msg: 'Registration successful. Please check your email to verify your account.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (for ADMIN SITE ONLY)
router.post('/login', async (req, res) => {
    // This route expects a USERNAME, not an email.
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username }).select('+password');
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // This route specifically BLOCKS customers.
        if (user.role !== 'admin' && user.role !== 'reviewer') {
            return res.status(403).json({ msg: 'Forbidden: You do not have permission to access the admin site.' });
        }
        
        if (!user.isVerified) {
            return res.status(401).json({ msg: 'Account not verified. Please check your email.' });
        }

        const payload = { user: { id: user.id, role: user.role } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { _id: user.id, username: user.username, email: user.email, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// =================================================================
// --- NEW ROUTE FOR CUSTOMER LOGIN ---
// =================================================================
// @route   POST /api/auth/shop-login
// @desc    Authenticate a shop customer & get token
// @access  Public
router.post('/shop-login', async (req, res) => {
    // This route correctly expects an EMAIL and password.
    const { email, password } = req.body;
    try {
        // Find the user by their email address
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Ensure the user has verified their email
        if (!user.isVerified) {
            return res.status(401).json({ msg: 'Account not verified. Please check your email.' });
        }

        // Create the JWT payload
        const payload = { user: { id: user.id, role: user.role } };

        // Sign and return the token
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' }, // Or a duration you prefer
            (err, token) => {
                if (err) throw err;
                // Return the token and user info (without the password)
                res.json({ token, user: { _id: user.id, username: user.username, email: user.email, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- VERIFICATION AND PASSWORD RESET ROUTES ---

// @route   GET /api/auth/verify-email/:token
router.get('/verify-email/:token', async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired verification token.' });
        }

        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({ msg: 'Email verified successfully. You can now log in.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.json({ msg: 'If a user with that email exists, a password reset link has been sent.' });
        }

        const resetToken = user.generatePasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // UPDATED: Replaced hardcoded email with a call to the template service
        const resetUrl = `${process.env.VUE_APP_URL}/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user, resetUrl);

        res.json({ msg: 'If a user with that email exists, a password reset link has been sent.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired password reset token.' });
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({ msg: 'Password has been reset successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;