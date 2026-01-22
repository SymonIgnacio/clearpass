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
    // Enhanced JWT verification with additional security checks
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // Explicitly allow only HS256 algorithm
      issuer: process.env.JWT_ISSUER || 'barangay-management-system',
      audience: process.env.JWT_AUDIENCE || 'barangay-users',
    });

    // Validate token structure
    if (!decoded || typeof decoded !== 'object') {
      return res.status(401).json({ error: 'Invalid token structure' });
    }

    // Check token expiration (redundant but additional safety)
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Normalize and validate role
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
      return res.status(401).json({ error: 'Invalid token role' });
    }

    // Validate user ID
    if (!decoded.id && !decoded.sub) {
      return res.status(401).json({ error: 'Invalid token: missing user identifier' });
    }

    // Set resident_id for residents if not present
    if ((normalized.role === ROLES.RESIDENT || normalized.role === ROLES.GUEST) && normalized.resident_id == null) {
      normalized.resident_id = null; // Explicitly set to null for Guests
    }

    // Add default role_name if missing
    if (!normalized.role_name) {
      if (normalized.role === 1) normalized.role_name = 'IT Admin';
      else if (normalized.role === 2) normalized.role_name = 'Captain';
      else if (normalized.role === 3) normalized.role_name = 'Secretary';
      else if (normalized.role === 4) normalized.role_name = 'Clerk';
      else if (normalized.role === 6) normalized.role_name = 'Blotter Officer';
      else if (normalized.role === 12) normalized.role_name = 'Resident';
      else if (normalized.role === 13) normalized.role_name = 'Guest';
    }

    // MFA verification bypass for non-enforced environments
    if (!isMfaEnforced()) {
      normalized.mfa_verified = true;
    }

    // Add token metadata for security monitoring
    normalized.token_issued_at = decoded.iat;
    normalized.token_not_before = decoded.nbf;

    req.user = normalized;
    next();
  } catch (error) {
    // Log security events without exposing details
    if (process.env.NODE_ENV === 'production') {
      console.error(`Token validation failed: ${error.name}`);
    } else {
      console.error(`Token validation failed: ${error.message}`);
    }
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role name to ID mapping (Database Aligned)
const ROLE_MAP = {
  admin: 1,
  it_admin: 1,
  captain: 2,
  secretary: 3,
  clerk: 4,
  blotter_officer: 6,
  resident: 12,
  guest: 13,
};

// THEMIS CLEARPASS Role Verification
const checkRole = allowedRoles => {
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

// For routes that need authentication but no specific role
const authenticate = verifyToken;

// Captain read-only enforcement middleware (Database Role 2)
const enforceReadOnly = (req, res, next) => {
  const userRole = req.user && req.user.role;
  if (userRole === ROLES.CAPTAIN && req.method !== 'GET') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Captains have read-only access.',
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
  ROLE_MAP,
};
