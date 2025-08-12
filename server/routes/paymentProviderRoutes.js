// FILE: server/routes/paymentProviderRoutes.js

const express = require('express');
const router = express.Router();
const PaymentProvider = require('../models/PaymentProvider');
const auth = require('../middleware/authMiddleware');

// @route   GET api/payment-providers
// @desc    Get all payment providers for the admin panel
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
  try {
    const providers = await PaymentProvider.find().sort({ isOnline: -1, name: 1 });
    res.json(providers);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/payment-providers/:id
// @desc    Update a payment provider's details
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  // ADDED: requiresRegistration to the destructured body
  const { isEnabled, requiresRegistration, mode, credentials, instructions } = req.body;

  const providerFields = {};
  if (isEnabled !== undefined) providerFields.isEnabled = isEnabled;
  if (requiresRegistration !== undefined) providerFields.requiresRegistration = requiresRegistration; 
  if (mode) providerFields.mode = mode;
  if (credentials) providerFields.credentials = credentials;
  if (instructions !== undefined) providerFields.instructions = instructions;

  try {
    const provider = await PaymentProvider.findByIdAndUpdate(
      req.params.id,
      { $set: providerFields },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ msg: 'Payment provider not found' });
    }
    res.json({ msg: `${provider.name} updated successfully.`, provider });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
