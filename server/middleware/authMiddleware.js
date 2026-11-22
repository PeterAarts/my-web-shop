const jwt = require('jsonwebtoken');

// Checks that the request comes from a logged-in user (customer, reviewer or admin).
// It does NOT check the role: add requireAdmin or requireStaff for that.
//
// The token is only accepted from the Authorization header. Tokens in the address
// (?token=...) end up in browser history and server logs, so they are not accepted.
module.exports = function(req, res, next) {
  const header = req.header('Authorization');
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};