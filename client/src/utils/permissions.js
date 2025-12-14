// Role-based permissions helper functions
export const PERMISSIONS = {
  // Document Templates
  DOCUMENTS: {
    TEMPLATES: {
      CREATE: ['admin', 'captain'],
      EDIT: ['admin', 'captain', 'secretary'],
      DELETE: ['admin', 'captain'],
      VIEW: ['admin', 'captain', 'secretary'],
      UPLOAD: ['admin', 'captain']
    },
    // Certificate Types
    TYPES: {
      CREATE: ['admin', 'captain'],
      EDIT: ['admin', 'captain', 'secretary'],
      DELETE: ['admin', 'captain'],
      VIEW: ['admin', 'captain', 'secretary']
    },
    // Certificate Issuance
    ISSUANCE: {
      CREATE: ['admin', 'captain', 'secretary', 'clerk'],
      VIEW: ['admin', 'captain', 'secretary', 'clerk'],
      EDIT: ['admin', 'captain', 'secretary'],
      DELETE: ['admin', 'captain']
    },
    // Analytics/Dashboard
    ANALYTICS: {
      VIEW: ['admin', 'captain', 'secretary', 'clerk']
    }
  }
};

/**
 * Check if user has permission for a specific action
 * @param {string} resource - Resource name (e.g., 'DOCUMENTS.TEMPLATES')
 * @param {string} action - Action name (e.g., 'CREATE', 'EDIT', 'DELETE', 'VIEW')
 * @param {object} user - User object with role property
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (resource, action, user) => {
  if (!user?.role) return false;

  const permissionRoles = PERMISSIONS[resource.split('.')[0]]?.[resource.split('.')[1]]?.[action];
  return permissionRoles?.includes(user.role) || false;
};

/**
 * Check if user can view a specific section/tab
 * @param {string} section - Section name
 * @param {object} user - User object
 * @returns {boolean}
 */
export const canViewSection = (section, user) => {
  switch (section) {
    case 'documents':
    case 'dashboard':
      return true; // All roles can view document dashboard
    case 'templates':
      return hasPermission('DOCUMENTS.TEMPLATES', 'VIEW', user);
    case 'certificate-types':
      return hasPermission('DOCUMENTS.TYPES', 'VIEW', user);
    default:
      return false;
  }
};

/**
 * Get user's role hierarchy level
 * @param {object} user - User object
 * @returns {number} - Higher number = more permissions
 */
export const getRoleLevel = (user) => {
  const roleLevels = {
    'admin': 4,
    'captain': 3,
    'secretary': 2,
    'clerk': 1
  };
  return roleLevels[user?.role] || 0;
};

/**
 * Check if user role is at least the specified level
 * @param {object} user - User object
 * @param {string} minRole - Minimum required role
 * @returns {boolean}
 */
export const hasRoleLevel = (user, minRole) => {
  const userLevel = getRoleLevel(user);
  const minLevel = getRoleLevel({ role: minRole });
  return userLevel >= minLevel;
};

/**
 * Get available tabs for user's role
 * @param {object} user - User object
 * @returns {Array} - Array of available tab objects
 */
export const getAvailableTabs = (user) => {
  const allTabs = [
    { id: 0, label: 'Issue Certificates', icon: 'Add', permission: true },
    { id: 1, label: 'Certificate History', icon: 'Description', permission: true },
    { id: 2, label: 'Document Templates', icon: 'Settings', permission: hasPermission('DOCUMENTS.TEMPLATES', 'VIEW', user) },
    { id: 3, label: 'Certificate Types', icon: 'Assignment', permission: hasPermission('DOCUMENTS.TYPES', 'VIEW', user) },
    { id: 4, label: 'Document Analytics', icon: 'Assessment', permission: hasPermission('DOCUMENTS.ANALYTICS', 'VIEW', user) }
  ];

  return allTabs.filter(tab => tab.permission);
};
