const jwt = require('jsonwebtoken');
const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);

/**
 * Account Hierarchy Authentication Middleware
 * Handles JWT verification and hierarchy-based access control
 */

// Enhanced Role hierarchy mapping with distinct permissions
const ROLE_HIERARCHY = {
  'admin': {
    level: 1,
    permissions: [
      'read', 'write', 'delete', 'manage_users',
      'manage_system', 'audit_logs', 'bulk_operations',
      'security_mgmt', 'financial', 'system_config'
    ],
    display_name: 'Super Admin',
    description: 'Complete system administration and configuration'
  },
  'captain': {
    level: 2,
    permissions: [
      'read', 'write', 'manage_staff', 'manage_certificates',
      'manage_budget', 'approve_requests', 'generate_reports',
      'supervise_clerks'
    ],
    display_name: 'Barangay Captain',
    description: 'Leadership, budget authority, and staff supervision'
  },
  'secretary': {
    level: 3,
    permissions: [
      'read', 'write', 'manage_documents', 'manage_events',
      'manage_residents', 'process_requests', 'create_templates',
      'issue_certificates'
    ],
    display_name: 'Barangay Secretary',
    description: 'Administrative documentation and resident services'
  },
  'clerk': {
    level: 4,
    permissions: [
      'read', 'write', 'process_requests', 'create_reports',
      'data_entry', 'basic_support'
    ],
    display_name: 'Barangay Clerk',
    description: 'Frontline processing and basic administrative support'
  },
  'resident': {
    level: 5,
    permissions: [
      'read', 'submit_requests', 'view_own_data'
    ],
    display_name: 'Resident',
    description: 'Basic access to services and own records'
  }
};

// Verify JWT token and attach user to request
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get fresh user data from database
    const user = await knex('users')
      .where('id', decoded.id)
      .where('is_active', true)
      .first();

    if (!user) {
      return res.status(401).json({
        error: 'User not found or inactive'
      });
    }

    // Get role information from hierarchy mapping
    const roleInfo = ROLE_HIERARCHY[user.role] || ROLE_HIERARCHY['resident'];

    // Attach user to request object with hierarchy information
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      role_name: roleInfo.display_name,
      hierarchy_level: roleInfo.level,
      permissions: roleInfo.permissions,
      parent_user_id: null // No hierarchy in existing schema
    };

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}

// Check if user has required role permissions
function checkRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Super Admin has access to everything
    if (req.user.role === 'admin' || req.user.role_name === 'Super Admin') {
      return next();
    }

    // Check if user's role is in allowed roles
    const hasRoleAccess = allowedRoles.some(role =>
      req.user.role === role ||
      req.user.role_name === role ||
      req.user.role_id === role
    );

    if (!hasRoleAccess) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role_name
      });
    }

    next();
  };
}

// Check if user has specific permissions
function checkPermission(requiredPermissions = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Super Admin has all permissions
    if (req.user.role === 'admin' || req.user.role_name === 'Super Admin') {
      return next();
    }

    // Check if user has required permissions
    const hasPermission = requiredPermissions.every(permission =>
      req.user.permissions && req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: requiredPermissions,
        current: req.user.permissions
      });
    }

    next();
  };
}

/**
 * CRITICAL HIERARCHY ENFORCEMENT MIDDLEWARE
 * Checks if current_user.id is the parent_user_id of the target data owner
 * This enforces the account hierarchy where superiors can access subordinate data
 */
async function checkHierarchyAccess(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Super Admin can access everything
    if (req.user.role === 'admin' || req.user.role_name === 'Super Admin') {
      return next();
    }

    // Get target user ID from various sources
    let targetUserId = null;

    // Check URL parameters first (most common)
    if (req.params.userId) {
      targetUserId = parseInt(req.params.userId);
    } else if (req.params.id && req.baseUrl.includes('/users')) {
      targetUserId = parseInt(req.params.id);
    }

    // Check request body for user references
    if (!targetUserId && req.body) {
      targetUserId = req.body.user_id || req.body.target_user_id || req.body.owner_id;
    }

    // Check query parameters
    if (!targetUserId && req.query) {
      targetUserId = req.query.user_id || req.query.owner_id;
    }

    // If no target user specified, allow access (for general endpoints)
    if (!targetUserId) {
      return next();
    }

    // Validate target user exists
    const targetUser = await knex('users')
      .select('id', 'parent_user_id', 'role')
      .where('id', targetUserId)
      .where('is_active', true)
      .first();

    if (!targetUser) {
      return res.status(404).json({
        error: 'Target user not found'
      });
    }

    // Get hierarchy level from mapping
    const targetRoleInfo = ROLE_HIERARCHY[targetUser.role] || ROLE_HIERARCHY['resident'];
    targetUser.hierarchy_level = targetRoleInfo.level;

    // Check hierarchy chain
    const hasHierarchyAccess = await checkHierarchyChain(req.user.id, targetUserId);

    if (!hasHierarchyAccess) {
      return res.status(403).json({
        error: 'Access denied: Target user is not under your hierarchy',
        message: 'You can only access data of users under your supervision'
      });
    }

    // Attach target user info to request for further processing
    req.targetUser = targetUser;

    next();

  } catch (error) {
    console.error('Hierarchy check error:', error);
    res.status(500).json({
      error: 'Internal server error during hierarchy check'
    });
  }
}

/**
 * Check if user A has access to user B through hierarchy chain
 * Returns true if A is a superior of B in the hierarchy
 */
async function checkHierarchyChain(superiorId, subordinateId, visited = new Set()) {
  // Prevent infinite loops
  if (visited.has(subordinateId)) {
    return false;
  }
  visited.add(subordinateId);

  // Direct parent relationship
  if (superiorId === subordinateId) {
    return true; // User can access their own data
  }

  // Get subordinate's parent
  const subordinate = await knex('users')
    .select('parent_user_id')
    .where('id', subordinateId)
    .first();

  if (!subordinate || !subordinate.parent_user_id) {
    return false; // No parent, no hierarchy access
  }

  // Check if superior is direct parent
  if (subordinate.parent_user_id === superiorId) {
    return true;
  }

  // Recursive check up the hierarchy chain
  return await checkHierarchyChain(superiorId, subordinate.parent_user_id, visited);
}

/**
 * Combined middleware for hierarchy + role checking
 * Useful for operations that require both hierarchy and role permissions
 */
function checkHierarchyAndRole(allowedRoles = []) {
  return [verifyToken, checkHierarchyAccess, checkRole(allowedRoles)];
}

/**
 * Middleware to ensure user can only access their own data or subordinate data
 */
async function checkOwnershipOrHierarchy(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    let targetUserId = null;

    // Check URL parameters
    if (req.params.userId) {
      targetUserId = parseInt(req.params.userId);
    } else if (req.params.id && req.baseUrl.includes('/users')) {
      targetUserId = parseInt(req.params.id);
    }

    // Check request body
    if (!targetUserId && req.body) {
      targetUserId = req.body.user_id || req.body.owner_id;
    }

    // If no target specified, assume user is accessing their own data
    if (!targetUserId) {
      targetUserId = req.user.id;
    }

    // Users can always access their own data
    if (targetUserId === req.user.id) {
      return next();
    }

    // Check hierarchy access for other users' data
    const hasAccess = await checkHierarchyChain(req.user.id, targetUserId);

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied: Can only access own data or subordinate data'
      });
    }

    next();

  } catch (error) {
    console.error('Ownership check error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}

module.exports = {
  verifyToken,
  checkRole,
  checkPermission,
  checkHierarchyAccess,
  checkHierarchyAndRole,
  checkOwnershipOrHierarchy,
  checkHierarchyChain // Export for testing
};
