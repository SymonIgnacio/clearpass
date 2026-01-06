const jwt = require('jsonwebtoken');
const { ROLES } = require('../config/roles');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Updated to handle both role names and IDs
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoleId = req.user.role_id;
    const userRoleName = req.user.role;
    
    // Convert role names to IDs for comparison
    const roleNameToId = {
      'admin': 5,
      'captain': 2,
      'secretary': 3,
      'clerk': 4,
      'blotter_officer': 6,
      'officer': 6,
      'resident': 12
    };
    
    // Build list of allowed role IDs
    const allowedRoleIds = allowedRoles.map(role => {
      if (typeof role === 'number') {
        return role;
      }
      return roleNameToId[role.toLowerCase()] || null;
    }).filter(id => id !== null);
    
    if (!allowedRoleIds.includes(userRoleId)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// Alias for backward compatibility
const verifyRole = checkRole;

// Placeholder functions for hierarchy access (to be implemented)
const checkHierarchyAccess = (req, res, next) => {
  // TODO: Implement hierarchy-based access control
  next();
};

const checkOwnershipOrHierarchy = (req, res, next) => {
  // TODO: Implement ownership or hierarchy-based access control
  next();
};

// For routes that need authentication but no specific role
const authenticate = verifyToken;

// Captain read-only enforcement middleware
const enforceReadOnly = (req, res, next) => {
  if (req.user && (req.user.role_id === 2 || req.user.role === 'Captain')) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Captains have read-only access.' 
    });
  }
  next();
};

module.exports = { 
  verifyToken, 
  verifyRole, 
  checkRole, 
  authenticate,
  enforceReadOnly,
  checkHierarchyAccess, 
  checkOwnershipOrHierarchy 
};
