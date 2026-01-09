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

// Role name to ID mapping (Database Aligned)
const ROLE_MAP = {
  'admin': 1,
  'it_admin': 1,
  'captain': 2,
  'secretary': 3,
  'clerk': 4,
  'blotter_officer': 6,
  'resident': 12
};

// THEMIS CLEARPASS Role Verification
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role || req.user.role_id; // Support both role and role_id
    
    // Convert string roles to numeric IDs if needed
    const normalizedRoles = allowedRoles.map(role => {
      if (typeof role === 'string') {
        return ROLE_MAP[role.toLowerCase()] || role;
      }
      return role;
    });
    
    if (!normalizedRoles.includes(userRole)) {
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

// Captain read-only enforcement middleware (Database Role 2)
const enforceReadOnly = (req, res, next) => {
  const userRole = req.user && (req.user.role || req.user.role_id);
  if (userRole === 2 && req.method !== 'GET') { // Captain is role 2 in database
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
  checkOwnershipOrHierarchy,
  ROLE_MAP 
};
