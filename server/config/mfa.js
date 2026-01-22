const isMfaEnforced = () => {
  if (process.env.MFA_ENFORCE_VERIFICATION === 'true') return true;
  if (process.env.MFA_ENFORCED === 'true') return true;
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') return true;
  return process.env.MFA_ENFORCE_IN_DEV === 'true';
};

module.exports = { isMfaEnforced };
