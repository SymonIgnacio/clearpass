// Role utility functions for consistent role handling across the application

// THEMIS role definitions (numeric) - SYNCHRONIZED WITH SQL DATABASE
// CONFIRMED FROM DB DUMP: Admin=1, Captain=2, Secretary=3, Clerk=4, Resident=6, Blotter Officer=7
export const THEMIS_ROLES = {
  1: { id: 1, key: 'it_admin', name: 'IT Admin', displayName: 'Super Admin' },
  2: { id: 2, key: 'captain', name: 'Captain', displayName: 'Barangay Captain' },
  3: { id: 3, key: 'secretary', name: 'Secretary', displayName: 'Barangay Secretary' },
  4: { id: 4, key: 'clerk', name: 'Clerk', displayName: 'Barangay Clerk' },
  6: { id: 6, key: 'resident', name: 'Resident', displayName: 'Resident' },
  7: { id: 7, key: 'blotter_officer', name: 'Blotter Officer', displayName: 'Blotter Officer' }
};

// Legacy role mapping for backward compatibility
export const ROLE_MAPPING = {
  'admin': THEMIS_ROLES[1],
  'captain': THEMIS_ROLES[2],
  'secretary': THEMIS_ROLES[3],
  'clerk': THEMIS_ROLES[4],
  'resident': THEMIS_ROLES[6],
  'blotter_officer': THEMIS_ROLES[7],
  'it_admin': THEMIS_ROLES[1]
};

/**
 * Get THEMIS role object from various input formats
 * @param {number|string} role - Numeric role ID or string role key
 * @returns {object|null} THEMIS role object or null if not found
 */
export const getThemisRole = (role) => {
  if (typeof role === 'number') {
    return THEMIS_ROLES[role] || null;
  }

  if (typeof role === 'string') {
    // Check if it's a numeric string first
    const numericRole = parseInt(role);
    if (!isNaN(numericRole)) {
      return THEMIS_ROLES[numericRole] || null;
    }

    // Check legacy string mappings
    return ROLE_MAPPING[role] || null;
  }

  return null;
};

/**
 * Get role key (string) from various input formats
 * @param {number|string} role - Numeric role ID or string role key
 * @returns {string|null} Role key or null if not found
 */
export const getRoleKey = (role) => {
  const themisRole = getThemisRole(role);
  return themisRole ? themisRole.key : null;
};

/**
 * Get role display name from various input formats
 * @param {number|string} role - Numeric role ID or string role key
 * @returns {string|null} Display name or null if not found
 */
export const getRoleDisplayName = (role) => {
  const themisRole = getThemisRole(role);
  return themisRole ? themisRole.displayName : null;
};

/**
 * Check if user has specific role(s)
 * @param {object} user - User object with role property
 * @param {number|string|array} allowedRoles - Single role or array of allowed roles
 * @returns {boolean} True if user has one of the allowed roles
 */
export const hasRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;

  const userRoleKey = getRoleKey(user.role);
  if (!userRoleKey) return false;

  if (!Array.isArray(allowedRoles)) {
    allowedRoles = [allowedRoles];
  }

  // Convert allowed roles to keys for comparison
  const allowedKeys = allowedRoles.map(role => getRoleKey(role)).filter(key => key !== null);

  return allowedKeys.includes(userRoleKey);
};

/**
 * Check if user has staff role (not resident)
 * @param {object} user - User object with role property
 * @returns {boolean} True if user is staff (not resident)
 */
export const isStaffUser = (user) => {
  if (!user || !user.role) return false;
  const userRoleKey = getRoleKey(user.role);
  return userRoleKey && userRoleKey !== 'resident';
};

/**
 * Check if user has management access (admin, captain, secretary)
 * @param {object} user - User object with role property
 * @returns {boolean} True if user has management access
 */
export const hasManagementAccess = (user) => {
  return hasRole(user, ['admin', 'captain', 'secretary']);
};

/**
 * Check if user can manage events (captain, secretary)
 * @param {object} user - User object with role property
 * @returns {boolean} True if user can manage events
 */
export const canManageEvents = (user) => {
  return hasRole(user, ['captain', 'secretary']);
};

/**
 * Check if user can manage templates (admin, captain)
 * @param {object} user - User object with role property
 * @returns {boolean} True if user can manage templates
 */
export const canManageTemplates = (user) => {
  return hasRole(user, ['admin', 'captain']);
};

/**
 * Check if user can view analytics (admin, captain)
 * @param {object} user - User object with role property
 * @returns {boolean} True if user can view analytics
 */
export const canViewAnalytics = (user) => {
  return hasRole(user, ['admin', 'captain']);
};

/**
 * Get role hierarchy level (higher number = more permissions)
 * @param {number|string} role - Role to check
 * @returns {number} Hierarchy level (0-6, higher = more permissions)
 */
export const getRoleLevel = (role) => {
  const themisRole = getThemisRole(role);
  return themisRole ? themisRole.id : 0;
};

/**
 * Check if user role meets minimum hierarchy level
 * @param {object} user - User object with role property
 * @param {number} minLevel - Minimum hierarchy level required
 * @returns {boolean} True if user meets minimum level
 */
export const hasMinimumLevel = (user, minLevel) => {
  if (!user || !user.role) return false;
  const userLevel = getRoleLevel(user.role);
  return userLevel >= minLevel;
};

// Role constants for easy reference - SYNCHRONIZED WITH SQL DATABASE
export const ROLES = {
  IT_ADMIN: 1,
  CAPTAIN: 2,
  SECRETARY: 3,
  CLERK: 4,
  RESIDENT: 6,
  BLOTTER_OFFICER: 7
};

export const ROLE_KEYS = {
  IT_ADMIN: 'it_admin',
  CAPTAIN: 'captain',
  SECRETARY: 'secretary',
  CLERK: 'clerk',
  RESIDENT: 'resident',
  BLOTTER_OFFICER: 'blotter_officer'
};
