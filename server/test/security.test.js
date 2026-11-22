// File: server/test/security.test.js
// Run:  cd server && npm test        (no database needed)
//
// 1. Every API route has an agreed protection level. A new route without a decision,
//    or a route whose protection changed, makes this test fail.
// 2. The role check refuses customers on admin routes, using the CURRENT role.
// 3. Order prices come from the database, not from the browser.
'use strict';
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-long-enough-1234567890';

const auth = require('../middleware/authMiddleware');
const authOptional = require('../middleware/authOptional');
const authGuest = require('../middleware/authGuestMiddleware');

// ── 1. The agreed protection per route ────────────────────────────────────
// public   = anyone            optional = anyone, logged in or not
// customer = any logged-in user (the handler itself limits them to their own data)
// staff    = admin or reviewer admin    = admin only
const POLICY = {
  '/api/auth': {
    'POST /register': 'public', 'POST /login': 'public', 'POST /shop-login': 'public',
    'GET /verify-email/:token': 'public', 'POST /forgot-password': 'public', 'POST /reset-password/:token': 'public',
  },
  '/api/products': {
    'GET /': 'public', 'GET /:id': 'public',
    'POST /': 'admin', 'PUT /:id': 'admin', 'DELETE /:id': 'admin', 'PATCH /:id/reserve': 'admin', 'PATCH /:id/release': 'admin',
  },
  '/api/stories': {
    'GET /': 'public', 'GET /location/:locationSlug': 'public',
    'POST /': 'admin', 'PUT /:id': 'admin', 'DELETE /:id': 'admin',
  },
  '/api/upload': { 'POST /': 'admin' },
  '/api/orders': {
    'GET /my-orders': 'customer', 'GET /:id': 'customer', 'GET /confirmation/:id': 'customer',
    'PUT /:id/status': 'customer',   // handler: admin any order; customer only cancels own unpaid order
    'GET /public/:id/:token': 'public', 'GET /public/confirmation/:id/:token': 'public',
    'GET /': 'staff', 'POST /archive': 'staff', 'GET /:id/picklist': 'staff', 'POST /:id/generate-picklist': 'staff',
    'PUT /:id': 'admin',
  },
  '/api/settings': { 'GET /': 'public', 'PUT /': 'admin' },
  '/api/images': { 'GET /': 'staff', 'GET /usage/:filename': 'staff', 'DELETE /:filename': 'admin' },
  '/api/categories': { 'GET /': 'public', 'POST /': 'admin', 'POST /bulk': 'admin', 'DELETE /:id': 'admin' },
  '/api/users': {
    'GET /me': 'customer', 'PUT /me': 'customer', 'PUT /me/password': 'customer', 'DELETE /me': 'customer',
    'GET /': 'admin', 'POST /': 'admin', 'PUT /:id': 'admin', 'DELETE /:id': 'admin',
  },
  '/api/shipping-providers': { 'GET /': 'admin', 'PUT /:id': 'admin' },
  '/api/payment-providers': { 'GET /': 'admin', 'PUT /:id': 'admin' },
  '/api/shipping': { 'POST /rates': 'public', 'POST /label': 'admin', 'GET /labels/:fileName': 'staff' },
  '/api/payment': { 'GET /options': 'optional', 'POST /initiate': 'optional', 'POST /capture': 'optional' },
  '/api/dashboard': { 'GET /stats': 'staff', 'GET /activity': 'staff', 'GET /recent-orders': 'staff' },
  '/api/email-templates': {
    'GET /system-slugs': 'admin', 'GET /': 'admin', 'POST /': 'admin', 'PUT /:id': 'admin', 'DELETE /:id': 'admin',
  },
  '/api/logs': { 'GET /:orderId': 'staff' },
  '/api/cart': { 'GET /': 'optional', 'POST /add': 'optional', 'DELETE /remove/:productId': 'optional', 'DELETE /': 'optional' },
};

const ROUTE_FILES = {
  '/api/auth': 'authRoutes', '/api/products': 'productRoutes', '/api/stories': 'storyItemRoutes',
  '/api/upload': 'uploadRoutes', '/api/orders': 'orderRoutes', '/api/settings': 'settingsRoutes',
  '/api/images': 'imageRoutes', '/api/categories': 'categoryRoutes', '/api/users': 'userRoutes',
  '/api/shipping-providers': 'shippingProviderRoutes', '/api/payment-providers': 'paymentProviderRoutes',
  '/api/shipping': 'shippingRoutes', '/api/payment': 'paymentRoutes', '/api/dashboard': 'dashboardRoutes',
  '/api/email-templates': 'emailTemplateRoutes', '/api/logs': 'logRoutes', '/api/cart': 'cartRoutes',
};

// What protection a route actually has, from its middleware
function levelOf(handlers) {
  const roles = handlers.map(h => h.requiredRoles).find(Boolean);
  const hasAuth = handlers.includes(auth);
  if (roles) {
    if (!hasAuth) return 'BROKEN: role check without login check';
    if (roles.length === 1 && roles[0] === 'admin') return 'admin';
    if (roles.join() === 'admin,reviewer') return 'staff';
    return `roles(${roles.join()})`;
  }
  if (hasAuth) return 'customer';
  if (handlers.includes(authOptional) || handlers.includes(authGuest)) return 'optional';
  return 'public';
}

function routesOf(router) {
  const out = {};
  for (const layer of router.stack) {
    if (!layer.route) continue;
    const handlers = layer.route.stack.map(l => l.handle);
    for (const method of Object.keys(layer.route.methods)) {
      if (method === '_all') continue;
      out[`${method.toUpperCase()} ${layer.route.path}`] = levelOf(handlers);
    }
  }
  return out;
}

test('server.js mounts exactly the route files this test knows', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'server.js'), 'utf8');
  const mounted = [...src.matchAll(/app\.use\('(\/api\/[^']+)'/g)].map(m => m[1]).sort();
  assert.deepEqual(mounted, Object.keys(ROUTE_FILES).sort(),
    'A route file was added or removed in server.js: add it to POLICY and ROUTE_FILES in this test.');
});

for (const [mount, file] of Object.entries(ROUTE_FILES)) {
  test(`${mount}: every route has its agreed protection`, () => {
    const actual = routesOf(require(`../routes/${file}`));
    const expected = POLICY[mount];
    for (const [route, level] of Object.entries(actual)) {
      assert.ok(route in expected, `${mount} ${route} is new: decide who may use it and add it to POLICY.`);
      assert.equal(level, expected[route], `${mount} ${route} should be "${expected[route]}" but is "${level}"`);
    }
    for (const route of Object.keys(expected)) {
      assert.ok(route in actual, `${mount} ${route} is in POLICY but no longer exists: remove it from POLICY.`);
    }
  });
}

// ── 2. The role check ─────────────────────────────────────────────────────
const User = require('../models/User');
const { requireAdmin, requireStaff } = require('../middleware/requireRole');

function call(mw, user) {
  return new Promise(resolve => {
    const res = { status(code) { this.code = code; return this; }, json() { resolve(this.code); return this; } };
    mw({ user }, res, () => resolve('next'));
  });
}

test('requireAdmin: only a user who is admin in the database gets through', async () => {
  const roles = { a: 'admin', r: 'reviewer', c: 'customer' };
  mock.method(User, 'findById', id => ({ select: async () => (roles[id] ? { role: roles[id] } : null) }));
  try {
    assert.equal(await call(requireAdmin, { id: 'a' }), 'next');
    assert.equal(await call(requireAdmin, { id: 'r' }), 403);
    assert.equal(await call(requireAdmin, { id: 'c' }), 403);
    assert.equal(await call(requireAdmin, { id: 'gone' }), 401, 'a deleted user is refused');
    assert.equal(await call(requireAdmin, undefined), 401);
    // the token claims admin, the database says customer: the database wins
    assert.equal(await call(requireAdmin, { id: 'c', role: 'admin' }), 403);
    assert.equal(await call(requireStaff, { id: 'r' }), 'next');
    assert.equal(await call(requireStaff, { id: 'c' }), 403);
  } finally { mock.restoreAll(); }
});

test('login tokens in the address (?token=) are not accepted', async () => {
  const res = { status(code) { this.code = code; return this; }, json() { return this; } };
  let passed = false;
  auth({ header: () => undefined, query: { token: 'x' } }, res, () => { passed = true; });
  assert.equal(passed, false);
  assert.equal(res.code, 401);
});

// ── 3. Prices come from the server ────────────────────────────────────────
const Product = require('../models/Product');
const shippingQuote = require('../services/shippingQuoteService');
const RATE = { id: 'postnl-NL-1-Tracked', name: 'PostNL', price: 4.95, provider: 'postnl' };
shippingQuote.quoteRates = async () => ({ outcome: 'ok', rates: [RATE], totalWeight: 100 });
const { priceOrder } = require('../services/orderPricingService');

const P1 = '64b000000000000000000001';
const P2 = '64b000000000000000000002';
const DB = {
  [P1]: { _id: P1, name: 'Notebook', price: 12.5, stockQuantity: 5, active: true },
  [P2]: { _id: P2, name: 'Pen', price: 2, stockQuantity: 0, active: true },
};
function order(extra = {}) {
  return {
    items: [{ productId: P1, quantity: 2, price: 12.5 }],
    structuredAddress: { countryCode: 'NL' },
    shippingDetails: { shippingMethodId: RATE.id },
    customerDetails: { name: 'Ann', email: 'ann@example.com', address: 'Street 1, 1234 AB City, NL' },
    totalAmount: 29.95,
    ...extra,
  };
}

test('an honest order is priced by the server', async () => {
  mock.method(Product, 'find', async q => q._id.$in.map(id => DB[id]).filter(Boolean));
  try {
    const p = await priceOrder(order());
    assert.equal(p.totalAmount, 29.95);
    assert.equal(p.items[0].price, 12.5);
    assert.equal(p.shippingDetails.shippingCost, 4.95);
  } finally { mock.restoreAll(); }
});

test('a tampered price or total is refused, with the real total', async () => {
  mock.method(Product, 'find', async q => q._id.$in.map(id => DB[id]).filter(Boolean));
  try {
    // cheaper item price sent, but the total still says 29.95: the server's prices are used
    const p = await priceOrder(order({ items: [{ productId: P1, quantity: 2, price: 0.01 }] }));
    assert.equal(p.items[0].price, 12.5, 'the price from the browser is ignored');
    // a tampered total is refused
    await assert.rejects(priceOrder(order({ totalAmount: 0.01 })), e => e.status === 400 && e.priceChanged.totalAmount === 29.95);
    await assert.rejects(priceOrder(order({ totalAmount: undefined })), e => e.status === 400);
  } finally { mock.restoreAll(); }
});

test('bad quantities, unknown products, no stock and unknown shipping are refused', async () => {
  mock.method(Product, 'find', async q => q._id.$in.map(id => DB[id]).filter(Boolean));
  try {
    for (const quantity of [-1, 0, 1.5, 'two', null, 1000]) {
      await assert.rejects(priceOrder(order({ items: [{ productId: P1, quantity }] })), e => e.status === 400, `quantity ${quantity}`);
    }
    await assert.rejects(priceOrder(order({ items: [{ productId: { $ne: null }, quantity: 1 }] })), e => e.status === 400);
    await assert.rejects(priceOrder(order({ items: [{ productId: P1, quantity: 6 }] })), e => e.outOfStockItems?.[0].available === 5);
    await assert.rejects(priceOrder(order({ items: [{ productId: P2, quantity: 1 }] })), e => !!e.outOfStockItems);
    await assert.rejects(priceOrder(order({ shippingDetails: { shippingMethodId: 'free-shipping' } })), e => e.status === 400);
    await assert.rejects(priceOrder(order({ items: [] })), e => e.status === 400);
    // the same product on two lines counts as one (3 + 3 > 5 in stock)
    await assert.rejects(priceOrder(order({ items: [{ productId: P1, quantity: 3 }, { productId: P1, quantity: 3 }] })), e => !!e.outOfStockItems);
  } finally { mock.restoreAll(); }
});
