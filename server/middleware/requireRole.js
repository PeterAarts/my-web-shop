// File: server/middleware/requireRole.js
// Who may do what. Use AFTER authMiddleware:  router.put('/x', auth, requireAdmin, handler)
//
// The role is read from the database on every call, not from the login token:
// a token keeps its role for 8 hours, so a demoted or deleted user would otherwise
// keep their rights until it expires.
//
//   requireAdmin  - changes: products, orders, settings, providers, users, uploads
//   requireStaff  - reading admin data: admin and 'reviewer' (read-only staff)
const User = require('../models/User');

const STAFF_ROLES = ['admin', 'reviewer'];

function requireRole(...roles) {
  const check = async function (req, res, next) {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'Please log in.' });
    }
    try {
      const user = await User.findById(req.user.id).select('role');
      if (!user) return res.status(401).json({ msg: 'Please log in.' });
      if (!roles.includes(user.role)) {
        return res.status(403).json({ msg: 'Access denied.' });
      }
      req.user.role = user.role;   // the current role, for handlers that check it
      next();
    } catch (err) {
      console.error('Role check failed:', err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  };
  check.requiredRoles = roles;     // lets the route test see what each route requires
  return check;
}

const requireAdmin = requireRole('admin');
const requireStaff = requireRole(...STAFF_ROLES);

// For routes open to customers AND staff (e.g. "your own order, or any order if staff"):
// the current role from the database, or null if the user no longer exists.
async function currentRole(req) {
  if (!req.user || !req.user.id) return null;
  const user = await User.findById(req.user.id).select('role');
  return user ? user.role : null;
}

const isStaffRole = role => STAFF_ROLES.includes(role);

module.exports = { requireRole, requireAdmin, requireStaff, STAFF_ROLES, currentRole, isStaffRole };
