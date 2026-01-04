const jwt = require('jsonwebtoken');
const { ROLES } = require('../config/roles');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

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

// Updated to handle both string and numeric role checking
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Convert string roles to numeric IDs for consistency
    const roleMap = {
      'admin': ROLES.ADMIN,
      'captain': ROLES.CAPTAIN,
      'secretary': ROLES.SECRETARY,
      'clerk': ROLES.CLERK,
      'blotter_officer': ROLES.BLOTTER_OFFICER,
      'resident': ROLES.RESIDENT
    };

    const allowedRoleIds = allowedRoles.map(role => 
      typeof role === 'string' ? roleMap[role.toLowerCase()] : role
    ).filter(Boolean);

    if (!allowedRoleIds.includes(req.user.role_id)) {
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

module.exports = { 
  verifyToken, 
  verifyRole, 
  checkRole, 
  authenticate,
  checkHierarchyAccess, 
  checkOwnershipOrHierarchy 
};
