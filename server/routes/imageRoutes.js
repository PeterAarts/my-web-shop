// File: server/routes/imageRoutes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const Product = require('../models/Product');
const StoryItem = require('../models/StoryItem');
const Settings = require('../models/Setting'); 

const uploadsDirectory = path.join(__dirname, '..', 'public', 'uploads');

// GET /api/images - Get all images with details
router.get('/', auth, async (req, res) => {
  try {
    const files = await fs.promises.readdir(uploadsDirectory);
    const imageDetailsPromises = files.map(async (fileName) => {
      const filePath = path.join(uploadsDirectory, fileName);
      try {
        const stats = await fs.promises.stat(filePath);
        if (stats.isFile()) {
          const metadata = await sharp(filePath).metadata();
          return {
            filename: fileName,
            path: `/uploads/${fileName}`,
            size: stats.size,
            dimensions: { width: metadata.width, height: metadata.height },
            createdAt: stats.mtime,
          };
        }
        return null;
      } catch (e) {
        return null; 
      }
    });
    let fileDetails = await Promise.all(imageDetailsPromises);
    fileDetails = fileDetails.filter(file => file !== null);
    fileDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(fileDetails);
  } catch (err) {
    console.error('Could not list the directory.', err);
    res.status(500).send('Server Error');
  }
});

// GET /api/images/usage/:filename - Find where an image is used
router.get('/usage/:filename', auth, async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const imagePath = `/uploads/${filename}`;
    
    const [storyUsage, productUsage, settingsUsage] = await Promise.all([
      StoryItem.find({ 'image.path': imagePath }).select('title').lean(),
      Product.find({ 
        $or: [
          { imageUrl: imagePath },
          { 'images.path': imagePath }
        ]
      }).select('name').lean(),
      Settings.findOne({ headerImageUrl: { $regex: filename, $options: 'i' } }).select('shopTitle').lean()
    ]);

    const usage = [
      ...storyUsage.map(item => ({ type: 'Story', name: item.title })),
      ...productUsage.map(item => ({ type: 'Product', name: item.name })),
    ];

    if (settingsUsage) {
      usage.push({ type: 'Setting', name: 'Header Image' });
    }
    
    res.json(usage);
  } catch (error) {
    console.error('Error finding image usage:', error);
    res.status(500).json({ msg: 'Server error while checking image usage.' });
  }
});

// MODIFIED: Replaced the DELETE route with a more robust version that retries on EBUSY errors
// @route   DELETE /api/images/:filename
// @desc    Delete an image from the server
// @access  Protected
router.delete('/:filename', auth, async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDirectory, filename);
  let retries = 5;

  const tryDelete = async () => {
    try {
      await fs.promises.unlink(filePath);
      res.json({ msg: `Image '${filename}' deleted successfully.` });
    } catch (error) {
      if (error.code === 'EBUSY' && retries > 0) {
        retries--;
        console.log(`File is busy. Retrying deletion for ${filename}... (${retries} retries left)`);
        setTimeout(tryDelete, 100); // Wait 100ms and try again
      } else if (error.code === 'ENOENT') {
        res.status(404).json({ msg: 'File not found.' });
      } else {
        console.error(`Error deleting file ${filename}:`, error);
        res.status(500).json({ msg: 'An error occurred while deleting the file. Check server permissions.' });
      }
    }
  };

  tryDelete();
});

module.exports = router;
