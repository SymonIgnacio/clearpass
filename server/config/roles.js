// Role ID Constants
const ROLES = {
  CAPTAIN: 2,
  SECRETARY: 3,
  CLERK: 4,
  ADMIN: 5,
  BLOTTER_OFFICER: 6,
  RESIDENT: 12
};

// Role name mapping
const ROLE_NAMES = {
  2: 'Captain',
  3: 'Secretary',
  4: 'Clerk',
  5: 'Admin',
  6: 'Blotter Officer',
  12: 'Resident'
};

// Helper function to check if user has role
const hasRole = (user, allowedRoles) => {
  return allowedRoles.includes(user.role_id);
};

module.exports = { ROLES, ROLE_NAMES, hasRole };
