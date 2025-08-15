// File: server/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

module.exports = async function(req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');
 // Check if not token
if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
}

try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in the database using the ID from the token.
    // This is the crucial step that fetches the user's role.
    req.user = await User.findById(decoded.user.id).select('-password');
    
    // If the user associated with the token no longer exists, deny access.
    if (!req.user) {
        return res.status(401).json({ msg: 'Token is not valid, user not found' });
    }

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
