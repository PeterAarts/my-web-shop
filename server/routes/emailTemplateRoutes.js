// FILE: server/routes/emailTemplateRoutes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const EmailTemplate = require('../models/EmailTemplate');


// Middleware to check for admin role
const adminAuth = (req, res, next) => {
    // Ensure req.user is populated by the 'auth' middleware first
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ msg: 'Admin access required' });
    }
};

// Define the list of slugs that are hardcoded in the application logic.
const requiredSystemSlugs = [
    { slug: 'order-confirmation', description: 'Sent to customer after a new order is placed.' },
    { slug: 'order-shipped', description: 'Sent when an order status is updated to "shipped".' },
    { slug: 'order-cancelled', description: 'Sent when an order status is updated to "cancelled".' },
    { slug: 'pending-payment-instructions', description: 'Sent for new orders that require manual payment.' },
    { slug: 'payment-received', description: 'Sent when a manual payment is received.' },
    { slug: 'password-reset', description: 'Sent when a user requests to reset their password.' },
    { slug: 'user-registration-confirmation', description: 'Sent to a new user upon successful registration.' }
];

// @route   GET api/email-templates/system-slugs
// @desc    Get a list of required system email template slugs
// @access  Admin
router.get('/system-slugs', auth, adminAuth, (req, res) => {
    res.json(requiredSystemSlugs);
});

// @route   GET api/email-templates
// @desc    Get all email templates
// @access  Admin
router.get('/', auth, adminAuth, async (req, res) => {
    try {
        const templates = await EmailTemplate.find().sort({ name: 1 });
        res.json(templates);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST api/email-templates
// @desc    Create a new email template
// @access  Admin
router.post('/', auth, adminAuth, async (req, res) => {
    const { name, slug, subject, body } = req.body;

    if (!name || !slug || !subject || !body) {
        return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    try {
        let template = await EmailTemplate.findOne({ slug });
        if (template) {
            return res.status(400).json({ msg: 'A template with this slug already exists.' });
        }

        template = new EmailTemplate({
            name,
            slug,
            subject,
            body
        });

        await template.save();
        res.status(201).json(template);
    } catch (err) {
        // Log the full error on the server for debugging
        console.error('Error creating email template:', err); 
        // Send a more specific error message back to the client
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
});

// @route   PUT api/email-templates/:id
// @desc    Update an existing email template
// @access  Admin
router.put('/:id', auth, adminAuth, async (req, res) => {
    const { name, slug, subject, body, isActive } = req.body;

    try {
        let template = await EmailTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ msg: 'Template not found' });
        }

        if (slug && slug !== template.slug) {
            const existingTemplate = await EmailTemplate.findOne({ slug });
            if (existingTemplate) {
                return res.status(400).json({ msg: 'This slug is already in use by another template.' });
            }
        }

        const updateFields = {};
        if (name) updateFields.name = name;
        if (slug) updateFields.slug = slug;
        if (subject) updateFields.subject = subject;
        if (body) updateFields.body = body;
        if (typeof isActive === 'boolean') updateFields.isActive = isActive;

        template = await EmailTemplate.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        );

        res.json(template);
    } catch (err) {
        console.error('Error updating email template:', err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
});

// @route   DELETE api/email-templates/:id
// @desc    Delete an email template
// @access  Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
    try {
        const template = await EmailTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ msg: 'Template not found' });
        }

        const protectedSlugs = ['order-confirmation', 'order-shipped', 'order-cancelled'];
        if (protectedSlugs.includes(template.slug)) {
            return res.status(400).json({ msg: 'This is a protected template and cannot be deleted.' });
        }

        await EmailTemplate.findByIdAndRemove(req.params.id);
        res.json({ msg: 'Template removed successfully' });
    } catch (err) {
        console.error('Error deleting email template:', err);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
});


module.exports = router;
