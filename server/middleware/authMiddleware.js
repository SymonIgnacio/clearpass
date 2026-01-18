const jwt = require('jsonwebtoken');
const { ROLES } = require('../config/roles');
const { isMfaEnforced } = require('../config/mfa');
require('dotenv').config();

const { logger } = require('./logger');

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
  'resident': 12
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
      logger.warn(`Access Denied. User Role: ${userRole} (Effective: ${effectiveUserRole}), Allowed: ${JSON.stringify(normalizedRoles)}`);
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// Alias for backward compatibility
const verifyRole = checkRole;

// Implement hierarchy-based access control
// Prevents users from assigning roles higher than their own
const checkHierarchyAccess = (req, res, next) => {
  if (req.body && req.body.role) {
    const targetRole = typeof req.body.role === 'string' 
      ? ROLE_MAP[req.body.role.toLowerCase()] 
      : req.body.role;
    
    // Lower number means higher authority
    if (targetRole < req.user.role) {
       return res.status(403).json({ error: 'Insufficient permissions to assign this role.' });
    }
  }
  next();
};

const checkOwnershipOrHierarchy = (req, res, next) => {
  const targetId = parseInt(req.params.id || req.params.userId, 10);
  
  // Allow if user is accessing their own resource
  if (req.user.id === targetId) {
    return next();
  }
  
  // Allow Admins (1), Captains (2), Secretaries (3) to override
  // Assuming these roles have management capabilities
  if (req.user.role <= 3) {
    return next();
  }
  
  return res.status(403).json({ error: 'Access denied. Ownership or elevated privileges required.' });
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
