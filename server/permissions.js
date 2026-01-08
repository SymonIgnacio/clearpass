/**
 * THEMIS RBAC: Permissions Module
 * Enforces 6-tier Role-Based Access Control on API endpoints
 */

const THEMIS_PERMISSIONS = {
  // IT Admin (Role 1) - Tech/Infra only
  1: {
    endpoints: {
      // User provisioning
      'POST /api/users': true,  // Create Role 2, 3, 4 accounts
      'GET /api/users': true,   // View all users
      'PUT /api/users/:id': true,
      'DELETE /api/users/:id': true,

      // Bulk import residents
      'POST /api/residents/bulk-import': true,

      // System monitoring
      'GET /api/monitoring/health': true,
      'GET /api/monitoring/metrics': true,
      'GET /api/monitoring/logs': true,

      // Admin dashboard and settings
      'GET /api/admin/dashboard': true,
      'GET /api/admin/ai-analytics': true,
      'GET /api/admin/settings': true,
      'POST /api/admin/residents/import': true
    },
    restrictions: {
      cannot_create_role_5: true,  // Cannot create Captain accounts
      cannot_create_role_4: true,  // Cannot create Resident accounts directly
      only_tech_operations: true
    }
  },

  // Clerk (Role 2) - Fulfillment/Issuer
  2: {
    endpoints: {
      // Certificate issuance (with ClearPass validation)
      'POST /api/certificates': true,  // Issue certificates
      'GET /api/certificates': true,

      // Document processing
      'GET /api/documents/requests': true,
      'PUT /api/documents/requests/:id/process': true,  // PROCESS & RELEASE

      // Resident management - full read access, create/edit but no delete
      'GET /api/residents': true,  // List all residents
      'GET /api/residents/:id': true,  // View specific resident
      'GET /api/residents/search': true,
      'POST /api/residents': true,  // Create residents
      'POST /api/clerk/residents': true,  // Create residents (alternative endpoint)
      'PUT /api/residents/:id': true,  // Update residents

      // Household and sitio data access (needed for resident assignment)
      'GET /api/households': true,
      'GET /api/sitios': true,

      // Blotter data access (for dashboard statistics)
      'GET /api/blotter': true,

      // Clerk dashboard and documents
      'GET /api/clerk/clearances': true,
      'POST /api/clerk/clearances/issue': true,
      'GET /api/clerk/documents': true,

      // Certificate types
      'GET /api/certificate-types': true,

      // Profile access
      'GET /api/auth/profile': true,
      'PUT /api/auth/profile': true
    },
    restrictions: {
      blotter_check_required: true,  // Must check blotter before issuing clearance
      no_approval_permissions: true,  // Cannot APPROVE/DENY
      no_user_management: true
    }
  },

  // Blotter Officer (Role 3) - Case Manager
  3: {
    endpoints: {
      // Full CRUD for blotter cases
      'GET /api/blotter': true,
      'GET /api/blotter/:id': true,
      'POST /api/blotter': true,
      'PUT /api/blotter/:id': true,
      'DELETE /api/blotter/:id': true,

      // Blotter analytics and reports
      'GET /api/officer/ai-analytics': true,
      'GET /api/officer/reports': true,
      'PUT /api/officer/cases/:id/resolve': true,

      // Profile access
      'GET /api/auth/profile': true,
      'PUT /api/auth/profile': true
    },
    restrictions: {
      blotter_only: true,  // Only blotter operations allowed
      no_certificate_operations: true,
      no_resident_modification: true
    }
  },

  // Resident (Role 4) - End User
  4: {
    endpoints: {
      // Own profile management
      'GET /api/auth/profile': true,
      'PUT /api/auth/profile': true,

      // Certificate requests and viewing
      'POST /api/resident/request-clearance': true,  // Request clearance
      'GET /api/resident/requests': true,  // View own requests

      // Residency verification
      'POST /api/auth/submit-residency-verification': true,
      'GET /api/auth/residency-verification/status': true,

      // Login with ResidentID + PIN
      'POST /api/auth/login': true
    },
    restrictions: {
      own_data_only: true,
      no_admin_operations: true,
      no_blotter_access: true,
      request_only: true  // Can only request, not approve/issue
    }
  },

  // Captain (Role 5) - Read-Only Executive
  5: {
    endpoints: {
      // Read-only access to analytics and dashboard
      'GET /api/analytics/*': true,
      'GET /api/dashboard/*': true,
      'GET /api/reports/*': true,
      'GET /api/captain/dashboard': true,

      // Read-only resident data
      'GET /api/residents': true,
      'GET /api/residents/:id': true,

      // Read-only blotter access
      'GET /api/blotter': true,
      'GET /api/blotter/:id': true,

      // Read-only certificates
      'GET /api/certificates': true,

      // Read-only shared resources
      'GET /api/programs': true,
      'GET /api/templates': true,
      'GET /api/households': true,
      'GET /api/sitios': true,
      'GET /api/certificate-types': true,

      // Profile access
      'GET /api/auth/profile': true,
      'PUT /api/auth/profile': true
    },
    restrictions: {
      read_only_mode: true,
      no_write_operations: true,
      no_delete_operations: true,
      no_approve_operations: true
    }
  },

  // Secretary (Role 6) - Ops/Approver
  6: {
    endpoints: {
      // Document management and approval
      'GET /api/documents/*': true,
      'POST /api/documents/requests': true,
      'PUT /api/documents/requests/:id/approve': true,

      // Clearance approval (APPROVE/DENY only)
      'PUT /api/documents/requests/:id/approve': true,  // APPROVE
      'PUT /api/documents/requests/:id/deny': true,     // DENY

      // Secretary clearances view
      'GET /api/secretary/clearances': true,

      // Resident management
      'GET /api/residents': true,
      'GET /api/residents/:id': true,
      'PUT /api/residents/:id': true,

      // Certificate types
      'GET /api/certificate-types': true,

      // Event management
      'GET /api/programs': true,
      'POST /api/programs': true,
      'PUT /api/programs/:id': true,

      // Shared resources
      'GET /api/templates': true,
      'GET /api/households': true,
      'GET /api/sitios': true,

      // Profile access
      'GET /api/auth/profile': true,
      'PUT /api/auth/profile': true
    },
    restrictions: {
      cannot_issue_certificates: true,  // Cannot PROCESS & RELEASE
      approval_only: true,
      no_bulk_operations: true
    }
  }
};

/**
 * Middleware function to enforce THEMIS permissions
 * @param {string} endpoint - API endpoint pattern
 * @param {string} method - HTTP method
 * @returns {function} - Express middleware function
 */
function enforcePermissions(endpoint, method = 'GET') {
  return (req, res, next) => {
    const userRole = req.user?.role;

    // Convert string role to number if needed
    const roleId = typeof userRole === 'string' ? parseInt(userRole) : userRole;

    // IT Admin (Role 1) has universal access like Super Admin
    if (roleId === 1) {
      console.log('✅ Permissions: IT Admin (Role 1) granted universal access');
      req.themis_restrictions = getRoleRestrictions(roleId);
      return next();
    }

    if (!checkEndpointPermission(roleId, method, endpoint)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions for this operation',
        role: roleId,
        endpoint: `${method} ${endpoint}`
      });
    }

    // Add restrictions to request for business logic enforcement
    req.themis_restrictions = getRoleRestrictions(roleId);

    next();
  };
}

/**
 * Business rule enforcement for specific operations
 */
const BUSINESS_RULES = {
  // Clerk certificate issuance - check blotter
  checkBlotterBeforeClearance: async (req, res, next) => {
    const restrictions = req.themis_restrictions;

    if (restrictions?.blotter_check_required && req.method === 'POST' && req.path.includes('/certificates')) {
      const { resident_id, certificate_type } = req.body;

      if (certificate_type === 'Barangay Clearance' || certificate_type === 'Good Moral') {
        // Check for active blotter cases
        const db = require('./database');
        const [blotterCases] = await db.execute(
          'SELECT COUNT(*) as active_cases FROM blotter WHERE respondent_id = ? AND status = "Pending"',
          [resident_id]
        );

        if (blotterCases[0].active_cases > 0) {
          return res.status(400).json({
            error: 'Clearance Blocked: Active Blotter Case',
            message: 'Cannot issue clearance certificate while resident has pending blotter cases',
            active_cases: blotterCases[0].active_cases
          });
        }
      }
    }

    next();
  },

  // IT Admin - restrict user creation to specific roles
  restrictUserCreation: (req, res, next) => {
    const restrictions = req.themis_restrictions;
    const { role } = req.body;

    if (restrictions?.cannot_create_role_1 && role === 1) {
      return res.status(403).json({
        error: 'IT Admin cannot create Captain accounts'
      });
    }

    if (restrictions?.cannot_create_role_5 && role === 5) {
      return res.status(403).json({
        error: 'IT Admin cannot create Resident accounts directly'
      });
    }

    next();
  }
};

/**
 * Check if a role has permission for a specific endpoint
 * @param {number} roleId - THEMIS role ID (0-5)
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} endpoint - API endpoint path
 * @returns {boolean} - True if access allowed
 */
function checkEndpointPermission(roleId, method, endpoint) {
  const rolePermissions = THEMIS_PERMISSIONS[roleId];

  if (!rolePermissions) {
    return false;
  }

  // Check exact endpoint match
  const fullEndpoint = `${method} ${endpoint}`;
  if (rolePermissions.endpoints[fullEndpoint] === true) {
    return true;
  }

  // Check wildcard patterns
  for (const pattern in rolePermissions.endpoints) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(fullEndpoint)) {
        return rolePermissions.endpoints[pattern];
      }
    }
  }

  return false;
}

/**
 * Get role restrictions
 * @param {number} roleId - THEMIS role ID (0-5)
 * @returns {object} - Role restrictions
 */
function getRoleRestrictions(roleId) {
  return THEMIS_PERMISSIONS[roleId]?.restrictions || {};
}

module.exports = {
  THEMIS_PERMISSIONS,
  checkEndpointPermission,
  getRoleRestrictions,
  enforcePermissions,
  BUSINESS_RULES
};
