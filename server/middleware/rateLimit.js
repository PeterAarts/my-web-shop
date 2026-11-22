// File: server/middleware/rateLimit.js
// A small in-memory limiter for login, registration and password reset, so passwords
// can't be guessed at machine speed. Per IP address (the real visitor's address,
// because server.js trusts the proxy on this machine). Resets when the server restarts.
//
//   router.post('/login', rateLimit({ name: 'login', max: 10, windowMs: 15 * 60 * 1000 }), handler)
const buckets = new Map();   // "name|ip" -> { count, resetAt }

function rateLimit({ name, max, windowMs }) {
  return function (req, res, next) {
    const now = Date.now();
    const key = `${name}|${req.ip}`;
    let b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > max) {
      res.set('Retry-After', String(Math.ceil((b.resetAt - now) / 1000)));
      return res.status(429).json({ msg: 'Too many attempts. Please wait a few minutes and try again.' });
    }
    next();
  };
}

// Forget expired entries now and then, so memory doesn't grow.
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}, 10 * 60 * 1000).unref();

module.exports = rateLimit;
