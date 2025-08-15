// FILE: server/routes/shippingProviderRoutes.js

const express = require('express');
const router = express.Router();
const ShippingProvider = require('../models/ShippingProvider');
const auth = require('../middleware/authMiddleware');

// @route   GET api/shipping-providers
// @desc    Get all shipping providers for the admin panel
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
  try {
    const providers = await ShippingProvider.find();
    res.json(providers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- REMOVED: POST api/shipping-providers ---
// This route is removed because providers should only be created
// automatically by the shippingSyncService when a new provider file is detected.
// Manually creating a provider from the UI is not a valid workflow.


// @route   PUT api/shipping-providers/:id
// @desc    Update a shipping provider's details
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  try {
    // Use the entire request body for the update, as it's controlled by the admin panel.
    // Mongoose will only update the fields that are present in the model.
    const providerFields = req.body;
    
    // It's good practice to prevent the immutable _id from being part of the update operation
    delete providerFields._id;

    const provider = await ShippingProvider.findByIdAndUpdate(
      req.params.id,
      { $set: providerFields },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!provider) {
        return res.status(404).json({ msg: 'Provider not found' });
    }

    res.json(provider);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
