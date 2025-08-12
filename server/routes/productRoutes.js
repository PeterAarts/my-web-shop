// File: server/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const Setting = require('../models/Setting'); // Import the Setting model

// @route   GET api/products
// @desc    Get all products (with dynamic filtering based on settings)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.findOne();
    
    // Start with a base array of conditions that all products must meet
    const filterConditions = [{ active: true }];

    // Add more conditions based on shop settings
    if (settings) {
      if (settings.hideOutOfStockProducts) {
        filterConditions.push({ stockQuantity: { $gt: 0 } });
      }
      if (settings.hideExpiredProducts) {
        // FIX: This is the corrected query structure.
        // It finds products that either have no expiry date OR have an expiry date in the future.
        filterConditions.push({
          $or: [
            { expiresAt: null },
            { expiresAt: { $gte: new Date() } }
          ]
        });
      }
    }

    // Combine all conditions. If there's more than one, wrap them in an $and operator.
    const filter = filterConditions.length > 1 ? { $and: filterConditions } : filterConditions[0];

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/products/:id
// @desc    Get a single product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   POST api/products
// @desc    Create a new product
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const productData = req.body;
    // 1. Fetch the settings to check for SKU generation mode
    const settings = await Setting.getSingleton(); // Or your method for getting settings
    // 2. Check if the SKU should be generated automatically
    if (settings.productSettings.skuGeneration === 'automatic') {
      // 3. Generate the new SKU
      const prefix = settings.productSettings.skuPrefix || '';
      const nextNumber = settings.productSettings.skuNextNumber;
      productData.sku = `${prefix}${nextNumber}`;
      // 4. CRITICAL: Increment the next number and save the settings for the next product
      settings.productSettings.skuNextNumber += 1;
      await settings.save();
    }
    // 5. Create and save the new product with either the generated or manual SKU
    const newProduct = new Product(productData);
    await newProduct.save();
    res.status(201).json({ msg: `Product ${newProduct.sku} - ${newProduct.name} created successfully`, data: newProduct });

  } catch (err) {
    // Add specific error handling for unique SKU constraint violation
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'A product with this SKU already exists.' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/products/:id
// @desc    Update a product
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const {
    name, description, price, stockQuantity, stockLimit, category,
    tags, weight, dimensions, images, expiresAt, active
  } = req.body;

  const productFields = {
    name, description, price, stockQuantity, stockLimit, category,
    tags, weight, dimensions, images, expiresAt: expiresAt || null, active
  };

  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: productFields },
      { new: true, runValidators: true }
    );

    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      const errorMessages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: `Validation Error: ${errorMessages.join(', ')}`, errors: err.errors });
    }
    res.status(500).send('Server Error');
  }
});


// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    await product.deleteOne();
    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH api/products/:id/reserve
// @desc    Reserve a specific quantity of a product
// @access  Private (user must be logged in)
router.patch('/:id/reserve', auth, async (req, res) => {
  const { quantity } = req.body;
  const quantityToReserve = Number(quantity);

  if (!quantityToReserve || quantityToReserve <= 0) {
    return res.status(400).json({ msg: 'A valid quantity is required.' });
  }

  try {
    // First, find the product to ensure it exists and has enough stock.
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    if (product.stockQuantity < quantityToReserve) {
      return res.status(400).json({ msg: 'Not enough stock available.' });
    }

    // Now, perform the atomic update.
    // Use $inc to decrement the stockQuantity field. This is crucial to prevent race conditions.
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { stockQuantity: -quantityToReserve } },
      { new: true } // Return the updated document
    );

    res.json({
      msg: 'Stock reserved successfully',
      productId: updatedProduct._id,
      newStockQuantity: updatedProduct.stockQuantity
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   PATCH api/products/:id/release
// @desc    Release a specific quantity of a product (add it back to stock)
// @access  Private
router.patch('/:id/release', auth, async (req, res) => {
  const { quantity } = req.body;
  const quantityToRelease = Number(quantity);

  if (!quantityToRelease || quantityToRelease <= 0) {
    return res.status(400).json({ msg: 'A valid quantity is required.' });
  }

  try {
    // We don't need to check for stock here, just add it back.
    // Use $inc with a positive number to atomically increase the stock.
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { stockQuantity: quantityToRelease } },
      { new: true } // Return the updated document
    );

    if (!updatedProduct) {
        return res.status(404).json({ msg: 'Product not found' });
    }

    res.json({
      msg: 'Stock released successfully',
      productId: updatedProduct._id,
      newStockQuantity: updatedProduct.stockQuantity
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});




module.exports = router;
