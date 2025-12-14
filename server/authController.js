const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);

// Initialize database connection (same as server)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let db;
try {
  db = mysql.createPool(dbConfig);
  console.log('AuthController database connection established');
} catch (error) {
  console.error('Failed to create database pool:', error);
  throw error;
}

/**
 * Account Hierarchy Authentication Controller
 * Handles registration, login, and JWT token management
 */

// Generate JWT token with hierarchy information (1-day expiration)
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      role_id: user.role_id || null,
      parent_user_id: user.parent_user_id || null,
      hierarchy_level: user.hierarchy_level,
      permissions: user.permissions
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' } // 1-day expiration as required
  );
}

// Role hierarchy mapping (based on existing ENUM values)
const ROLE_HIERARCHY = {
  'admin': { level: 1, permissions: ['read', 'write', 'delete', 'manage_users'], display_name: 'Super Admin' },
  'captain': { level: 2, permissions: ['read', 'write', 'manage_certificates'], display_name: 'Barangay Captain' },
  'secretary': { level: 3, permissions: ['read', 'write', 'manage_documents'], display_name: 'Barangay Secretary' },
  'clerk': { level: 4, permissions: ['read', 'write'], display_name: 'Barangay Clerk' },
  'resident': { level: 5, permissions: ['read'], display_name: 'Resident' }
};

// Firebase Admin SDK
const admin = require('firebase-admin');

// Helper function for database-only login (debug mode)
async function loginDatabaseFallback(req, res, username, password) {
  try {
    const user = await knex('users')
      .where('username', username)
      .first();

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials - user not found'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account not activated. Please complete email verification.'
      });
    }

    // Verify password (note: existing data may have plain passwords, checking both ways)
    let isValidPassword = false;

    try {
      // Try bcrypt first (for properly hashed passwords)
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } catch (bcryptError) {
      // Fallback: check if password matches plain text (for backward compatibility)
      isValidPassword = (user.password_hash === password);
    }

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials - wrong password'
      });
    }

    // Get role information from hierarchy mapping
    const roleInfo = ROLE_HIERARCHY[user.role] || ROLE_HIERARCHY['resident'];

    // Update last login
    await knex('users')
      .where('id', user.id)
      .update({ last_login: knex.fn.now() });

    // Create user object with hierarchy information
    const userWithHierarchy = {
      ...user,
      role_name: roleInfo.display_name,
      hierarchy_level: roleInfo.level,
      permissions: roleInfo.permissions
    };

    // Generate token
    const token = generateToken(userWithHierarchy);

    // Return user info (excluding sensitive data)
    const userResponse = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      role_name: roleInfo.display_name,
      hierarchy_level: roleInfo.level,
      permissions: roleInfo.permissions,
      parent_user_id: null, // No hierarchy in existing schema
      is_active: user.is_active
    };

    res.json({
      message: 'Debug login successful (database only)',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Debug login error:', error);
    res.status(500).json({
      error: 'Internal server error during debug login'
    });
  }
}

// Login controller - Firebase Authentication
async function login(req, res) {
  try {
    const { username, password, bypass_firebase } = req.body;

    // Get client IP for logging
    const clientIP = req.ip || req.connection.remoteAddress ||
                     (req.socket ? req.socket.remoteAddress : null) ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     null;

    // Validate input - Firebase uses email for authentication
    // Convert username to email format if it's not already an email
    let email = username;
    if (!email.includes('@')) {
      // If username doesn't contain @, assume it's a local username and convert to email
      email = `${username}@barangay.local`;
    }

    if (!password) {
      // Log failed login attempt - missing password
      await db.execute(
        'INSERT INTO login_attempts (username, ip_address, success, reason) VALUES (?, ?, false, "Missing password")',
        [username, clientIP]
      ).catch(err => console.error('Failed to log login attempt:', err)); // Don't fail login due to logging error

      return res.status(400).json({
        error: 'Password is required'
      });
    }

    // If bypass_firebase flag is set, skip Firebase and go directly to database auth
    if (bypass_firebase) {
      console.log('🔧 Debug mode: Bypassing Firebase authentication');
      return loginDatabaseFallback(req, res, username, password);
    }

    try {
      // Attempt Firebase sign in
      const userCredential = await admin.auth().getUserByEmail(email);

      if (!userCredential) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Get custom claims (role and hierarchy)
      const customClaims = userCredential.customClaims || {};

      // Get role information from hierarchy mapping
      const role = customClaims.role || 'resident';
      const roleInfo = ROLE_HIERARCHY[role] || ROLE_HIERARCHY['resident'];

    // Check if user exists in database, create if not
      let dbUser = await knex('users')
        .where('email', email)
        .first();

      if (!dbUser) {
        // Create user in database if they don't exist
        const [userId] = await knex('users').insert({
          username: username,
          email: email,
          full_name: userCredential.displayName || username,
          firebase_uid: userCredential.uid,
          role: role,
          is_active: true,
          created_at: knex.fn.now()
        });

        dbUser = await knex('users')
          .where('id', userId)
          .first();
      }

      // Update last login
      await knex('users')
        .where('id', dbUser.id)
        .update({ last_login: knex.fn.now() });

      // Create user object with hierarchy information
      const userWithHierarchy = {
        id: dbUser.id,
        username: dbUser.username,
        full_name: dbUser.full_name,
        email: dbUser.email,
        role: role,
        firebase_uid: userCredential.uid,
        role_name: roleInfo.display_name,
        hierarchy_level: roleInfo.level,
        permissions: roleInfo.permissions
      };

      // Generate JWT token
      const token = generateToken(userWithHierarchy);

      // Return user info (excluding sensitive data)
      const userResponse = {
        id: dbUser.id,
        username: dbUser.username,
        full_name: dbUser.full_name,
        email: dbUser.email,
        role: role,
        role_name: roleInfo.display_name,
        hierarchy_level: roleInfo.level,
        permissions: roleInfo.permissions,
        firebase_uid: userCredential.uid
      };

      res.json({
        message: 'Login successful',
        token,
        user: userResponse
      });

    } catch (firebaseError) {
      console.error('Firebase auth error:', firebaseError);

      // If Firebase auth fails, try fallback to database auth for existing users
      console.log('Firebase auth failed, trying database fallback...');

      const user = await knex('users')
        .where('username', username)
        .where('is_active', true)
        .first();

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Verify password (note: existing data may have plain passwords, checking both ways)
      let isValidPassword = false;

      try {
        // Try bcrypt first (for properly hashed passwords)
        isValidPassword = await bcrypt.compare(password, user.password_hash);
      } catch (bcryptError) {
        // Fallback: check if password matches plain text (for backward compatibility)
        isValidPassword = (user.password_hash === password);
      }

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Get role information from hierarchy mapping
      const roleInfo = ROLE_HIERARCHY[user.role] || ROLE_HIERARCHY['resident'];

      // Update last login
      await knex('users')
        .where('id', user.id)
        .update({ last_login: knex.fn.now() });

      // Create user object with hierarchy information
      const userWithHierarchy = {
        ...user,
        role_name: roleInfo.display_name,
        hierarchy_level: roleInfo.level,
        permissions: roleInfo.permissions
      };

      // Generate token
      const token = generateToken(userWithHierarchy);

      // Return user info (excluding sensitive data)
      const userResponse = {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        role_name: roleInfo.display_name,
        hierarchy_level: roleInfo.level,
        permissions: roleInfo.permissions,
        parent_user_id: null // No hierarchy in existing schema
      };

      res.json({
        message: 'Login successful',
        token,
        user: userResponse
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}

// Register new user (with hierarchy enforcement)
async function register(req, res) {
  const trx = await knex.transaction();

  try {
    const {
      username,
      password,
      full_name,
      email,
      role_id,
      parent_user_id
    } = req.body;

    // Validate required fields
    if (!username || !password || !full_name || !role_id) {
      return res.status(400).json({
        error: 'Username, password, full_name, and role_id are required'
      });
    }

    // Check if user already exists
    const existingUser = await trx('users')
      .where('username', username)
      .first();

    if (existingUser) {
      await trx.rollback();
      return res.status(409).json({
        error: 'Username already exists'
      });
    }

    // Get role information
    const role = await trx('roles')
      .where('id', role_id)
      .where('is_active', true)
      .first();

    if (!role) {
      await trx.rollback();
      return res.status(400).json({
        error: 'Invalid role'
      });
    }

    // If parent_user_id provided, validate hierarchy
    if (parent_user_id) {
      const parentUser = await trx('users')
        .select('users.*', 'roles.hierarchy_level')
        .leftJoin('roles', 'users.role_id', 'roles.id')
        .where('users.id', parent_user_id)
        .where('users.is_active', true)
        .first();

      if (!parentUser) {
        await trx.rollback();
        return res.status(400).json({
          error: 'Invalid parent user'
        });
      }

      // Check if parent has higher or equal hierarchy level
      if (parentUser.hierarchy_level <= role.hierarchy_level) {
        await trx.rollback();
        return res.status(403).json({
          error: 'Cannot assign user under someone with equal or lower authority'
        });
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const [userId] = await trx('users').insert({
      username,
      password_hash: passwordHash,
      full_name,
      email,
      role_id,
      parent_user_id,
      is_active: true
    });

    // Get created user with role info
    const newUser = await trx('users')
      .select(
        'users.*',
        'roles.role_name',
        'roles.hierarchy_level',
        'roles.permissions'
      )
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where('users.id', userId)
      .first();

    await trx.commit();

    // Generate token for immediate login
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        role_name: newUser.role_name,
        hierarchy_level: newUser.hierarchy_level,
        permissions: newUser.permissions ? JSON.parse(newUser.permissions) : [],
        parent_user_id: newUser.parent_user_id
      }
    });

  } catch (error) {
    await trx.rollback();
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}

async function getProfile(req, res) {
  try {
    console.log('🔍 [Profile Debug] Request user ID:', req.user.id);
    console.log('🔍 [Profile Debug] Request user info:', req.user);

    let user;

    try {
      // Use the properly configured knex instance
      user = await knex('users')
        .where('id', req.user.id)
        .where('is_active', true)
        .first();
      console.log('🔍 [Profile Debug] dbKnex query result:', user);
    } catch (knexError) {
      console.log('🔍 [Profile Debug] dbKnex query failed, trying raw query:', knexError);
      // Fallback to raw MySQL query to debug
      try {
        const [rows] = await db.execute(
          'SELECT * FROM users WHERE id = ? AND is_active = true',
          [req.user.id]
        );
        user = rows[0];
        console.log('🔍 [Profile Debug] Raw MySQL query result:', user);
      } catch (mysqlError) {
        console.log('🔍 [Profile Debug] Raw MySQL query also failed:', mysqlError);
      }
    }

    if (!user) {
      console.log('🔍 [Profile Debug] No user found in database');
      return res.status(404).json({
        error: 'User not found',
        debug: {
          requestedId: req.user.id,
          userFromToken: req.user
        }
      });
    }

    // Get role information - support both staff and resident hierarchies
    let roleInfo;
    let isStaffUser = false;

    // Check if this is a staff user (not a resident)
    const staffRoles = ['admin', 'captain', 'secretary', 'clerk'];
    if (staffRoles.includes(user.role)) {
      // Use STAFF_ROLE_HIERARCHY for staff users - critical for consistent permissions
      roleInfo = STAFF_ROLE_HIERARCHY[user.role] || STAFF_ROLE_HIERARCHY['clerk'];
      isStaffUser = true;
      console.log('🔍 [Profile Debug] Staff user detected, using STAFF_ROLE_HIERARCHY:', roleInfo);
    } else {
      // Use standard ROLE_HIERARCHY for residents and others
      roleInfo = ROLE_HIERARCHY[user.role] || ROLE_HIERARCHY['resident'];
      console.log('🔍 [Profile Debug] Resident/user detected, using ROLE_HIERARCHY:', roleInfo);
    }

    // Ensure admin users always get 'all' permissions for consistent access control
    if (user.role === 'admin') {
      roleInfo = STAFF_ROLE_HIERARCHY['admin'];
      console.log('🔍 [Profile Debug] Superadmin user - forcing STAFF_ROLE_HIERARCHY admin permissions:', roleInfo);
    }

    console.log('🔍 [Profile Debug] Final role info:', { userRole: user.role, roleInfo, isStaffUser });

    const profileData = {
      id: user.id,
      username: user.username,
      full_name: user.full_name || user.fullName, // Handle different field names
      email: user.email,
      role: user.role,
      role_name: roleInfo.display_name,
      hierarchy_level: roleInfo.level,
      permissions: roleInfo.permissions,
      parent_user_id: user.parent_user_id,
      last_login: user.last_login,
      is_staff_user: isStaffUser // Add flag to identify staff vs residents
    };

    console.log('🔍 [Profile Debug] Profile data being returned:', profileData);
    res.json(profileData);

  } catch (error) {
    console.error('❌ [Profile Error]:', error);
    console.error('❌ [Profile Error Stack]:', error.stack);

    // Try to provide more debugging info
    const debugInfo = {
      requestedUserId: req.user?.id,
      hasUserInReq: !!req.user,
      errorName: error.name,
      errorMessage: error.message,
      sqlState: error.sqlState || 'N/A'
    };

    res.status(500).json({
      error: 'Internal server error',
      debug: debugInfo
    });
  }
}

// Update user profile (limited to safe fields)
async function updateProfile(req, res) {
  try {
    console.log('🔄 [Profile Update] Request user ID:', req.user.id);
    console.log('🔄 [Profile Update] Update data:', req.body);

    const { full_name, email, contact_number } = req.body;

    // Validate input
    if (full_name !== undefined && (!full_name.trim() || full_name.trim().length < 2)) {
      return res.status(400).json({
        error: 'Full name must be at least 2 characters long'
      });
    }

    if (email !== undefined && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    if (contact_number !== undefined && contact_number && !/^[\d\s\-\+\(\)]+$/.test(contact_number)) {
      return res.status(400).json({
        error: 'Contact number contains invalid characters'
      });
    }

    // Build update object (only include defined fields)
    const updateFields = {};
    const updateValues = [];

    if (full_name !== undefined) {
      updateFields.full_name = full_name.trim();
    }
    if (email !== undefined) {
      updateFields.email = email ? email.trim() : null;
    }
    if (contact_number !== undefined) {
      updateFields.contact_number = contact_number ? contact_number.trim() : null;
    }

    // Check if there are any fields to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        error: 'No valid fields provided for update'
      });
    }

    // Add updated_at timestamp
    updateFields.updated_at = new Date();

    console.log('🔄 [Profile Update] Fields to update:', updateFields);

    // Update user profile using mysql2
    const setClause = Object.keys(updateFields).map(field => `${field} = ?`).join(', ');
    const values = Object.values(updateFields);

    const [updateResult] = await db.execute(
      `UPDATE users SET ${setClause} WHERE id = ? AND is_active = true`,
      [...values, req.user.id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        error: 'User not found or inactive'
      });
    }

    console.log('🔄 [Profile Update] Database update successful, rows affected:', updateResult.affectedRows);

    // Fetch updated profile data
    const [userRows] = await db.execute(
      'SELECT id, username, full_name, email, contact_number, role, last_login FROM users WHERE id = ? AND is_active = true',
      [req.user.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        error: 'Failed to fetch updated profile'
      });
    }

    const updatedUser = userRows[0];
    const roleInfo = ROLE_HIERARCHY[updatedUser.role] || ROLE_HIERARCHY['resident'];

    const profileData = {
      id: updatedUser.id,
      username: updatedUser.username,
      full_name: updatedUser.full_name || updatedUser.fullName, // Handle different field names
      email: updatedUser.email,
      contact_number: updatedUser.contact_number,
      role: updatedUser.role,
      role_name: roleInfo.display_name,
      hierarchy_level: roleInfo.level,
      permissions: roleInfo.permissions,
      last_login: updatedUser.last_login
    };

    console.log('🔄 [Profile Update] Profile update successful:', profileData);
    res.json({
      message: 'Profile updated successfully',
      user: profileData
    });

  } catch (error) {
    console.error('❌ [Profile Update Error]:', error);
    console.error('❌ [Profile Update Error Stack]:', error.stack);

    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        error: 'Email address already in use by another account'
      });
    } else {
      res.status(500).json({
        error: 'Internal server error during profile update'
      });
    }
  }
}

// Get subordinates (users under current user in hierarchy)
async function getSubordinates(req, res) {
  try {
    // Get all users where current user is in their hierarchy chain
    const subordinates = await knex('users')
      .select(
        'users.id',
        'users.username',
        'users.full_name',
        'users.email',
        'users.role',
        'roles.role_name',
        'roles.hierarchy_level',
        'users.parent_user_id',
        'users.created_at'
      )
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where('users.is_active', true)
      .where(function() {
        this.where('users.parent_user_id', req.user.id)
            .orWhere('users.id', 'in',
              knex('users')
                .select('id')
                .where('parent_user_id', req.user.id)
            );
      })
      .orderBy('roles.hierarchy_level', 'desc')
      .orderBy('users.created_at', 'desc');

    res.json({
      subordinates,
      count: subordinates.length
    });

  } catch (error) {
    console.error('Get subordinates error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}

/**
 * Resident Signup (Public - No Authentication Required)
 * Allows residents to request account creation with proof of residency
 */
async function residentSignup(req, res) {
  const trx = await knex.transaction();

  try {
    const {
      resident_id,
      username,
      password,
      full_name,
      email,
      mobile_number,
      proof_type,
      notes
    } = req.body;

    // Validate required fields
    if (!resident_id || !username || !password || !full_name || !proof_type) {
      return res.status(400).json({
        error: 'Resident ID, username, password, full name, and proof type are required'
      });
    }

    // Validate username format
    if (username.length < 3) {
      return res.status(400).json({
        error: 'Username must be at least 3 characters long'
      });
    }

    // Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('Validation failed: weak password');
      return res.status(400).json({
        error: 'Password must meet complexity requirements',
        requirements: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumber: true,
          requireSpecialChar: true,
          allowedSpecialChars: '@$!%*?&'
        }
      });
    }

    // Check if resident exists in database
    const resident = await trx('residents')
      .where('Resident_ID', resident_id)
      .where('Residency_Status', 'Active')
      .first();

    if (!resident) {
      return res.status(404).json({
        error: 'Resident not found or not active. Please ensure you are registered as a resident of Barangay Batia.'
      });
    }

    // Check if resident already has an active account
    const existingUser = await trx('users')
      .where('username', username)
      .where('is_active', true)
      .first();

    if (existingUser) {
      return res.status(409).json({
        error: 'Username already exists'
      });
    }

    // Check if resident already has a pending or approved signup request
    const existingRequest = await trx('resident_signup_requests')
      .where('resident_id', resident_id)
      .whereIn('status', ['pending', 'approved'])
      .first();

    if (existingRequest) {
      if (existingRequest.status === 'approved') {
        return res.status(409).json({
          error: 'You already have an approved account. Please login instead.'
        });
      } else {
        return res.status(409).json({
          error: 'You already have a pending signup request. Please wait for approval.'
        });
      }
    }

    // Handle file upload
    if (!req.file) {
      return res.status(400).json({
        error: 'Proof of residency document is required (electric bill, water bill, cedula, etc.)'
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type. Please upload JPEG, PNG, GIF, or PDF files only.'
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: 'File size too large. Maximum size is 5MB.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate request ID
    const requestId = `RES-SIGNUP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create file path for proof document
    const fileExtension = req.file.originalname.split('.').pop();
    const proofFileName = `${requestId}.${fileExtension}`;
    const proofFilePath = `uploads/resident_signup/${proofFileName}`;

    // Move uploaded file to permanent location
    const fs = require('fs').promises;
    const path = require('path');

    // Ensure directory exists
    const uploadDir = path.dirname(proofFilePath);
    await fs.mkdir(uploadDir, { recursive: true });

    // Move file
    await fs.rename(req.file.path, proofFilePath);

    // Create signup request
    await trx('resident_signup_requests').insert({
      request_id: requestId,
      resident_id: resident_id,
      email: email,
      mobile_number: mobile_number,
      username: username,
      password_hash: passwordHash,
      full_name: full_name.trim(),
      proof_of_residency_path: proofFilePath,
      proof_type: proof_type,
      notes: notes?.trim(),
      status: 'pending',
      submitted_at: trx.fn.now()
    });

    await trx.commit();

    res.status(201).json({
      message: 'Resident signup request submitted successfully. Your account will be activated after verification of your proof of residency.',
      request_id: requestId,
      estimated_approval_time: '2-3 business days',
      next_steps: [
        'Wait for barangay officer review',
        'You will receive an email/SMS notification once approved',
        'Login with your credentials after approval'
      ]
    });

  } catch (error) {
    await trx.rollback();
    console.error('Resident signup error:', error);
    res.status(500).json({
      error: 'Internal server error during signup'
    });
  }
}

/**
 * Get Pending Resident Signup Requests (Officer Only)
 */
async function getPendingResidentSignups(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;

    const requests = await knex('resident_signup_requests')
      .select(
        'resident_signup_requests.*',
        'residents.First_Name',
        'residents.Last_Name',
        'residents.Mobile_Number as resident_mobile',
        'households.Street_Address',
        'sitios.name as sitio_name'
      )
      .join('residents', 'resident_signup_requests.resident_id', 'residents.Resident_ID')
      .leftJoin('households', 'residents.Household_ID', 'households.Household_ID')
      .leftJoin('sitios', 'households.Sitio_ID', 'sitios.id')
      .where('resident_signup_requests.status', 'pending')
      .orderBy('resident_signup_requests.submitted_at', 'asc')
      .limit(limit)
      .offset((page - 1) * limit);

    const formattedRequests = requests.map(row => ({
      request_id: row.request_id,
      resident_id: row.resident_id,
      resident_name: `${row.First_Name} ${row.Last_Name}`,
      username: row.username,
      email: row.email,
      mobile_number: row.mobile_number || row.resident_mobile,
      full_name: row.full_name,
      address: `${row.Street_Address}, ${row.sitio_name}, Batia, Bocaue, Bulacan`,
      proof_type: row.proof_type,
      proof_path: row.proof_of_residency_path,
      notes: row.notes,
      submitted_at: row.submitted_at
    }));

    res.json({
      success: true,
      data: formattedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching pending resident signups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending resident signups'
    });
  }
}

/**
 * Approve/Reject Resident Signup Request (Officer Only)
 */
async function reviewResidentSignup(req, res) {
  const trx = await knex.transaction();

  try {
    const { request_id } = req.params;
    const { action, review_notes } = req.body; // action: 'approve' or 'reject'
    const reviewed_by = req.user?.id || req.body.reviewed_by;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject".'
      });
    }

    // Get the signup request
    const signupRequest = await trx('resident_signup_requests')
      .where('request_id', request_id)
      .where('status', 'pending')
      .first();

    if (!signupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Signup request not found or already processed.'
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update signup request
    await trx('resident_signup_requests')
      .where('request_id', request_id)
      .update({
        status: newStatus,
        reviewed_at: trx.fn.now(),
        reviewed_by: reviewed_by,
        review_notes: review_notes,
        approved_at: action === 'approve' ? trx.fn.now() : null
      });

    if (action === 'approve') {
      // Create user account
      const [userId] = await trx('users').insert({
        username: signupRequest.username,
        password_hash: signupRequest.password_hash,
        full_name: signupRequest.full_name,
        email: signupRequest.email,
        role: 'resident',
        is_active: true
      });

      // Update signup request with created user ID
      await trx('resident_signup_requests')
        .where('request_id', request_id)
        .update({
          created_user_id: userId
        });

      // Log the approval
      await trx('audit_log').insert({
        user_id: reviewed_by,
        action: 'RESIDENT_SIGNUP_APPROVED',
        entity_type: 'resident_signup_request',
        entity_id: request_id,
        details: JSON.stringify({
          resident_id: signupRequest.resident_id,
          username: signupRequest.username,
          created_user_id: userId
        }),
        created_at: trx.fn.now()
      });

      await trx.commit();

      res.json({
        success: true,
        message: 'Resident signup approved successfully. User account created.',
        data: {
          request_id: request_id,
          username: signupRequest.username,
          user_id: userId,
          status: 'approved'
        }
      });

    } else {
      // For rejection, just update status
      await trx.commit();

      res.json({
        success: true,
        message: 'Resident signup rejected.',
        data: {
          request_id: request_id,
          status: 'rejected'
        }
      });
    }

  } catch (error) {
    await trx.rollback();
    console.error('Error reviewing resident signup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process resident signup review'
    });
  }
}

/**
 * Get Resident Signup Statistics (Officer Dashboard)
 */
async function getResidentSignupStats(req, res) {
  try {
    const [stats] = await knex('resident_signup_requests')
      .select(
        knex.raw('COUNT(CASE WHEN status = "pending" THEN 1 END) as pending'),
        knex.raw('COUNT(CASE WHEN status = "approved" THEN 1 END) as approved'),
        knex.raw('COUNT(CASE WHEN status = "rejected" THEN 1 END) as rejected'),
        knex.raw('COUNT(*) as total')
      );

    // Get recent signups
    const recentSignups = await knex('resident_signup_requests')
      .select('request_id', 'full_name', 'submitted_at', 'status')
      .orderBy('submitted_at', 'desc')
      .limit(5);

    res.json({
      success: true,
      stats: stats[0],
      recent_signups: recentSignups
    });

  } catch (error) {
    console.error('Error fetching resident signup stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch signup statistics'
    });
  }
}

/**
 * Instant Resident Signup (Firebase Integration)
 * Creates account immediately, verification handled by Firebase
 */
async function instantResidentSignup(req, res) {
  console.log('Starting instant resident signup...');

  try {
    const {
      username,
      password,
      full_name,
      email,
      mobile_number,
      notes
    } = req.body;

    console.log('Received data:', { username, email, full_name });

    // Validate required fields
    if (!username || !password || !full_name) {
      console.log('Validation failed: missing required fields');
      return res.status(400).json({
        error: 'Username, password, and full name are required'
      });
    }

    // Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('Validation failed: weak password');
      return res.status(400).json({
        error: 'Password must meet complexity requirements',
        requirements: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumber: true,
          requireSpecialChar: true,
          allowedSpecialChars: '@$!%*?&'
        }
      });
    }

    console.log('Validation passed, proceeding with database operations...');

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    console.log('Password hashed successfully');

    // Create user account with minimal fields using mysql2
    const userData = [
      username,
      passwordHash,
      full_name.trim(),
      email || null,
      mobile_number || null,
      'resident',
      false,
      new Date()
    ];

    console.log('Inserting user data:', userData);

    const [result] = await db.execute(
      'INSERT INTO users (username, password_hash, full_name, email, contact_number, role, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      userData
    );

    const userId = result.insertId;
    console.log('User created successfully with ID:', userId);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your contact information.',
      data: {
        user_id: userId,
        username: username,
        requires_verification: true
      }
    });

  } catch (error) {
    console.error('Instant resident signup error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);

    // Try to provide more specific error information
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        error: 'Username already exists'
      });
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      res.status(500).json({
        error: 'Database table not found'
      });
    } else {
      res.status(500).json({
        error: 'Internal server error during signup',
        details: error.message
      });
    }
  }
}

/**
 * Instant Hybrid Signup
 * Creates Firebase account AND database record immediately
 * Bypasses email verification but tracks residency status
 */
async function completeSignup(req, res) {
  console.log('================================================');
  console.log('🚀 STARTING HYBRID SIGNUP PROCESS');
  console.log('================================================');

  try {
    // This endpoint should be called with Firebase ID token (middleware sets req.firebaseUser)
    const { signupData } = req.body; // Removed verificationMethod requirement
    const firebaseUser = req.firebaseUser; // Set by Firebase middleware

    console.log('📋 Request data:');
    console.log('  - Firebase user UID:', firebaseUser?.uid);
    console.log('  - Firebase user email:', firebaseUser?.email);
    console.log('  - Signup data:', JSON.stringify(signupData, null, 2));

    // Validate required data
    if (!firebaseUser || !signupData) {
      console.log('❌ Missing Firebase user or signup data');
      return res.status(400).json({
        success: false,
        error: 'Invalid signup data',
        received: { hasFirebaseUser: !!firebaseUser, hasSignupData: !!signupData }
      });
    }

    if (!firebaseUser.uid) {
      console.log('❌ Invalid Firebase user data - no UID');
      return res.status(400).json({
        success: false,
        error: 'Invalid Firebase user data - missing UID',
        firebaseUserFields: Object.keys(firebaseUser || {})
      });
    }

    // Validate required signup data fields (simplified - email verification not required)
    const requiredFields = ['username', 'full_name'];
    const missingFields = requiredFields.filter(field => !signupData[field] || signupData[field].toString().trim() === '');

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        error: 'Required field(s) missing',
        missingFields: missingFields
      });
    }

    // Check if user already exists in database (avoid duplicates)
    console.log('🔍 Checking for existing user with Firebase UID:', firebaseUser.uid);
    const [existingUserRows] = await db.execute(
      'SELECT id, username, full_name, email, is_active, residency_status FROM users WHERE firebase_uid = ?',
      [firebaseUser.uid]
    );

    if (existingUserRows.length > 0) {
      console.log('⚠️ User already exists in database:', existingUserRows[0]);

      // If user exists but hasn't completed residency verification, allow re-entry
      const existingUser = existingUserRows[0];
      if (existingUser.residency_status === 'pending') {
        console.log('📝 User exists but residency not verified - allowing re-entry');
      } else {
        return res.status(409).json({
          success: false,
          error: 'Account already exists',
          residency_status: existingUser.residency_status
        });
      }
    }

    // Check for username conflicts (only if this is a new account)
    if (existingUserRows.length === 0) {
      console.log('🔍 Checking for username conflicts:', signupData.username);
      const [usernameCheckRows] = await db.execute(
        'SELECT id, username FROM users WHERE username = ? AND is_active = true',
        [signupData.username]
      );

      if (usernameCheckRows.length > 0) {
        console.log('⚠️ Username already taken:', signupData.username);
        return res.status(409).json({
          success: false,
          error: 'Username already taken'
        });
      }
    }

    let userId;

    // If user doesn't exist, create new account
    if (existingUserRows.length === 0) {
      console.log('📝 Creating new database user record...');

      // Generate resident ID
      const timestamp = Date.now();
      const residentId = `RES-${timestamp}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Insert user record with residency verification status
      const userInsertQuery = `
        INSERT INTO users (
          username, password_hash, full_name, email, contact_number, role, is_active,
          firebase_uid, resident_id, email_verified, phone_verified, verified_at,
          residency_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const userValues = [
        signupData.username,
        null, // password_hash (not used with Firebase)
        signupData.full_name.trim(),
        firebaseUser.email || signupData.email,
        signupData.mobile_number || null,
        'resident',
        true, // is_active
        firebaseUser.uid,
        residentId,
        1, // email_verified (Firebase handles this)
        0, // phone_verified (false for now)
        new Date(), // verified_at
        'pending', // residency_status - requires further verification
        new Date(), // created_at
        new Date()  // updated_at
      ];

      console.log('📋 User insert values:', userValues);

      const [userResult] = await db.execute(userInsertQuery, userValues);
      userId = userResult.insertId;

      console.log('✅ User created successfully with ID:', userId);

      // Create basic resident record (will be updated during residency verification)
      try {
        console.log('🏠 Creating basic resident record...');
        const residentInsertQuery = `
          INSERT INTO residents (
            Resident_ID, First_Name, Last_Name, Mobile_Number, Residency_Status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const nameParts = signupData.full_name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        const residentValues = [
          residentId,
          firstName,
          lastName,
          signupData.mobile_number || null,
          'Active', // Default status - will be verified later
          new Date()
        ];

        console.log('📋 Basic resident insert values:', residentValues);

        await db.execute(residentInsertQuery, residentValues);
        console.log('✅ Basic resident record created successfully');
      } catch (residentError) {
        console.log('⚠️ Failed to create resident record, continuing anyway:', residentError.message);
      }

      // Create initial residency verification request record
      try {
        const verificationRequestId = `VER-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        await db.execute(`
          INSERT INTO resident_verification_requests (
            request_id, user_id, status, created_at, updated_at
          ) VALUES (?, ?, 'draft', ?, ?)
        `, [verificationRequestId, userId, new Date(), new Date()]);

        console.log('✅ Residency verification request record created');
      } catch (verificationError) {
        console.log('⚠️ Failed to create verification request record:', verificationError.message);
      }

    } else {
      // User already exists, get their ID
      userId = existingUserRows[0].id;
      console.log('📝 Using existing user account:', userId);
    }

    // Get complete user data for response
    console.log('📋 Fetching complete user data for response');
    const [userRows] = await db.execute(
      'SELECT id, username, full_name, email, contact_number, role, firebase_uid, resident_id, residency_status FROM users WHERE id = ?',
      [userId]
    );

    const completeUser = userRows[0];
    const roleInfo = ROLE_HIERARCHY[completeUser.role] || ROLE_HIERARCHY['resident'];

    console.log('🎫 Generating JWT token for immediate login...');

    // Generate JWT token for immediate login
    const token = generateToken({
      ...completeUser,
      role_name: roleInfo.display_name,
      hierarchy_level: roleInfo.level,
      permissions: roleInfo.permissions
    });

    console.log('============================================');
    console.log('🎉 HYBRID SIGNUP COMPLETED SUCCESSFULLY');
    console.log('============================================');

    // Determine next steps based on residency verification status
    const nextSteps = completeUser.residency_status === 'pending'
      ? ['Complete residency verification to access all features']
      : ['Welcome! Your account is fully verified'];

    res.json({
      success: true,
      message: 'Account created successfully! You are now logged in.',
      token,
      user: {
        id: completeUser.id,
        username: completeUser.username,
        full_name: completeUser.full_name,
        email: completeUser.email,
        resident_id: completeUser.resident_id,
        firebase_uid: completeUser.firebase_uid,
        role: completeUser.role,
        role_name: roleInfo.display_name,
        hierarchy_level: roleInfo.level,
        permissions: roleInfo.permissions,
        residency_status: completeUser.residency_status
      },
      next_steps: nextSteps,
      requires_residency_verification: completeUser.residency_status === 'pending'
    });

  } catch (error) {
    console.error('============================================');
    console.error('❌ HYBRID SIGNUP ERROR');
    console.error('============================================');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('Stack trace:', error.stack);

    // Determine appropriate error response based on error type
    let statusCode = 500;
    let errorMessage = 'Internal server error during signup';

    if (error.code === 'ER_DUP_ENTRY') {
      statusCode = 409;
      errorMessage = 'Username or account already exists';
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
      statusCode = 400;
      errorMessage = 'Required field is missing';
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      statusCode = 400;
      errorMessage = 'Input data is too long for database field';
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      statusCode = 500;
      errorMessage = 'Database not properly set up. Please run migrations.';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? `${error.message} (${error.code})` : undefined
    });
  }
}

// ==========================================
// HYBRID AUTHENTICATION - STAFF USERS
// ==========================================

// Staff role hierarchy for MySQL authentication
const STAFF_ROLE_HIERARCHY = {
  'admin': { level: 4, display_name: 'Super Admin', permissions: ['all'] },
  'captain': { level: 3, display_name: 'Barangay Captain', permissions: ['manage_residents', 'manage_certificates', 'manage_blotter'] },
  'secretary': { level: 2, display_name: 'Barangay Secretary', permissions: ['manage_documents', 'read_residents'] },
  'clerk': { level: 1, display_name: 'Barangay Clerk', permissions: ['read_residents', 'manage_certificates'] }
};

/**
 * Helper function to determine if a user is staff based on username
 */
function isStaffUser(identifier) {
  if (!identifier) return false;

  // Remove email domain if present
  const username = identifier.split('@')[0];

  // Check if it's a predefined staff account
  const staffUsernames = ['superadmin', 'captain01', 'secretary01', 'clerk01'];

  if (staffUsernames.includes(username)) {
    return true;
  }

  // You can add more sophisticated logic here, e.g.:
  // - Check email domains
  // - Check dedicated staff email patterns
  // - Database lookup for staff designation

  return false;
}

/**
 * Staff Login - MySQL Authentication
 * Handles authentication for staff users using the main users table
 */
async function staffLogin(req, res) {
  try {
    const { username, password } = req.body;

    console.log('🔐 Staff login attempt for:', username);

    // Get client IP for logging
    const clientIP = req.ip || req.connection.remoteAddress ||
                     (req.socket ? req.socket.remoteAddress : null) ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     null;

    // Validate input
    if (!username || !password) {
      console.log('❌ Staff login failed: missing credentials');

      // Log failed attempt
      try {
        await knex('login_attempts').insert({
          username: username || '',
          ip_address: clientIP,
          success: false,
          reason: 'Missing credentials'
        }).catch(err => console.error('Failed to log login attempt:', err));
      } catch (logError) {
        console.error('Failed to log staff login attempt:', logError);
      }

      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Find staff user in users table (using Knex for consistency with existing code)
    const user = await knex('users')
      .where('username', username)
      .where('is_active', true)
      .first();

    if (!user) {
      console.log('❌ Staff login failed: user not found');

      // Log failed attempt
      await knex('login_attempts').insert({
        username: username || '',
        ip_address: clientIP,
        success: false,
        reason: 'Missing credentials'
      }).catch(err => console.error('Failed to log login attempt:', err));

      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Verify if this is actually a staff user (based on role)
    const staffRoles = ['admin', 'captain', 'secretary', 'clerk'];
    if (!staffRoles.includes(user.role)) {
      console.log('❌ Staff login failed: not a staff account');
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Check password (support both bcrypt and plain text for migration compatibility)
    let isValidPassword = false;

    try {
      // Try bcrypt first (for properly hashed passwords)
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } catch (bcryptError) {
      // Fallback: check plain text (for existing admin123 users)
      isValidPassword = (user.password_hash === password);
    }

    if (!isValidPassword) {
      console.log('❌ Staff login failed: invalid password');

      // Log failed attempt
      await knex('login_attempts').insert({
        username: username,
        ip_address: clientIP,
        success: false,
        reason: 'Invalid password'
      }).catch(err => console.error('Failed to log login attempt:', err));

      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await knex('users')
      .where('id', user.id)
      .update({ last_login: knex.fn.now() });

    // Get role information from staff hierarchy
    const staffRoleInfo = STAFF_ROLE_HIERARCHY[user.role];

    if (!staffRoleInfo) {
      console.log('❌ Staff login failed: invalid role');
      return res.status(401).json({
        error: 'Account configuration error'
      });
    }

    // Create user object for JWT token
    const userWithHierarchy = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      role_name: staffRoleInfo.display_name,
      hierarchy_level: staffRoleInfo.level,
      permissions: staffRoleInfo.permissions,
      auth_type: 'mysql_staff' // Identify as staff authentication
    };

    // Generate JWT token
    const token = generateToken(userWithHierarchy);

    console.log('✅ Staff login successful for:', username);

    // Log successful login attempt
    await knex('login_attempts').insert({
      username: username,
      ip_address: clientIP,
      success: true,
      reason: 'Staff login successful'
    }).catch(err => console.error('Failed to log successful login:', err));

    // Return user info (excluding sensitive data)
    const userResponse = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      role_name: staffRoleInfo.display_name,
      hierarchy_level: staffRoleInfo.level,
      permissions: staffRoleInfo.permissions,
      auth_type: 'mysql_staff'
    };

    res.json({
      message: 'Staff login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({
      error: 'Internal server error during staff authentication'
    });
  }
}

/**
 * Resident Login - Firebase Authentication
 * Handles authentication for residents using Firebase
 */
async function residentLogin(req, res) {
  try {
    const { username, password, bypass_firebase } = req.body;

    console.log('🔐 Resident login attempt for:', username);

    // Get client IP for logging
    const clientIP = req.ip || req.connection.remoteAddress ||
                     (req.socket ? req.socket.remoteAddress : null) ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     null;

    // Validate input - Firebase uses email for authentication
    let email = username;
    if (!email.includes('@')) {
      // If username doesn't contain @, assume it's a local username and convert to email
      email = `${username}@barangay.local`;
    }

    if (!password) {
      console.log('❌ Resident login failed: missing password');
      // Log failed login attempt - missing password
      await db.execute(
        'INSERT INTO login_attempts (username, ip_address, success, reason) VALUES (?, ?, false, "Missing password")',
        [username, clientIP]
      ).catch(err => console.error('Failed to log login attempt:', err));

      return res.status(400).json({
        error: 'Password is required'
      });
    }

    // If bypass_firebase flag is set, skip Firebase and go directly to database auth
    if (bypass_firebase) {
      console.log('🔧 Debug mode: Bypassing Firebase authentication');
      return loginDatabaseFallback(req, res, username, password);
    }

    try {
      // Attempt Firebase sign in
      const userCredential = await admin.auth().getUserByEmail(email);

      if (!userCredential) {
        console.log('❌ Resident login failed: Firebase user not found');
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Get custom claims (role and hierarchy)
      const customClaims = userCredential.customClaims || {};

      // Get role information from hierarchy mapping
      const role = customClaims.role || 'resident';
      const roleInfo = ROLE_HIERARCHY[role] || ROLE_HIERARCHY['resident'];

      // Check if user exists in database, create if not
      let dbUser = await knex('users')
        .where('email', email)
        .first();

      if (!dbUser) {
        // Create user in database if they don't exist
        const [userId] = await knex('users').insert({
          username: username,
          email: email,
          full_name: userCredential.displayName || username,
          firebase_uid: userCredential.uid,
          role: role,
          is_active: true,
          created_at: knex.fn.now()
        });

        dbUser = await knex('users')
          .where('id', userId)
          .first();
      }

      // Update last login
      await knex('users')
        .where('id', dbUser.id)
        .update({ last_login: knex.fn.now() });

      // Create user object with hierarchy information
      const userWithHierarchy = {
        id: dbUser.id,
        username: dbUser.username,
        full_name: dbUser.full_name,
        email: dbUser.email,
        role: role,
        firebase_uid: userCredential.uid,
        role_name: roleInfo.display_name,
        hierarchy_level: roleInfo.level,
        permissions: roleInfo.permissions,
        auth_type: 'firebase_resident'
      };

      // Generate JWT token
      const token = generateToken(userWithHierarchy);

      console.log('✅ Resident login successful for:', username);

      // Return user info (excluding sensitive data)
      const userResponse = {
        id: dbUser.id,
        username: dbUser.username,
        full_name: dbUser.full_name,
        email: dbUser.email,
        role: role,
        role_name: roleInfo.display_name,
        hierarchy_level: roleInfo.level,
        permissions: roleInfo.permissions,
        firebase_uid: userCredential.uid,
        auth_type: 'firebase_resident'
      };

      res.json({
        message: 'Resident login successful',
        token,
        user: userResponse
      });

    } catch (firebaseError) {
      console.error('Firebase auth error:', firebaseError);

      // Fallback to database authentication if Firebase fails
      console.log('Firebase auth failed, trying database fallback...');

      try {
        // Instead of calling loginDatabaseFallback directly, do the database auth logic inline
        // to avoid double response issues

        const user = await knex('users')
          .where('username', username)
          .where('is_active', true)
          .first();

        if (!user) {
          console.log('❌ Database fallback: user not found');
          return res.status(401).json({
            error: 'Invalid credentials - user not found'
          });
        }

        // Check if this user has email_verified = 1 (meaning they've completed verification)
        // This ensures only users who went through Firebase verification can login via database
        if (!user.email_verified) {
          console.log('❌ Database fallback: user not email verified');
          return res.status(401).json({
            error: 'Account not verified. Please complete the signup process.'
          });
        }

        // Verify password (note: existing data may have plain passwords, checking both ways)
        let isValidPassword = false;

        try {
          // Try bcrypt first (for properly hashed passwords)
          isValidPassword = await bcrypt.compare(password, user.password_hash);
        } catch (bcryptError) {
          // Fallback: check if password matches plain text (for backward compatibility)
          isValidPassword = (user.password_hash === password);
        }

        if (!isValidPassword) {
          console.log('❌ Database fallback: invalid password');
          return res.status(401).json({
            error: 'Invalid credentials - wrong password'
          });
        }

        // Update last login
        await knex('users')
          .where('id', user.id)
          .update({ last_login: knex.fn.now() });

        // Create user object with hierarchy information
        const roleInfo = ROLE_HIERARCHY[user.role] || ROLE_HIERARCHY['resident'];
        const userWithHierarchy = {
          ...user,
          role_name: roleInfo.display_name,
          hierarchy_level: roleInfo.level,
          permissions: roleInfo.permissions
        };

        // Generate token
        const token = generateToken(userWithHierarchy);

        // Return user info (excluding sensitive data)
        const userResponse = {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          resident_id: user.resident_id,
          role: user.role,
          role_name: roleInfo.display_name,
          hierarchy_level: roleInfo.level,
          permissions: roleInfo.permissions,
          auth_type: 'database_fallback'
        };

        console.log('✅ Database fallback login successful for:', username);

        return res.json({
          message: 'Login successful (database fallback)',
          token,
          user: userResponse
        });

      } catch (dbError) {
        console.error('Database fallback failed:', dbError);
        return res.status(500).json({
          error: 'Authentication service temporarily unavailable'
        });
      }
    }

  } catch (error) {
    console.error('Resident login error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}

/**
 * Simplified Login - Direct MySQL authentication for staff (temporary fix)
 * This bypasses the complex Firebase routing and uses direct database auth
 */
async function hybridLogin(req, res) {
  try {
    const { username } = req.body;

    console.log('🔐 Login attempt for:', username);

    // For staff users, always use MySQL authentication
    const staffUsernames = ['superadmin', 'captain', 'secretary', 'clerk'];
    if (staffUsernames.includes(username)) {
      console.log('👔 Detected staff user, using MySQL auth');
      return staffLogin(req, res);
    }

    // For now, use Firebase auth for non-staff users (can be expanded later)
    console.log('🏠 Detected resident user, using Firebase auth');
    return residentLogin(req, res);

  } catch (error) {
    console.error('Login error:', error);
    return residentLogin(req, res); // Default fallback
  }
}

/**
 * Submit Residency Verification Request (for existing Firebase users)
 * Allows users to submit proof of residency after initial signup
 */
async function submitResidencyVerification(req, res) {
  const trx = await knex.transaction();

  try {
    const userId = req.user.id;
    const {
      proof_type,
      notes
    } = req.body;

    // Validate required fields
    if (!proof_type) {
      return res.status(400).json({
        success: false,
        error: 'Proof type is required'
      });
    }

    // Check if user exists and has pending verification status
    const user = await trx('users')
      .where('id', userId)
      .where('is_active', true)
      .first();

    if (!user) {
      await trx.rollback();
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.residency_status === 'verified') {
      await trx.rollback();
      return res.status(409).json({
        success: false,
        error: 'Your residency is already verified'
      });
    }

    // Handle file upload
    if (!req.file) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        error: 'Proof of residency document is required'
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Please upload JPEG, PNG, GIF, or PDF files only.'
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB.'
      });
    }

    // Generate request ID
    const requestId = `VER-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create file path for proof document
    const fileExtension = req.file.originalname.split('.').pop();
    const proofFileName = `${requestId}.${fileExtension}`;
    const proofFilePath = `uploads/residency_verification/${proofFileName}`;

    // Ensure directory exists and move file
    const fs = require('fs').promises;
    const path = require('path');
    const uploadDir = path.dirname(proofFilePath);

    try {
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.rename(req.file.path, proofFilePath);
    } catch (fileError) {
      console.error('File operation error:', fileError);
      await trx.rollback();
      return res.status(500).json({
        success: false,
        error: 'Failed to save uploaded file'
      });
    }

    // Check if user already has a pending verification request
    const existingRequest = await trx('resident_verification_requests')
      .where('user_id', userId)
      .where('status', 'pending')
      .first();

    if (existingRequest) {
      await trx.rollback();
      return res.status(409).json({
        success: false,
        error: 'You already have a pending verification request. Please wait for review.'
      });
    }

    // Create verification request
    await trx('resident_verification_requests').insert({
      request_id: requestId,
      user_id: userId,
      proof_of_residency_path: proofFilePath,
      proof_type: proof_type,
      status: 'pending',
      notes: notes?.trim(),
      submitted_at: trx.fn.now(),
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    await trx.commit();

    res.status(201).json({
      success: true,
      message: 'Residency verification request submitted successfully.',
      request_id: requestId,
      next_steps: [
        'Your request will be reviewed by barangay officers',
        'You will receive a notification once approved',
        'Processing typically takes 2-3 business days'
      ]
    });

  } catch (error) {
    await trx.rollback();
    console.error('Submit residency verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during verification submission'
    });
  }
}

/**
 * Get User's Residency Verification Status
 */
async function getResidencyVerificationStatus(req, res) {
  try {
    const userId = req.user.id;

    // Get user residency status
    const user = await knex('users')
      .select('residency_status', 'residency_verified_at', 'residency_verified_by')
      .where('id', userId)
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get latest verification request
    const latestRequest = await knex('resident_verification_requests')
      .select('request_id', 'status', 'submitted_at', 'reviewed_at', 'review_notes', 'proof_type')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .first();

    const response = {
      success: true,
      residency_status: user.residency_status,
      residency_verified_at: user.residency_verified_at,
      requires_verification: user.residency_status === 'pending'
    };

    if (latestRequest) {
      response.verification_request = {
        request_id: latestRequest.request_id,
        status: latestRequest.status,
        submitted_at: latestRequest.submitted_at,
        reviewed_at: latestRequest.reviewed_at,
        review_notes: latestRequest.review_notes,
        proof_type: latestRequest.proof_type
      };
    }

    res.json(response);

  } catch (error) {
    console.error('Get residency verification status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve verification status'
    });
  }
}

/**
 * Get Pending Residency Verification Requests (Officer Only)
 */
async function getPendingResidencyVerifications(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;

    const requests = await knex('resident_verification_requests')
      .select(
        'resident_verification_requests.*',
        'users.username',
        'users.full_name',
        'users.email'
      )
      .join('users', 'resident_verification_requests.user_id', 'users.id')
      .where('resident_verification_requests.status', 'pending')
      .orderBy('resident_verification_requests.submitted_at', 'asc')
      .limit(limit)
      .offset((page - 1) * limit);

    const formattedRequests = requests.map(row => ({
      request_id: row.request_id,
      user_id: row.user_id,
      username: row.username,
      full_name: row.full_name,
      email: row.email,
      proof_type: row.proof_type,
      proof_path: row.proof_of_residency_path,
      notes: row.notes,
      submitted_at: row.submitted_at
    }));

    res.json({
      success: true,
      data: formattedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching pending residency verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending verifications'
    });
  }
}

/**
 * Review Residency Verification Request (Officer Only)
 */
async function reviewResidencyVerification(req, res) {
  const trx = await knex.transaction();

  try {
    const { request_id } = req.params;
    const { action, review_notes } = req.body; // action: 'approve' or 'reject'
    const reviewed_by = req.user?.id;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject".'
      });
    }

    // Get the verification request
    const verificationRequest = await trx('resident_verification_requests')
      .where('request_id', request_id)
      .where('status', 'pending')
      .first();

    if (!verificationRequest) {
      await trx.rollback();
      return res.status(404).json({
        success: false,
        message: 'Verification request not found or already processed.'
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update verification request
    await trx('resident_verification_requests')
      .where('request_id', request_id)
      .update({
        status: newStatus,
        reviewed_at: trx.fn.now(),
        reviewed_by: reviewed_by,
        review_notes: review_notes,
        updated_at: trx.fn.now()
      });

    if (action === 'approve') {
      // Update user residency status
      await trx('users')
        .where('id', verificationRequest.user_id)
        .update({
          residency_status: 'verified',
          residency_verified_at: trx.fn.now(),
          residency_verified_by: reviewed_by,
          updated_at: trx.fn.now()
        });

      // Log the approval
      try {
        await trx('audit_log').insert({
          user_id: reviewed_by,
          action: 'RESIDENCY_VERIFICATION_APPROVED',
          entity_type: 'resident_verification_request',
          entity_id: request_id,
          details: JSON.stringify({
            user_id: verificationRequest.user_id,
            request_id: request_id
          }),
          created_at: trx.fn.now()
        });
      } catch (logError) {
        console.log('⚠️ Failed to log approval:', logError.message);
      }

      await trx.commit();

      res.json({
        success: true,
        message: 'Residency verification approved successfully. User now has full access.',
        data: {
          request_id: request_id,
          user_id: verificationRequest.user_id,
          status: 'approved',
          residency_status: 'verified'
        }
      });

    } else {
      // For rejection, just update status
      await trx.commit();

      res.json({
        success: true,
        message: 'Residency verification rejected.',
        data: {
          request_id: request_id,
          status: 'rejected'
        }
      });
    }

  } catch (error) {
    await trx.rollback();
    console.error('Error reviewing residency verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process verification review'
    });
  }
}

/**
 * Verify Email for Residency Graduation
 * Sends/verifies email and promotes user from basic account to resident record
 */
async function verifyEmailForResidency(req, res) {
  try {
    console.log('🔐 [Email Verification] Starting email verification for residency promotion...');

    // User must be authenticated via Firebase middleware
    if (!req.firebaseUser) {
      console.log('❌ [Email Verification] No Firebase user found');
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const firebaseUser = req.firebaseUser;
    console.log('🔐 [Email Verification] Firebase user:', firebaseUser.email, 'UID:', firebaseUser.uid);

    // Get user from database using Firebase UID
    const [userRows] = await db.execute(
      'SELECT id, username, full_name, email, resident_id, role FROM users WHERE firebase_uid = ? AND is_active = true',
      [firebaseUser.uid]
    );

    if (userRows.length === 0) {
      console.log('❌ [Email Verification] User not found in database');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userRows[0];
    console.log('🔐 [Email Verification] Database user:', user.id, user.username);

    // Check if user already has a resident record
    const [residentRows] = await db.execute(
      'SELECT Resident_ID, First_Name, Last_Name FROM residents WHERE Resident_ID = ?',
      [user.resident_id || `${user.id}`]
    );

    if (residentRows.length > 0) {
      console.log('⚠️ [Email Verification] User already has resident record');
      return res.status(409).json({
        success: false,
        error: 'Already a registered resident',
        message: 'You are already a registered resident in the system.'
      });
    }

    // Check email verification status via Firebase Admin
    try {
      const userRecord = await admin.auth().getUser(firebaseUser.uid);
      const isEmailVerified = userRecord.emailVerified;

      console.log('🔐 [Email Verification] Email verified status:', isEmailVerified);

      if (!isEmailVerified) {
        // Send verification email
        console.log('📧 [Email Verification] Sending verification email...');

        const actionCodeSettings = {
          url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email`,
          handleCodeInApp: false
        };

        try {
          await admin.auth().generateEmailVerificationLink(firebaseUser.email, actionCodeSettings);
          console.log('✅ [Email Verification] Verification email sent');

          return res.json({
            success: true,
            action: 'email_sent',
            message: 'Verification email sent. Please check your email and click the verification link.',
            next_steps: [
              'Check your email inbox (and spam folder)',
              'Click the verification link',
              'Return here to complete residency registration'
            ]
          });
        } catch (emailError) {
          console.error('❌ [Email Verification] Failed to send email:', emailError);
          return res.status(500).json({
            success: false,
            error: 'Failed to send verification email',
            details: 'Please try again later'
          });
        }
      }

      // Email is verified - create resident record
      console.log('✅ [Email Verification] Email verified, creating resident record...');

      const trx = await knex.transaction();

      try {
        // Generate resident ID if not already set
        const residentId = user.resident_id || `RES-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Parse name into first/last
        const nameParts = (user.full_name || user.username).trim().split(' ');
        const firstName = nameParts[0] || user.username;
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create resident record
        await trx('residents').insert({
          Resident_ID: residentId,
          First_Name: firstName,
          Last_Name: lastName,
          Mobile_Number: null, // Can be updated later
          Resident_Status: 'Active',
          Email: user.email,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now()
        });
        console.log('✅ [Email Verification] Resident record created:', residentId);

        // Update user record with resident_id and email verification status
        await trx('users').where('id', user.id).update({
          resident_id: residentId,
          email_verified: 1,
          email_verified_at: trx.fn.now(),
          updated_at: trx.fn.now()
        });
        console.log('✅ [Email Verification] User record updated');

        // Log the promotion
        try {
          await trx('audit_log').insert({
            user_id: user.id,
            action: 'EMAIL_VERIFICATION_COMPLETED',
            entity_type: 'user',
            entity_id: user.id,
            details: JSON.stringify({
              promoted_to_resident: residentId,
              email_verified: true
            }),
            created_at: trx.fn.now()
          });
        } catch (logError) {
          console.log('⚠️ [Email Verification] Failed to log promotion:', logError.message);
        }

        await trx.commit();

        console.log('🎉 [Email Verification] User successfully promoted to resident');

        // Get updated user data for response
        const [updatedUserRows] = await db.execute(
          'SELECT id, username, full_name, email, resident_id FROM users WHERE id = ?',
          [user.id]
        );
        const updatedUser = updatedUserRows[0];

        res.json({
          success: true,
          action: 'promoted',
          message: 'Congratulations! You are now a registered resident.',
          user: updatedUser,
          next_steps: [
            'Submit residency verification to access all features',
            'Visit the dashboard to see your new resident privileges'
          ]
        });

      } catch (txError) {
        await trx.rollback();
        console.error('❌ [Email Verification] Transaction failed:', txError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create resident record',
          details: 'Database error occurred'
        });
      }

    } catch (firebaseError) {
      console.error('❌ [Email Verification] Firebase error:', firebaseError);
      return res.status(500).json({
        success: false,
        error: 'Firebase authentication service error'
      });
    }

  } catch (error) {
    console.error('❌ [Email Verification] Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

module.exports = {
  login: hybridLogin, // Updated login function uses gateway
  register,
  getProfile,
  updateProfile,
  getSubordinates,
  residentSignup,
  getPendingResidentSignups,
  reviewResidentSignup,
  getResidentSignupStats,
  instantResidentSignup,
  completeSignup,
  // Hybrid approach residency verification endpoints
  submitResidencyVerification,
  getResidencyVerificationStatus,
  getPendingResidencyVerifications,
  reviewResidencyVerification,
  // Email verification for residency graduation
  verifyEmailForResidency,
  // Expose individual auth methods for direct access if needed
  staffLogin,
  residentLogin,
  hybridLogin,
  // Export role hierarchies for use elsewhere
  ROLE_HIERARCHY,
  STAFF_ROLE_HIERARCHY
};
