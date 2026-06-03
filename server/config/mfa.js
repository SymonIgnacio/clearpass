const isMfaEnforced = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.MFA_ENFORCE_VERIFICATION !== 'false';
  }

  if (process.env.MFA_ENFORCE_VERIFICATION !== 'true') return false;
  if (process.env.NODE_ENV === 'test') return true;
  return process.env.MFA_ENFORCE_IN_DEV === 'true';
};

module.exports = { isMfaEnforced };
