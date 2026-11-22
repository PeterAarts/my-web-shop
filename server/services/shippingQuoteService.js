// FILE: server/services/shippingQuoteService.js
// Shipping rates for an address and a list of cart items. Used by the checkout
// (POST /api/shipping/rates) AND when an order is placed, so the shipping cost on an
// order is always the server's own calculation, never a number sent by the browser.
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const ShippingProvider = require('../models/ShippingProvider');
const Setting = require('../models/Setting');

const providers = {};
const providersDirectory = path.join(__dirname, '../shipping-providers');
if (fs.existsSync(providersDirectory)) {
  for (const file of fs.readdirSync(providersDirectory)) {
    if (!file.endsWith('.js')) continue;
    try {
      const providerModule = require(path.join(providersDirectory, file));
      if (providerModule.key) providers[providerModule.key] = providerModule;
    } catch (error) {
      console.error(`❌ Failed to load shipping provider from ${file}:`, error);
    }
  }
}

/** Total weight, volume and largest dimension of the cart, from the products in the database. */
async function calculateOrderDimensions(cartItems) {
  let totalWeight = 0;
  let totalVolume = 0;
  let maxDimension = 0;

  const productIds = cartItems.map(item => String(item.productId || item._id));
  const products = await Product.find({ '_id': { $in: productIds } });
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  for (const item of cartItems) {
    const product = productMap.get(String(item.productId || item._id));
    if (product) {
      const quantity = Number(item.quantity) || 1;
      const dims = product.dimensions || { length: 0, width: 0, height: 0 };
      totalWeight += (product.weight || 0) * quantity;
      totalVolume += (dims.length * dims.width * dims.height) * quantity;
      maxDimension = Math.max(maxDimension, dims.length, dims.width, dims.height);
    }
  }
  return { totalWeight, totalVolume, maxDimension };
}

/**
 * Rates for this address and cart.
 * Returns { outcome: 'ok', rates, totalWeight } | { outcome: 'noWeight' } | { outcome: 'noPackage' }.
 * Throws an error with .notConfigured = true when no shipping packages are set up.
 */
async function quoteRates(address, cartItems) {
  const [enabledProvidersFromDB, shopSettings] = await Promise.all([
    ShippingProvider.find({ isEnabled: true }),
    Setting.getSingleton(),
  ]);

  if (!shopSettings?.shippingPackages?.length) {
    const e = new Error('Shipping packages are not configured.');
    e.notConfigured = true;
    throw e;
  }

  const { totalWeight, totalVolume, maxDimension } = await calculateOrderDimensions(cartItems);
  if (totalWeight === 0) return { outcome: 'noWeight', rates: [], totalWeight: 0 };

  const fittingPackages = shopSettings.shippingPackages.filter(pkg => {
    const packageVolume = pkg.length * pkg.width * pkg.height;
    const packageMaxDim = Math.max(pkg.length, pkg.width, pkg.height);
    return totalWeight <= pkg.maxWeight && totalVolume <= packageVolume && maxDimension <= packageMaxDim;
  });
  if (fittingPackages.length === 0) return { outcome: 'noPackage', rates: [], totalWeight };

  fittingPackages.sort((a, b) => (a.length * a.width * a.height) - (b.length * b.width * b.height));

  const results = await Promise.all(enabledProvidersFromDB.map(providerConfig => {
    const providerModule = providers[providerConfig.moduleName];
    if (!providerModule) return Promise.resolve([]);
    return providerModule.getRates(address, fittingPackages, totalWeight, providerConfig)
      .catch(error => {
        console.error(`   Error from ${providerConfig.name}:`, error.message);
        return [];
      });
  }));

  const rates = results.flat().sort((a, b) => a.price - b.price);
  return { outcome: 'ok', rates, totalWeight };
}

module.exports = { quoteRates, calculateOrderDimensions };
