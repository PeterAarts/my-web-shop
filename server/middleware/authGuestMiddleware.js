const jwt = require('jsonwebtoken');

// This middleware is for routes that can be accessed by EITHER a logged-in user OR a guest.
// It tries to find a user token first. If that fails, it looks for a guest token.
// It will not reject the request if neither is found.
module.exports = function(req, res, next) {
  // Check for standard user auth token first
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;
      return next(); // User is authenticated, proceed
    } catch (err) {
      // Invalid user token, just ignore and proceed as a guest
    }
  }

  // If no user token, check for a guest session token
  const guestToken = req.header('X-Guest-Token');
  if (guestToken) {
    req.guestToken = guestToken;
  }

  next();
};