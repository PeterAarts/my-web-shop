const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = function(req, res, next) {
  let token;

  // 1. Check for token in the Authorization header
  if (req.header('Authorization') && req.header('Authorization').startsWith('Bearer ')) {
    token = req.header('Authorization').split(' ')[1];
  } 
  // 2. NEW: If no header, check for token in the query parameters
  else if (req.query.token) {
    token = req.query.token;
  }

  // If no token is found in either location, deny access
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