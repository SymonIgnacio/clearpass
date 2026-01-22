// CLEARPASS Role Hierarchy (Database Aligned)
const ROLES = {
  ADMIN: 1, // IT Admin (System & Technical Authority)
  CAPTAIN: 2, // Barangay Captain (Executive - Read Only)
  SECRETARY: 3, // Barangay Secretary
  CLERK: 4, // Administrative Clearance Clerks
  BLOTTER_OFFICER: 6, // Blotter Officer
  RESIDENT: 12, // Residents
  GUEST: 13, // Pending Verification (Limited Access)
};

// Role name mapping (Database Aligned)
const ROLE_NAMES = {
  1: 'IT Admin',
  2: 'Captain',
  3: 'Secretary',
  4: 'Clerk',
  6: 'Blotter Officer',
  12: 'Resident',
  13: 'Guest',
};

// Helper function to check if user has role
const hasRole = (user, allowedRoles) => {
  return allowedRoles.includes(user.role);
};

module.exports = { ROLES, ROLE_NAMES, hasRole };
