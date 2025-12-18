// THEMIS ClearPass - Dynamic Navigation Configuration
// Role IDs: 1=Admin, 2=Clerk, 3=Officer, 4=Resident, 5=Captain, 6=Secretary

export const NAV_ITEMS = [
  // --- COMMON ---
  { label: 'Dashboard', path: '/:role/dashboard', roles: [1, 2, 3, 4, 5, 6] },

  // --- ADMIN (1) ONLY ---
  { label: 'User Management', path: '/admin/users', roles: [1] },
  { label: 'System Settings', path: '/admin/settings', roles: [1] },
  { label: 'Resident Import', path: '/admin/residents/import', roles: [1] },

  // --- CLERK (2) & SECRETARY (6) ---
  { label: 'Clearance Processing', path: '/clerk/clearances', roles: [2, 6] },
  { label: 'Issue Certificates', path: '/clerk/documents', roles: [2] }, // Secretary cannot print

  // --- OFFICER (3) ONLY ---
  { label: 'Blotter Cases', path: '/officer/cases', roles: [3] },
  { label: 'Incident Analytics', path: '/officer/ai-analytics', roles: [3] },

  // --- CAPTAIN (5) & SECRETARY (6) ---
  { label: 'Blotter Oversight', path: '/captain/blotters', roles: [5, 6] }, // Read-Only view
  { label: 'Executive Reports', path: '/captain/reports', roles: [5, 6] },

  // --- RESIDENT (4) ---
  { label: 'My Requests', path: '/resident/requests', roles: [4] },
  { label: 'My Profile', path: '/resident/profile', roles: [4] },
];

/**
 * Get navigation items filtered by user role
 * @param {object} user - User object with role property
 * @returns {Array} - Filtered navigation items with resolved paths
 */
export const getNavigationForUser = (user) => {
  if (!user || !user.role) return [];

  // Convert role to number for comparison
  const userRole = typeof user.role === 'string' ? parseInt(user.role) : user.role;

  return NAV_ITEMS
    .filter(item => item.roles.includes(userRole))
    .map(item => ({
      ...item,
      path: resolveDynamicPath(item.path, userRole)
    }));
};

/**
 * Resolve dynamic paths like '/:role/dashboard' to actual routes
 * @param {string} path - Path template
 * @param {number} role - User role ID
 * @returns {string} - Resolved path
 */
const resolveDynamicPath = (path, role) => {
  if (!path.includes(':role')) return path;

  const rolePaths = {
    1: 'admin',      // Admin
    2: 'clerk',      // Clerk
    3: 'officer',    // Officer
    4: 'resident',   // Resident
    5: 'captain',    // Captain
    6: 'secretary'   // Secretary
  };

  const roleSlug = rolePaths[role] || 'dashboard';
  return path.replace('/:role', `/${roleSlug}`);
};
