// THEMIS RBAC: Client-side permissions for 6-tier system
export const PERMISSIONS = {
  // IT Admin (Role 0) - Tech/Infra only
  IT_ADMIN: {
    USER_PROVISIONING: true,
    BULK_IMPORT: true,
    SYSTEM_MONITORING: true,
    FIREBASE_USERS: true
  },

  // Captain (Role 1) - Read-Only Analytics
  CAPTAIN: {
    ANALYTICS: true,
    DASHBOARD: true,
    REPORTS: true,
    READ_RESIDENTS: true,
    READ_BLOTTER: true,
    READ_CERTIFICATES: true
  },

  // Secretary (Role 2) - Ops/Approver
  SECRETARY: {
    DOCUMENTS: true,
    APPROVE_CLEARANCES: true,  // APPROVE/DENY only
    MANAGE_RESIDENTS: true,
    EVENTS: true,
    CERTIFICATE_TYPES: true
  },

  // Clerk (Role 3) - Fulfillment/Issuer
  CLERK: {
    ISSUE_CERTIFICATES: true,  // PROCESS & RELEASE
    VIEW_DOCUMENTS: true,
    LIMITED_RESIDENT_ACCESS: true
  },

  // Blotter Officer (Role 4) - Case Manager
  BLOTTER_OFFICER: {
    FULL_BLOTTER_CRUD: true,
    BLOTTER_ANALYTICS: true
  },

  // Resident (Role 5) - End User
  RESIDENT: {
    OWN_PROFILE: true,
    REQUEST_CLEARANCE: true,
    VIEW_CERTIFICATES: true,
    SUBMIT_VERIFICATION: true
  }
};

/**
 * THEMIS RBAC: Check if user has permission for a specific action
 * @param {string} permission - Permission key (e.g., 'ANALYTICS', 'ISSUE_CERTIFICATES')
 * @param {object} user - User object with role property (numeric 0-5)
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (permission, user) => {
  if (!user?.role && user?.role !== 0) return false;

  const roleId = typeof user.role === 'string' ? parseInt(user.role) : user.role;

  switch (roleId) {
    case 0: // IT Admin
      return PERMISSIONS.IT_ADMIN[permission] || false;
    case 1: // Captain
      return PERMISSIONS.CAPTAIN[permission] || false;
    case 2: // Secretary
      return PERMISSIONS.SECRETARY[permission] || false;
    case 3: // Clerk
      return PERMISSIONS.CLERK[permission] || false;
    case 4: // Blotter Officer
      return PERMISSIONS.BLOTTER_OFFICER[permission] || false;
    case 5: // Resident
      return PERMISSIONS.RESIDENT[permission] || false;
    default:
      return false;
  }
};

/**
 * Check if user can view a specific section
 * @param {string} section - Section name
 * @param {object} user - User object
 * @returns {boolean}
 */
export const canViewSection = (section, user) => {
  const roleId = typeof user?.role === 'string' ? parseInt(user.role) : user?.role;

  switch (section) {
    case 'it-admin':
      return roleId === 0;
    case 'captain':
      return roleId === 1;
    case 'secretary':
      return roleId === 2;
    case 'clerk':
      return roleId === 3;
    case 'blotter-officer':
      return roleId === 4;
    case 'resident':
      return roleId === 5;
    case 'analytics':
      return hasPermission('ANALYTICS', user);
    case 'documents':
      return hasPermission('DOCUMENTS', user) || hasPermission('VIEW_DOCUMENTS', user);
    case 'certificates':
      return hasPermission('ISSUE_CERTIFICATES', user) || hasPermission('VIEW_CERTIFICATES', user);
    case 'blotter':
      return hasPermission('FULL_BLOTTER_CRUD', user) || hasPermission('READ_BLOTTER', user);
    default:
      return false;
  }
};

/**
 * Get user's THEMIS role name
 * @param {object} user - User object
 * @returns {string} - Role name
 */
export const getRoleName = (user) => {
  const roleId = typeof user?.role === 'string' ? parseInt(user.role) : user?.role;

  switch (roleId) {
    case 0: return 'IT Admin';
    case 1: return 'Captain';
    case 2: return 'Secretary';
    case 3: return 'Clerk';
    case 4: return 'Blotter Officer';
    case 5: return 'Resident';
    default: return 'Unknown';
  }
};

/**
 * Check if user is staff (non-resident)
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isStaff = (user) => {
  const roleId = typeof user?.role === 'string' ? parseInt(user.role) : user?.role;
  return roleId >= 0 && roleId <= 4; // Roles 0-4 are staff
};

/**
 * Get navigation items for user's role
 * @param {object} user - User object
 * @returns {Array} - Array of navigation items
 */
export const getNavigationItems = (user) => {
  const roleId = typeof user?.role === 'string' ? parseInt(user.role) : user?.role;
  const items = [];

  // Common items for all roles
  items.push({ path: '/', label: 'Dashboard' });

  switch (roleId) {
    case 0: // IT Admin
      items.push(
        { path: '/users', label: 'User Provisioning' },
        { path: '/bulk-import', label: 'Bulk Import' },
        { path: '/system-monitoring', label: 'System Monitoring' }
      );
      break;

    case 1: // Captain
      items.push(
        { path: '/analytics', label: 'Analytics' },
        { path: '/reports', label: 'Reports' },
        { path: '/residents', label: 'Resident Data' }
      );
      break;

    case 2: // Secretary
      items.push(
        { path: '/documents', label: 'Document Management' },
        { path: '/residents', label: 'Resident Management' },
        { path: '/events', label: 'Events' }
      );
      break;

    case 3: // Clerk
      items.push(
        { path: '/certificates', label: 'Issue Certificates' },
        { path: '/documents', label: 'Document Processing' }
      );
      break;

    case 4: // Blotter Officer
      items.push(
        { path: '/blotter', label: 'Case Management' },
        { path: '/blotter-analytics', label: 'Blotter Analytics' }
      );
      break;

    case 5: // Resident
      items.push(
        { path: '/profile', label: 'My Profile' },
        { path: '/certificates', label: 'My Certificates' },
        { path: '/request-clearance', label: 'Request Clearance' }
      );
      break;
  }

  return items;
};
