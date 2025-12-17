const jwt = require('jsonwebtoken');
const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);

/**
 * Account Hierarchy Authentication Middleware
 * Handles JWT verification and hierarchy-based access control
 */

// THEMIS CLEARPASS: 6-tier Role-Based Access Control System
const THEMIS_ROLES = {
  1: { // IT Admin (System Guardian)
    level: 1,
    role_name: 'it_admin',
    permissions: [
      'tech_support', 'system_monitoring', 'user_provisioning',
      'bulk_import', 'system_config', 'security_mgmt'
    ],
    display_name: 'IT Admin',
    description: 'System Guardian - Tech/Infra only - System maintenance and user creation'
  },
  2: { // Clerk (The ClearPass Operator - Issuance)
    level: 2,
    role_name: 'clerk',
    permissions: [
      'issue_certificates', 'process_clearances', 'data_entry',
      'basic_support', 'create_records', 'clearpass_gate'
    ],
    display_name: 'Clerk',
    description: 'ClearPass Engine - Certificate issuance and processing with ClearPass validation'
  },
  3: { // Blotter Officer (The Encoder)
    level: 3,
    role_name: 'blotter_officer',
    permissions: [
      'manage_blotter', 'create_cases', 'update_cases', 'close_cases'
    ],
    display_name: 'Blotter Officer',
    description: 'The Encoder - Full CRUD for blotter cases (triggers ClearPass blocks)'
  },
  4: { // Resident (The End User)
    level: 4,
    role_name: 'resident',
    permissions: [
      'view_own_profile', 'request_clearance', 'update_profile',
      'view_certificates', 'submit_verification'
    ],
    display_name: 'Resident',
    description: 'End User - Login with ResidentID + PIN'
  },
  5: { // Captain (Executive Viewer)
    level: 5,
    role_name: 'captain',
    permissions: [
      'read_analytics', 'view_reports', 'supervise_operations'
    ],
    display_name: 'Captain',
    description: 'Executive Viewer - Read-Only Analytics - Leadership oversight'
  },
  6: { // Secretary (The Overseer)
    level: 6,
    role_name: 'secretary',
    permissions: [
      'manage_documents', 'approve_clearances', 'process_requests',
      'generate_reports', 'manage_events', 'supervise_clerks',
      'view_all_records', 'administrative_approval'
    ],
    display_name: 'Secretary',
    description: 'The Overseer - Document processing, approvals, and supervision'
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

    // Get role information from THEMIS roles mapping
    const roleInfo = THEMIS_ROLES[user.role] || THEMIS_ROLES[5];

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

// Check if user has required role permissions (THEMIS RBAC)
function checkRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // THEMIS: Handle string 'admin' role conversion
    const userRole = req.user.role;
    console.log(`🔐 RBAC Debug: User role from JWT: ${userRole} (type: ${typeof userRole})`);
    console.log(`🔐 RBAC Debug: Allowed roles: ${JSON.stringify(allowedRoles)}`);

    // Super Admin (string 'admin') has all access - bypass all checks
    if (userRole === 'admin') {
      console.log('✅ RBAC Debug: Super Admin (string admin) granted access to all endpoints');
      return next();
    }

    // Convert string roles to THEMIS numeric roles
    let numericRole = userRole;
    if (typeof userRole === 'string') {
      const roleMap = {
        'admin': 1,      // IT Admin
        'clerk': 2,      // Clerk
        'blotter_officer': 3, // Blotter Officer
        'resident': 4,   // Resident
        'captain': 5,    // Captain
        'secretary': 6   // Secretary
      };
      numericRole = roleMap[userRole] !== undefined ? roleMap[userRole] : 4;
      console.log(`🔐 RBAC Debug: Converted '${userRole}' to numeric role: ${numericRole}`);
    }

    // IT Admin (Role 1) has all access like Super Admin
    if (numericRole === 1) {
      console.log('✅ RBAC Debug: IT Admin (Role 1) granted access to all endpoints');
      return next();
    }

    // Check if user's numeric role is in allowed roles
    const hasRoleAccess = allowedRoles.some(role => {
      if (typeof role === 'number') {
        // THEMIS numeric role check
        const access = numericRole === role;
        console.log(`🔐 RBAC Debug: Checking numeric role ${numericRole} against ${role}: ${access}`);
        return access;
      } else if (typeof role === 'string') {
        // Legacy string role support
        const roleMap = {
          'admin': 1, 'clerk': 2, 'blotter_officer': 3,
          'resident': 4, 'captain': 5, 'secretary': 6
        };
        const access = numericRole === roleMap[role] || req.user.role_name === role;
        console.log(`🔐 RBAC Debug: Checking string role '${role}' against numeric ${numericRole}: ${access}`);
        return access;
      }
      return false;
    });

    if (!hasRoleAccess) {
      console.log(`❌ RBAC Debug: Access DENIED - Role ${numericRole} not in allowed roles ${JSON.stringify(allowedRoles)}`);
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current_role: numericRole,
        current_role_name: req.user.role_name
      });
    }

    console.log(`✅ RBAC Debug: Access GRANTED - Role ${numericRole} allowed`);
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

    // Get hierarchy level from THEMIS roles mapping
    const targetRoleInfo = THEMIS_ROLES[targetUser.role] || THEMIS_ROLES[5];
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
