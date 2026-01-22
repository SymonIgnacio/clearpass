// CLEARPASS RBAC: Updated to match System Requirements
export const PERMISSIONS = {
  // IT Admin (Role 1) - FULL SYSTEM ACCESS
  IT_ADMIN: {
    FULL_SYSTEM_ACCESS: true,
    USER_MANAGEMENT: true,
    SYSTEM_LOGS: true,
    SYSTEM_CONFIG: true,
    BACKUP_RESTORE: true,
    AI_ANALYTICS_TECHNICAL: true,
    VIEW_ALL_RESIDENTS: true,
    VIEW_ALL_BLOTTER: true,
    VIEW_ALL_CERTIFICATES: true,
    VIEW_ALL_DOCUMENTS: true,
  },

  // Captain (Role 2) - Executive Read-Only
  CAPTAIN: {
    EXECUTIVE_DASHBOARD: true,
    RESIDENT_STATISTICS: true,
    BLOTTER_MONITORING: true,
    CLEARANCE_TRENDS: true,
    REPORTS_ANALYTICS: true,
    AI_EXECUTIVE_INSIGHTS: true,
    READ_RESIDENTS: true,
    READ_BLOTTER: true,
    READ_CERTIFICATES: true,
  },

  // Secretary (Role 3) - Administrative Authority
  SECRETARY: {
    SECRETARY_DASHBOARD: true,
    RESIDENT_RECORDS_OVERSIGHT: true,
    DOCUMENT_VERIFICATION: true,
    BENEFICIARY_VALIDATION: true,
    BLOTTER_OVERSIGHT: true,
    CLEARANCE_OVERSIGHT: true,
    REPORTS_ANALYTICS: true,
    AI_RISK_INSIGHTS: true,
    ADMIN_SETTINGS: true,
    MANAGE_RESIDENTS: true,
    APPROVE_REGISTRATIONS: true,
    VERIFY_DOCUMENTS: true,
  },

  // Clerk (Role 4) - Certificate Processing
  CLERK: {
    CLERK_DASHBOARD: true,
    RESIDENT_VERIFICATION: true,
    CLEARANCE_PROCESSING: true,
    DOCUMENT_ISSUANCE: true,
    NOTIFICATIONS: true,
    AI_WORKLOAD_INSIGHTS: true,
    VIEW_RESIDENTS: true,
    PROCESS_CERTIFICATES: true,
  },

  // Blotter Officer (Role 6) - Case Management Authority
  BLOTTER_OFFICER: {
    BLOTTER_DASHBOARD: true,
    RESIDENT_COMPLAINTS: true,
    NEW_CASE_ENCODING: true,
    CASE_REVIEW: true,
    HEARING_ATTENDANCE: true,
    BLOTTER_REPORTS: true,
    AI_CRIME_ANALYTICS: true,
    FULL_BLOTTER_CRUD: true,
  },

  // Resident (Role 12) - Self-Service
  RESIDENT: {
    RESIDENT_REGISTRATION: true,
    RESIDENT_LOGIN: true,
    RESIDENT_DASHBOARD: true,
    PROFILE_VERIFICATION: true,
    BLOTTER_COMPLAINT_FILING: true,
    CLEARANCE_REQUESTS: true,
    REQUEST_HISTORY: true,
    ANNOUNCEMENTS: true,
    OWN_PROFILE: true,
    REQUEST_CLEARANCE: true,
    VIEW_OWN_CERTIFICATES: true,
  },
};

/**
 * Check if user has permission for a specific action
 * @param {string} permission - Permission key
 * @param {object} user - User object with role property
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (permission, user) => {
  if (!user?.role && user?.role !== 0) return false;

  const roleId = typeof user.role === 'string' ? parseInt(user.role) : user.role;

  switch (roleId) {
    case 1: // IT Admin - FULL ACCESS TO EVERYTHING
      return PERMISSIONS.IT_ADMIN[permission] || true; // IT Admin can access everything
    case 2: // Captain
      return PERMISSIONS.CAPTAIN[permission] || false;
    case 3: // Secretary
      return PERMISSIONS.SECRETARY[permission] || false;
    case 4: // Clerk
      return PERMISSIONS.CLERK[permission] || false;
    case 6: // Blotter Officer
      return PERMISSIONS.BLOTTER_OFFICER[permission] || false;
    case 12: // Resident
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
      return roleId === 1;
    case 'captain':
      return roleId === 2;
    case 'secretary':
      return roleId === 3;
    case 'clerk':
      return roleId === 4;
    case 'blotter-officer':
      return roleId === 6;
    case 'resident':
      return roleId === 12;
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
export const getRoleName = user => {
  const roleId = typeof user?.role === 'string' ? parseInt(user.role) : user?.role;

  switch (roleId) {
    case 1:
      return 'IT Admin';
    case 2:
      return 'Captain';
    case 3:
      return 'Secretary';
    case 4:
      return 'Clerk';
    case 6:
      return 'Blotter Officer';
    case 12:
      return 'Resident';
    default:
      return 'Unknown';
  }
};

/**
 * Check if user is staff (non-resident)
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isStaff = user => {
  const roleId = typeof user?.role === 'string' ? parseInt(user.role) : user?.role;
  return [1, 2, 3, 4, 6].includes(roleId); // Staff roles: IT Admin, Captain, Secretary, Clerk, Blotter Officer
};

/**
 * Get navigation items for user's role
 * @param {object} user - User object
 * @returns {Array} - Array of navigation items
 */
export const getNavigationItems = user => {
  const roleId = typeof user?.role === 'string' ? parseInt(user.role) : user?.role;
  const items = [];

  // Common items for all roles
  items.push({ path: '/', label: 'Dashboard' });

  switch (roleId) {
    case 1: // IT Admin
      items.push(
        { path: '/users', label: 'User Provisioning' },
        { path: '/bulk-import', label: 'Bulk Import' },
        { path: '/system-monitoring', label: 'System Monitoring' }
      );
      break;

    case 2: // Captain
      items.push(
        { path: '/analytics', label: 'Analytics' },
        { path: '/reports', label: 'Reports' },
        { path: '/residents', label: 'Resident Data' }
      );
      break;

    case 3: // Secretary
      items.push(
        { path: '/documents', label: 'Document Management' },
        { path: '/residents', label: 'Resident Management' },
        { path: '/events', label: 'Events' }
      );
      break;

    case 4: // Clerk
      items.push(
        { path: '/certificates', label: 'Issue Certificates' },
        { path: '/documents', label: 'Document Processing' }
      );
      break;

    case 6: // Blotter Officer
      items.push(
        { path: '/blotter', label: 'Case Management' },
        { path: '/blotter-analytics', label: 'Blotter Analytics' }
      );
      break;

    case 12: // Resident
      items.push(
        { path: '/profile', label: 'My Profile' },
        { path: '/certificates', label: 'My Certificates' },
        { path: '/request-clearance', label: 'Request Clearance' }
      );
      break;
  }

  return items;
};
