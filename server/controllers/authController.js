const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { createErrorResponse, createSuccessResponse } = require('../middleware/errorHandler');
const { logger } = require('../middleware/logger');
const { ROLE_MAP } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');
const { isMfaEnforced } = require('../config/mfa');
const { createOtpChallenge, verifyOtpChallenge, sendOtpEmail } = require('../utils/mfaOtp');
const { logAuditEvent, logAuditToDatabase, AUDIT_EVENTS } = require('../middleware/auditLogger');
require('dotenv').config();

const normalizeRole = role => {
  if (typeof role === 'number') {
    return role;
  }
  if (typeof role === 'string') {
    const lower = role.toLowerCase();
    if (ROLE_MAP[lower]) {
      return ROLE_MAP[lower];
    }
    const parsed = parseInt(role, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return role;
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    logger.debug(`Login attempt for ${username}`);

    // Input validation
    if (!username || !password) {
      return res.status(400).json(createErrorResponse('Username and password required', 400));
    }

    if (username.length > 50 || password.length > 100) {
      return res.status(400).json(createErrorResponse('Invalid input length', 400));
    }

    // CLEARPASS: Use role column directly (Database Aligned)
    const [users] = await db.execute(
      `SELECT u.*, 
        CASE u.role 
          WHEN 1 THEN 'IT Admin'
          WHEN 2 THEN 'Captain'
          WHEN 3 THEN 'Secretary'
          WHEN 4 THEN 'Clerk'
          WHEN 6 THEN 'Blotter Officer'
          WHEN 12 THEN 'Resident'
        END as role_name
       FROM users u 
       WHERE u.username = ? AND u.is_active = TRUE`,
      [username]
    );

    if (users.length === 0) {
      logger.warn(`Login failed: User ${username} not found`);
      return res.status(401).json(createErrorResponse('Invalid credentials', 401));
    }

    const user = users[0];
    const normalizedRole = normalizeRole(user.role);

    const requestPath = req.originalUrl || req.path || '';
    if (requestPath.includes('/auth/officer-login') && normalizedRole === ROLES.RESIDENT) {
      return res
        .status(403)
        .json(createErrorResponse('Residents must use the resident login page', 403));
    }
    if (requestPath.includes('/auth/resident/login') && normalizedRole !== ROLES.RESIDENT) {
      return res
        .status(403)
        .json(createErrorResponse('Staff must use the officer login page', 403));
    }

    if (!user.password_hash) {
      return res.status(401).json(createErrorResponse('Account not configured', 401));
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    // logger.debug(`Password match for ${username}: ${isValidPassword}`); // Sensitive info hidden

    if (!isValidPassword) {
      return res.status(401).json(createErrorResponse('Invalid credentials', 401));
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json(createErrorResponse('Server configuration error', 500));
    }

    const mfaEnforced = isMfaEnforced();
    const mfaRequired = mfaEnforced && [ROLES.RESIDENT].includes(normalizedRole);

    if (mfaRequired) {
      if (!user.email) {
        return res
          .status(500)
          .json(createErrorResponse('MFA delivery not configured for this account', 500));
      }
      const challenge = await createOtpChallenge({ db, userId: user.id });
      await sendOtpEmail({
        to: user.email,
        otp: challenge.otp,
        expiresMinutes: challenge.expiresMinutes,
      });
      const auditDetails = {
        user_id: user.id,
        user_role: normalizedRole,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        resource: req.originalUrl,
        action: req.method,
        result: 'SUCCESS',
        additional_details: {
          challenge_id: challenge.challengeId,
        },
        session_id: req.sessionID,
      };
      logAuditEvent(AUDIT_EVENTS.MFA_OTP_SENT, auditDetails);
      if (db && typeof db.execute === 'function') {
        logAuditToDatabase(db, AUDIT_EVENTS.MFA_OTP_SENT, auditDetails);
      }
    }

    // CLEARPASS: JWT with role (Database Aligned)
    const signOptions = mfaRequired
      ? { expiresIn: process.env.MFA_PENDING_JWT_EXPIRES_IN || '15m' }
      : {};

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: normalizedRole,
        role_name: user.role_name,
        resident_id: user.resident_id, // Added resident_id
        mfa_verified: !mfaRequired,
      },
      process.env.JWT_SECRET,
      signOptions
    );

    // Set httpOnly cookie
    if (!mfaRequired) {
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year (effectively indefinite)
      });
    }

    const auditDetails = {
      user_id: user.id,
      user_role: normalizedRole,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      resource: req.originalUrl,
      action: req.method,
      result: 'SUCCESS',
      session_id: req.sessionID,
    };
    logAuditEvent(AUDIT_EVENTS.LOGIN_SUCCESS, auditDetails);
    if (db && typeof db.execute === 'function') {
      await logAuditToDatabase(db, AUDIT_EVENTS.LOGIN_SUCCESS, auditDetails);
    }

    res.json({
      success: true,
      token, // Return token for client-side storage/testing
      mfa_required: mfaRequired,
      user: {
        id: user.id,
        username: user.username,
        role: normalizedRole,
        role_name: user.role_name,
        email: user.email,
        full_name: user.full_name,
        mfa_verified: !mfaRequired,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json(createErrorResponse('Login failed', 500));
  }
};

const register = async (req, res) => {
  try {
    const { username, password, email, full_name, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role required' });
    }

    const [existing] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    await db.execute(
      'INSERT INTO users (username, password_hash, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, password_hash, email, full_name, role]
    );

    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const logout = async (req, res) => {
  try {
    // Clear the httpOnly cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

const me = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // CLEARPASS: Use role column (Database Aligned) with Resident Status Check
    const [users] = await db.execute(
      `SELECT u.*, r.Residency_Status,
        CASE 
          WHEN r.Residency_Status = 'Pending Verification' THEN 13
          ELSE u.role
        END as effective_role,
        CASE 
          WHEN r.Residency_Status = 'Pending Verification' THEN 'Guest'
          WHEN u.role = 1 THEN 'IT Admin'
          WHEN u.role = 2 THEN 'Captain'
          WHEN u.role = 3 THEN 'Secretary'
          WHEN u.role = 4 THEN 'Clerk'
          WHEN u.role = 6 THEN 'Blotter Officer'
          WHEN u.role = 12 THEN 'Resident'
          WHEN u.role = 13 THEN 'Guest'
        END as role_name
       FROM users u 
       LEFT JOIN residents r ON u.resident_id = r.Resident_ID
       WHERE u.id = ? AND u.is_active = TRUE`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];
    // Use effective_role instead of raw role
    const normalizedRole = normalizeRole(user.effective_role);
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: normalizedRole,
        role_name: user.role_name,
        email: user.email,
        full_name: user.full_name,
        mfa_verified: isMfaEnforced() ? req.user.mfa_verified === true : true,
      },
    });
  } catch (error) {
    logger.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
};

const requestMfaOtp = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(createErrorResponse('Not authenticated', 401));
    }
    const mfaEnforced = isMfaEnforced();
    if (!mfaEnforced) {
      return res.status(400).json(createErrorResponse('MFA enforcement is disabled', 400));
    }
    if (![ROLES.RESIDENT].includes(req.user.role)) {
      return res.status(403).json(createErrorResponse('MFA not required for this role', 403));
    }
    if (req.user.mfa_verified === true) {
      return res.json(createSuccessResponse({ message: 'MFA already verified' }));
    }

    const [users] = await db.execute(
      `SELECT u.*, 
        CASE u.role 
          WHEN 1 THEN 'IT Admin'
          WHEN 2 THEN 'Captain'
          WHEN 3 THEN 'Secretary'
          WHEN 4 THEN 'Clerk'
          WHEN 6 THEN 'Blotter Officer'
          WHEN 12 THEN 'Resident'
        END as role_name
       FROM users u 
       WHERE u.id = ? AND u.is_active = TRUE`,
      [req.user.id]
    );
    if (!users.length) {
      return res.status(401).json(createErrorResponse('User not found', 401));
    }
    const user = users[0];
    if (!user.email) {
      return res
        .status(500)
        .json(createErrorResponse('MFA delivery not configured for this account', 500));
    }

    const challenge = await createOtpChallenge({ db, userId: user.id });
    await sendOtpEmail({
      to: user.email,
      otp: challenge.otp,
      expiresMinutes: challenge.expiresMinutes,
    });
    return res.json(
      createSuccessResponse({
        message: 'OTP sent',
        expires_in_minutes: challenge.expiresMinutes,
      })
    );
  } catch (error) {
    logger.error('MFA OTP request error:', error);
    return res.status(500).json(createErrorResponse('Failed to send OTP', 500));
  }
};

const verifyMfaOtpCode = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(createErrorResponse('Not authenticated', 401));
    }
    const mfaEnforced = isMfaEnforced();
    if (!mfaEnforced) {
      return res.status(400).json(createErrorResponse('MFA enforcement is disabled', 400));
    }
    if (![ROLES.RESIDENT].includes(req.user.role)) {
      return res.status(403).json(createErrorResponse('MFA not required for this role', 403));
    }

    const otp = String(req.body?.otp || '').trim();
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json(createErrorResponse('Invalid OTP', 400));
    }

    const verified = await verifyOtpChallenge({ db, userId: req.user.id, otp });
    if (!verified.ok) {
      const auditDetails = {
        user_id: req.user.id,
        user_role: req.user.role,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        resource: req.originalUrl,
        action: req.method,
        result: 'FAILED',
        additional_details: { reason: verified.reason },
        session_id: req.sessionID,
      };
      logAuditEvent(AUDIT_EVENTS.MFA_OTP_FAILED, auditDetails);
      if (db && typeof db.execute === 'function') {
        logAuditToDatabase(db, AUDIT_EVENTS.MFA_OTP_FAILED, auditDetails);
      }
      return res.status(401).json(createErrorResponse('OTP verification failed', 401));
    }

    const [users] = await db.execute(
      `SELECT u.*, 
        CASE u.role 
          WHEN 1 THEN 'IT Admin'
          WHEN 2 THEN 'Captain'
          WHEN 3 THEN 'Secretary'
          WHEN 4 THEN 'Clerk'
          WHEN 6 THEN 'Blotter Officer'
          WHEN 12 THEN 'Resident'
        END as role_name
       FROM users u 
       WHERE u.id = ? AND u.is_active = TRUE`,
      [req.user.id]
    );
    if (!users.length) {
      return res.status(401).json(createErrorResponse('User not found', 401));
    }
    const user = users[0];
    const normalizedRole = normalizeRole(user.role);

    // Generate full JWT token (No expiration)
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: normalizedRole,
        role_name: user.role_name,
        mfa_verified: true,
      },
      process.env.JWT_SECRET
      // No expiresIn option means the token never expires
    );

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Needed for some cross-site scenarios, or 'strict' if same domain
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year (effectively indefinite)
    });

    const auditDetails = {
      user_id: user.id,
      user_role: normalizedRole,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      resource: req.originalUrl,
      action: req.method,
      result: 'SUCCESS',
      additional_details: { challenge_id: verified.challengeId },
      session_id: req.sessionID,
    };
    logAuditEvent(AUDIT_EVENTS.MFA_OTP_VERIFIED, auditDetails);
    if (db && typeof db.execute === 'function') {
      logAuditToDatabase(db, AUDIT_EVENTS.MFA_OTP_VERIFIED, auditDetails);
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: normalizedRole,
        role_name: user.role_name,
        email: user.email,
        full_name: user.full_name,
        mfa_verified: true,
      },
    });
  } catch (error) {
    logger.error('MFA OTP verify error:', error);
    return res.status(500).json(createErrorResponse('OTP verification failed', 500));
  }
};

const updateProfile = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Not authenticated', message: 'Not authenticated' });
    }

    const { username, email, full_name, contact_number } = req.body || {};

    if (!full_name || !String(full_name).trim()) {
      return res
        .status(400)
        .json({ error: 'Full name is required', message: 'Full name is required' });
    }

    const nextUsername = username != null ? String(username).trim() : null;
    const nextEmail = email != null && String(email).trim() ? String(email).trim() : null;
    const nextFullName = String(full_name).trim();
    const nextContactNumber =
      contact_number != null && String(contact_number).trim()
        ? String(contact_number).trim()
        : null;

    if (nextUsername && nextUsername.length > 50) {
      return res
        .status(400)
        .json({ error: 'Invalid username length', message: 'Invalid username length' });
    }
    if (nextEmail && (nextEmail.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail))) {
      return res
        .status(400)
        .json({ error: 'Invalid email address', message: 'Invalid email address' });
    }
    if (nextFullName.length > 200) {
      return res
        .status(400)
        .json({ error: 'Invalid full_name length', message: 'Invalid full_name length' });
    }
    if (nextContactNumber && nextContactNumber.length > 20) {
      return res
        .status(400)
        .json({ error: 'Invalid contact_number length', message: 'Invalid contact_number length' });
    }

    if (nextUsername) {
      const [existing] = await db.execute('SELECT id FROM users WHERE username = ? AND id != ?', [
        nextUsername,
        req.user.id,
      ]);
      if (existing.length > 0) {
        return res
          .status(409)
          .json({ error: 'Username already exists', message: 'Username already exists' });
      }
    }

    await db.execute(
      `
        UPDATE users
        SET username = COALESCE(?, username),
            email = ?,
            full_name = ?,
            contact_number = ?,
            updated_at = NOW()
        WHERE id = ?
      `,
      [nextUsername, nextEmail, nextFullName, nextContactNumber, req.user.id]
    );

    const [users] = await db.execute(
      'SELECT id, username, email, full_name, contact_number, role, is_active FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ success: true, user: users[0], message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res
      .status(500)
      .json({ error: 'Failed to update profile', message: 'Failed to update profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Not authenticated', message: 'Not authenticated' });
    }

    const { current_password, new_password } = req.body || {};
    if (!new_password || String(new_password).length < 6 || String(new_password).length > 100) {
      return res.status(400).json({
        error: 'New password must be between 6 and 100 characters',
        message: 'New password must be between 6 and 100 characters',
      });
    }

    const [users] = await db.execute('SELECT id, password_hash, role FROM users WHERE id = ?', [
      req.user.id,
    ]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found', message: 'User not found' });
    }

    const user = users[0];
    const hasPassword = !!user.password_hash;
    const providedCurrent = current_password != null ? String(current_password) : '';

    if (hasPassword) {
      if (providedCurrent) {
        const ok = await bcrypt.compare(providedCurrent, user.password_hash);
        if (!ok) {
          return res.status(401).json({
            error: 'Current password is incorrect',
            message: 'Current password is incorrect',
          });
        }
      } else if (normalizeRole(user.role) !== 1) {
        return res
          .status(400)
          .json({ error: 'Current password is required', message: 'Current password is required' });
      }
    }

    const nextHash = await bcrypt.hash(String(new_password), 10);
    await db.execute('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [
      nextHash,
      req.user.id,
    ]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res
      .status(500)
      .json({ error: 'Failed to change password', message: 'Failed to change password' });
  }
};

const verifyEmailForResidency = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Not authenticated', message: 'Not authenticated' });
    }

    const requestedEmail = req.body?.email != null ? String(req.body.email).trim() : null;
    const [users] = await db.execute('SELECT email FROM users WHERE id = ?', [req.user.id]);
    const email = requestedEmail || users?.[0]?.email || null;

    if (!email) {
      return res.status(400).json({ error: 'Email is required', message: 'Email is required' });
    }

    const [residents] = await db.execute(
      'SELECT Resident_ID FROM residents WHERE Email = ? LIMIT 1',
      [email]
    );
    if (residents.length === 0) {
      return res.status(404).json({
        error: 'No resident record found for this email',
        message: 'No resident record found for this email',
      });
    }

    await db.execute('UPDATE users SET email_verified = 1, verified_at = NOW() WHERE id = ?', [
      req.user.id,
    ]);
    res.json({ success: true, message: 'Email verified for residency' });
  } catch (error) {
    logger.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email', message: 'Failed to verify email' });
  }
};

module.exports = {
  login,
  register,
  logout,
  me,
  updateProfile,
  changePassword,
  verifyEmailForResidency,
  requestMfaOtp,
  verifyMfaOtpCode,
};
