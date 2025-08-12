// File: server/routes/storyItemRoutes.js
const express = require('express');
const router = express.Router();
const StoryItem = require('../models/StoryItem');
const auth = require('../middleware/authMiddleware');

// @route   POST /api/stories
// @desc    Create a new story item
// @access  Protected
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, image, displayLocations, startDate, endDate, isActive } = req.body;

    const newStoryItem = new StoryItem({
      title,
      content,
      image,
      displayLocations,
      startDate,
      endDate
    });

    const storyItem = await newStoryItem.save();
    res.status(201).json({ msg: 'Story created successfully', data: storyItem });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/stories
// @desc    Get all story items (for Admin Panel)
router.get('/', async (req, res) => {
  try {
    const storyItems = await StoryItem.find().sort({ createdAt: -1 });
    res.json(storyItems);
  } catch (err)
  {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// NEW: This is the public route to fetch stories by their display location slug
// @route   GET api/stories/location/:locationSlug
// @desc    Get all active stories for a specific display location
// @access  Public
router.get('/location/:locationSlug', async (req, res) => {
  try {
    const locationSlug = req.params.locationSlug;

    // Find stories that are active, have the correct display location,
    // and are within their scheduled start/end dates.
    const stories = await StoryItem.find({
      displayLocations: locationSlug, // Find where the location slug is in the array
      $and: [
        { $or: [{ startDate: { $lte: new Date() } }, { startDate: null }] },
        { $or: [{ endDate: { $gte: new Date() } }, { endDate: null }] },
      ]
    }).sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   PUT /api/stories/:id
// @desc    Update a story item
// @access  Protected
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, content, image, displayLocations, startDate, endDate, isActive } = req.body;
        
        const storyFields = {};
        if (title) storyFields.title = title;
        if (content) storyFields.content = content;
        if (image || image === null) storyFields.image = image;
        if (displayLocations) storyFields.displayLocations = displayLocations;
        if (startDate || startDate === null) storyFields.startDate = startDate;
        if (endDate || endDate === null) storyFields.endDate = endDate;
        if (isActive !== undefined) storyFields.isActive = isActive;


        let storyItem = await StoryItem.findById(req.params.id);
        if (!storyItem) {
            return res.status(404).json({ msg: 'Story item not found' });
        }
        
        storyItem = await StoryItem.findByIdAndUpdate(
            req.params.id, 
            { $set: storyFields }, 
            { new: true, runValidators: true }
        );
        
        res.json({ msg: 'Story updated successfully', data: storyItem });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/stories/:id
// @desc    Delete a story item
// @access  Protected
router.delete('/:id', auth, async (req, res) => {
    try {
        const storyItem = await StoryItem.findById(req.params.id);
        if (!storyItem) {
            return res.status(404).json({ msg: 'Story item not found' });
        }
        await StoryItem.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Story item removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
