// FILE: server/services/orderPricingService.js
// Turns what the browser sends at checkout into an order the server trusts.
//
// The browser only says WHICH products, HOW MANY, WHERE to ship and WHICH shipping
// method. Names, prices, the shipping cost and the total come from the database and
// the shipping calculation. If the total the customer saw differs from the real one
// (a price changed meanwhile, or the request was tampered with), the order is refused
// with the correct total, so the customer can check it.
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { quoteRates } = require('./shippingQuoteService');

const MAX_LINES = 100;
const MAX_QUANTITY = 999;

const round2 = n => Math.round(n * 100) / 100;

function refuse(msg, extra = {}) {
  const e = new Error(msg);
  e.status = 400;
  Object.assign(e, extra);
  return e;
}

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function cleanCustomer(c) {
  const customer = { name: text(c?.name, 200), email: text(c?.email, 254).toLowerCase(), address: text(c?.address, 500) };
  if (!customer.name || !customer.address) throw refuse('Please fill in your name and address.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw refuse('Please fill in a valid email address.');
  return customer;
}

/**
 * @param {object} orderDetails  what the checkout sends
 * @returns {Promise<{items, subtotal, totalAmount, shippingDetails, customerDetails, structuredAddress}>}
 * Throws an error with .status = 400 (and .outOfStockItems or .priceChanged) when it can't be placed.
 */
async function priceOrder(orderDetails) {
  if (!orderDetails || typeof orderDetails !== 'object') throw refuse('Order details are missing.');

  // 1. Which products, how many. Same product twice = one line.
  const lines = Array.isArray(orderDetails.items) ? orderDetails.items : [];
  if (!lines.length) throw refuse('Your cart is empty.');
  if (lines.length > MAX_LINES) throw refuse('Your cart has too many items.');
  const wanted = new Map();
  for (const line of lines) {
    const id = String(line?.productId ?? '');
    const qty = Number(line?.quantity);
    if (!mongoose.isValidObjectId(id)) throw refuse('Your cart contains an unknown product.');
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY) throw refuse('Your cart contains an invalid quantity.');
    wanted.set(id, (wanted.get(id) || 0) + qty);
  }

  // 2. Names, prices and stock from the database
  const products = await Product.find({ _id: { $in: [...wanted.keys()] } });
  const byId = new Map(products.map(p => [String(p._id), p]));
  const now = new Date();
  const items = [];
  const outOfStockItems = [];
  for (const [id, quantity] of wanted) {
    const p = byId.get(id);
    const sellable = p && p.active !== false && !(p.expiresAt && p.expiresAt < now);
    if (!sellable) {
      outOfStockItems.push({ name: p ? p.name : 'Unknown product', requested: quantity, available: 0 });
    } else if (p.stockQuantity < quantity) {
      outOfStockItems.push({ name: p.name, requested: quantity, available: p.stockQuantity });
    } else {
      items.push({ productId: p._id, name: p.name, price: p.price, quantity });
    }
  }
  if (outOfStockItems.length) throw refuse('One or more items are out of stock.', { outOfStockItems });
  const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));

  // 3. Shipping: the chosen method, priced by the server for this address and cart
  const address = orderDetails.structuredAddress;
  const methodId = text(orderDetails.shippingDetails?.shippingMethodId, 200);
  if (!address || typeof address !== 'object' || !methodId) throw refuse('Please choose a shipping method.');
  const quote = await quoteRates(address, items.map(i => ({ productId: String(i.productId), quantity: i.quantity })));
  const rate = quote.rates.find(r => r.id === methodId);
  if (!rate) throw refuse('The chosen shipping method is no longer available. Please choose it again.');
  const shippingCost = round2(Number(rate.price) || 0);

  // 4. The total, compared with what the customer saw
  const totalAmount = round2(subtotal + shippingCost);
  const shown = Number(orderDetails.totalAmount);
  if (!Number.isFinite(shown) || Math.abs(shown - totalAmount) > 0.005) {
    throw refuse(`The total has changed to €${totalAmount.toFixed(2)}. Please check your order and try again.`,
      { priceChanged: { totalAmount, subtotal, shippingCost } });
  }

  return {
    items,
    subtotal,
    totalAmount,
    shippingDetails: {
      shippingMethodId: rate.id,
      provider: rate.provider || '',
      shippingMethodName: rate.name || '',
      shippingCost,
    },
    customerDetails: cleanCustomer(orderDetails.customerDetails),
    structuredAddress: address,
  };
}

/**
 * Takes the stock for these items, all or nothing: if one product runs out in the
 * meantime (two customers at once), everything taken so far is given back.
 */
async function takeStock(items) {
  const taken = [];
  for (const item of items) {
    const r = await Product.updateOne(
      { _id: item.productId, stockQuantity: { $gte: item.quantity } },
      { $inc: { stockQuantity: -item.quantity } });
    if (r.modifiedCount !== 1) {
      await giveBackStock(taken);
      throw refuse('One or more items are out of stock.', {
        outOfStockItems: [{ name: item.name, requested: item.quantity, available: 0 }],
      });
    }
    taken.push(item);
  }
}

async function giveBackStock(items) {
  for (const item of items) {
    await Product.updateOne({ _id: item.productId }, { $inc: { stockQuantity: item.quantity } });
  }
}

module.exports = { priceOrder, takeStock, giveBackStock, round2 };
