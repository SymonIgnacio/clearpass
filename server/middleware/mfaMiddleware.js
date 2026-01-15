const { isMfaEnforced } = require('../config/mfa');

const requireMfaForRoles = (roles = []) => {
  return (req, res, next) => {
    const enforce = isMfaEnforced();
    if (!enforce) return next();

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return next();
    }

    if (req.user.mfa_verified === true) {
      return next();
    }

    return res.status(428).json({ error: 'MFA required' });
  };
};

module.exports = { requireMfaForRoles };
