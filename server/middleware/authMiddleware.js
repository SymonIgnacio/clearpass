const jwt = require('jsonwebtoken');
const { ROLES } = require('../config/roles');
const { isMfaEnforced } = require('../config/mfa');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const normalized = { ...decoded };
    if (normalized.role == null && normalized.role_id != null) {
      normalized.role = normalized.role_id;
    }
    if (typeof normalized.role === 'string') {
      const lower = normalized.role.toLowerCase();
      if (ROLE_MAP[lower]) {
        normalized.role = ROLE_MAP[lower];
      } else {
        const parsed = Number.parseInt(normalized.role, 10);
        if (!Number.isNaN(parsed)) {
          normalized.role = parsed;
        }
      }
    }
    if (typeof normalized.role !== 'number' || Number.isNaN(normalized.role)) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (normalized.role === ROLES.RESIDENT && normalized.resident_id == null) {
      normalized.resident_id = normalized.id;
    }
    if (!isMfaEnforced()) {
      normalized.mfa_verified = true;
    }
    req.user = normalized;
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
  'resident': 12,
  'guest': 13
};

// THEMIS CLEARPASS Role Verification
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    // Convert string roles to numeric IDs if needed
    const normalizedRoles = allowedRoles.map(role => {
      if (typeof role === 'string') {
        return ROLE_MAP[role.toLowerCase()] || role;
      }
      return role;
    });
    
    let effectiveUserRole = userRole;
    if (typeof effectiveUserRole === 'string' && ROLE_MAP[effectiveUserRole.toLowerCase()]) {
        effectiveUserRole = ROLE_MAP[effectiveUserRole.toLowerCase()];
    }
    
    if (!normalizedRoles.includes(effectiveUserRole)) {
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
  const userRole = req.user && req.user.role;
  if (userRole === ROLES.CAPTAIN && req.method !== 'GET') {
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
