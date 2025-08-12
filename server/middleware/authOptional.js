// FILE: server/middleware/authOptional.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token, proceed without a user
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = await User.findById(decoded.user.id).select('-password');
    
    next();
  } catch (err) {
    // Token is invalid, but we don't block the request
    next();
  }
};