// File: server/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Category = require('../models/Category');

// @route   GET api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/categories
// @desc    Create a new category
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;
  try {
    let category = await Category.findOne({ name });
    if (category) {
      return res.status(400).json({ msg: 'Category with this name already exists.' });
    }
    category = new Category({ name, description });
    await category.save();
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/categories/bulk
// @desc    Create multiple new categories at once
// @access  Private
router.post('/bulk', auth, async (req, res) => {
  const { names } = req.body;

  if (!names || !Array.isArray(names)) {
    return res.status(400).json({ msg: 'Invalid input: "names" array is required.' });
  }

  try {
    const existingCategories = await Category.find({ name: { $in: names } }).select('name');
    const existingNames = existingCategories.map(cat => cat.name);
    
    const newCategoryNames = names.filter(name => !existingNames.includes(name));

    if (newCategoryNames.length === 0) {
      return res.json({ msg: 'All categories provided already exist.', created: [] });
    }

    const categoriesToCreate = newCategoryNames.map(name => ({ name }));
    const createdCategories = await Category.insertMany(categoriesToCreate);
    
    res.status(201).json({ msg: 'Bulk creation complete.', created: createdCategories });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/categories/:id
// @desc    Delete a category
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    await category.deleteOne();
    res.json({ msg: 'Category removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
