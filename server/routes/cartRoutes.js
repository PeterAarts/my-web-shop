const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const authGuestMiddleware = require('../middleware/authGuestMiddleware');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// A helper function to find a user's or guest's cart
const findCart = async (req) => {
  if (req.user) {
    return await Cart.findOne({ user: req.user.id });
  }
  if (req.guestToken) {
    return await Cart.findOne({ guestToken: req.guestToken });
  }
  return null;
};

// @route   GET api/cart
// @desc    Get the current user's or guest's cart
// @access  Public/Private
router.get('/', authGuestMiddleware, async (req, res) => {
  try {
    const cart = await findCart(req);
    if (!cart) {
      return res.json({ items: [] });
    }
    // Populate product details before sending back
    const populatedCart = await cart.populate({ path: 'items.productId', model: 'Product' });
    res.json(populatedCart);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/cart/add
// @desc    Add an item to a cart, or create a new cart
// @access  Public/Private

router.post('/add', authGuestMiddleware, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found.' });
    }

    let cart = await findCart(req);
    const quantityInCart = cart ? (cart.items.find(item => item.productId.toString() === productId)?.quantity || 0) : 0;

    // Check if the requested quantity exceeds the total available stock.
    if (quantity > product.stockQuantity - quantityInCart) {
      const availableStock = product.stockQuantity - quantityInCart;
      return res.status(400).json({ msg: `Not enough stock for ${product.name}. Only ${availableStock} more available.` });
    }

    let guestToken = req.guestToken;

    if (!cart) {
      console.log('--- No existing cart found. Creating a new one. ---'); // DEBUG LOG
      const cartData = {};
      if (req.user) {
        cartData.user = req.user.id;
      } else {
        guestToken = crypto.randomBytes(32).toString('hex');
        cartData.guestToken = guestToken;
      }
      cart = new Cart(cartData);
    } else {
       console.log(`--- Found existing cart: ${cart._id} ---`); // DEBUG LOG
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    // --- ADD THESE LOGS ---
    console.log('Attempting to save cart with data:', JSON.stringify(cart, null, 2));
    const savedCart = await cart.save();
    console.log('--- Cart saved successfully! Document ID:', savedCart._id);
    // --- END ADDED LOGS ---
    
    const populatedCart = await savedCart.populate({
      path: 'items.productId',
      model: 'Product'
    });
    
    res.json({ cart: populatedCart, guestToken });

  } catch (err) {
    // --- ADD THIS LOG ---
    console.error('--- ERROR in /cart/add route: ---', err);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/cart/remove/:productId
// @desc    Remove an item from a cart
// @access  Public/Private
router.delete('/remove/:productId', authGuestMiddleware, async (req, res) => {
  try {
    // Find the user's or guest's cart
    const cart = await findCart(req);
    if (!cart) {
      return res.status(404).json({ msg: 'Cart not found.' });
    }

    // Find the index of the item to remove
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === req.params.productId);

    // If the item exists, remove it
    if (itemIndex > -1) {
      cart.items.splice(itemIndex, 1);
    } else {
      return res.status(404).json({ msg: 'Item not found in cart.' });
    }

    // Save the updated cart
    await cart.save();
    
    // Return the full, updated cart to the frontend
    const populatedCart = await cart.populate({
      path: 'items.productId',
      model: 'Product'
    });
    
    res.json({ cart: populatedCart });

  } catch (err) {
    console.error('Error removing item from cart:', err);
    res.status(500).send('Server Error');
  }
});
// @route   DELETE api/cart
// @desc    Delete the current user's or guest's cart
// @access  Public/Private
router.delete('/', authGuestMiddleware, async (req, res) => {
  try {
    const cart = await findCart(req);
    if (cart) {
      await Cart.deleteOne({ _id: cart._id });
    }
    res.json({ msg: 'Cart cleared successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;