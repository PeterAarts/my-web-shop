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

// @route   POST api/shipping-providers
// @desc    Create a new shipping provider
// @access  Private/Admin
router.post('/', auth, async (req, res) => {
  const { name, providerKey, apiUrl, isEnabled } = req.body;
  try {
    let provider = await ShippingProvider.findOne({ providerKey });
    if (provider) {
        return res.status(400).json({ msg: 'A provider with this key already exists.' });
    }

    provider = new ShippingProvider({
        name,
        providerKey,
        apiUrl,
        isEnabled,
        credentials: { apiKey: '' },
        rateCard: {} // Initialize with an empty rate card
    });

    await provider.save();
    res.status(201).json(provider);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   PUT api/shipping-providers/:id
// @desc    Update a shipping provider's details
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  // 1. Destructure the new rateCard field from the request body
  const { name, isEnabled, apiUrl, credentials, rateCard } = req.body;

  // 2. Build the fields object to update dynamically
  const providerFields = {};
  if (name) providerFields.name = name;
  if (isEnabled !== undefined) providerFields.isEnabled = isEnabled;
  if (apiUrl) providerFields.apiUrl = apiUrl;
  if (credentials) providerFields.credentials = credentials;
  if (rateCard) providerFields.rateCard = rateCard; // Add rateCard to the update object

  try {
    // 3. Find the provider by ID and update it with the new fields
    const provider = await ShippingProvider.findByIdAndUpdate(
      req.params.id,
      { $set: providerFields },
      { new: true } // Return the updated document
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
