// File: server/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Setting = require('../models/Setting');

// GET route remains the same...
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.findOne();
    if (!settings) {
      const newSettings = new Setting({});
      await newSettings.save();
      return res.json(newSettings);
    }
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/settings
// @desc    Update settings and return a success message
// @access  Private
router.put('/', auth, async (req, res) => {
  try {
    const settingsFields = req.body;
    delete settingsFields._id; // Prevent trying to update the immutable _id

    const updatedSettings = await Setting.findOneAndUpdate(
      {},
      { $set: settingsFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // FIX: Respond with a clear success message and the updated data
    res.json({ 
      msg: 'Settings saved successfully.',
     // settings: updatedSettings 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
