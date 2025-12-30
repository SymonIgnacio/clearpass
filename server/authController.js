const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);

// Import the same database configuration function as server/index.js
function getDatabaseConfig() {
  // Prefer Railway's DATABASE_URL if available
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1), // Remove leading slash
      port: parseInt(url.port) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  }

  // Fallback to individual environment variables (legacy support)
  return {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQL_USERNAME || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'barangay_management',
    port: process.env.MYSQL_PORT || process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

const dbConfig = getDatabaseConfig();

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

// THEMIS CLEARPASS 6-tier Role-Based Access Control System
const THEMIS_ROLES = {
  1: { // IT Admin (System Guardian)
    level: 1,
    role_name: 'it_admin',
    permissions: [
      'tech_support', 'system_monitoring', 'user_provisioning',
      'bulk_import', 'system_config', 'security_mgmt'
    ],
    display_name: 'IT Admin',
    description: 'System Guardian - Tech/Infra only - System maintenance and user creation'
  },
  2: { // Clerk (The ClearPass Operator - Issuance)
    level: 2,
    role_name: 'clerk',
    permissions: [
      'issue_certificates', 'process_clearances', 'data_entry',
      'basic_support', 'create_records', 'clearpass_gate'
    ],
    display_name: 'Clerk',
    description: 'ClearPass Engine - Certificate issuance and processing with ClearPass validation'
  },
  3: { // Blotter Officer (The Encoder)
    level: 3,
    role_name: 'blotter_officer',
    permissions: [
      'manage_blotter', 'create_cases', 'update_cases', 'close_cases'
    ],
    display_name: 'Blotter Officer',
    description: 'The Encoder - Full CRUD for blotter cases (triggers ClearPass blocks)'
  },
  4: { // Resident (The End User)
    level: 4,
    role_name: 'resident',
    permissions: [
      'view_own_profile', 'request_clearance', 'update_profile',
      'view_certificates', 'submit_verification'
    ],
    display_name: 'Resident',
    description: 'End User - Login with ResidentID + PIN'
  },
  5: { // Captain (Executive Viewer)
    level: 5,
    role_name: 'captain',
    permissions: [
      'read_analytics', 'view_reports', 'supervise_operations'
    ],
    display_name: 'Captain',
    description: 'Executive Viewer - Read-Only Analytics - Leadership oversight'
  },
  6: { // Secretary (The Overseer)
    level: 6,
    role_name: 'secretary',
    permissions: [
      'manage_documents', 'approve_clearances', 'process_requests',
      'generate_reports', 'manage_events', 'supervise_clerks',
      'view_all_records', 'administrative_approval'
    ],
    display_name: 'Secretary',
    description: 'The Overseer - Document processing, approvals, and supervision'
  }
};

// Legacy ROLE_HIERARCHY for backward compatibility (maps strings to THEMIS roles)
const ROLE_HIERARCHY = {
  'admin': THEMIS_ROLES[1],
  'captain': THEMIS_ROLES[5],
  'secretary': THEMIS_ROLES[6],
  'clerk': THEMIS_ROLES[2],
  'resident': THEMIS_ROLES[4]
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

    // Get role information using THEMIS roles (supports both numeric and string roles)
    let roleInfo;
    let isStaffUser = false;

    // Handle both numeric THEMIS roles and legacy string roles
    if (typeof user.role === 'number') {
      // Numeric THEMIS role
      roleInfo = THEMIS_ROLES[user.role];
      isStaffUser = user.role >= 1 && user.role <= 6; // All THEMIS roles are staff-like
      console.log('🔍 [Profile Debug] THEMIS numeric role detected:', user.role, roleInfo);
    } else {
      // Legacy string role - map to THEMIS
      roleInfo = ROLE_HIERARCHY[user.role] || ROLE_HIERARCHY['resident'];
      isStaffUser = ['admin', 'captain', 'secretary', 'clerk'].includes(user.role);
      console.log('🔍 [Profile Debug] Legacy string role detected:', user.role, roleInfo);
    }

    // Ensure roleInfo exists
    if (!roleInfo) {
      roleInfo = THEMIS_ROLES[4]; // Default to resident
      console.log('🔍 [Profile Debug] Using default resident role');
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
        'users.parent_user_id',
        'users.created_at'
      )
      .where('users.is_active', true)
      .where(function() {
        this.where('users.parent_user_id', req.user.id)
            .orWhere('users.id', 'in',
              knex('users')
                .select('id')
                .where('parent_user_id', req.user.id)
            );
      })
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
 * THEMIS Resident Login: ResidentID + PIN Authentication
 * Residents login using their ResidentID and 6-digit PIN (THEMIS requirement)
 */
async function residentLogin(req, res) {
  try {
    const { resident_id, pin } = req.body;

    console.log('🔐 THEMIS Resident Login - ResidentID + PIN authentication');
    console.log('Resident ID:', resident_id);

    // Validate required fields
    if (!resident_id || !pin) {
      return res.status(400).json({
        error: 'Resident ID and PIN are required'
      });
    }

    // Validate PIN format (6 digits)
    if (!/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        error: 'PIN must be exactly 6 digits'
      });
    }

    // Find user by resident_id and validate PIN
    const user = await knex('users')
      .where('resident_id', resident_id)
      .where('role', 4) // THEMIS: Must be resident role (4 = Resident)
      .where('is_active', true)
      .first();

    if (!user) {
      return res.status(401).json({
        error: 'Invalid Resident ID or account not found'
      });
    }

    // Verify PIN
    if (!user.pin || user.pin !== pin) {
      return res.status(401).json({
        error: 'Invalid PIN'
      });
    }

    // Update last login
    await knex('users')
      .where('id', user.id)
      .update({ last_login: knex.fn.now() });

    // Get role information
    const roleInfo = ROLE_HIERARCHY['resident'];

    // Create user object for JWT token
    const userWithHierarchy = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      resident_id: user.resident_id,
      role: user.role,
      role_name: roleInfo.display_name,
      hierarchy_level: roleInfo.level,
      permissions: roleInfo.permissions,
      auth_type: 'themis_resident' // THEMIS compliance flag
    };

    // Generate JWT token
    const token = generateToken(userWithHierarchy);

    console.log('✅ THEMIS Resident Login successful for:', resident_id);

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
      auth_type: 'themis_resident'
    };

    res.json({
      message: 'THEMIS Resident login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ THEMIS Resident login error:', error);
    res.status(500).json({
      error: 'Internal server error during THEMIS authentication'
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
    console.log('🔐 Request body:', { username, hasPassword: !!password });

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
    let user;
    try {
      console.log('🔍 Staff login: querying users table for username:', username);
      user = await knex('users')
        .where('username', username)
        .where('is_active', true)
        .first();
      console.log('🔍 Staff login: query result:', { found: !!user, userId: user?.id, userRole: user?.role });
    } catch (dbError) {
      console.error('❌ Staff login database error:', dbError);
      return res.status(500).json({
        error: 'Database connection error',
        details: dbError.message
      });
    }

    if (!user) {
      console.log('❌ Staff login failed: user not found');

      // Log failed attempt
      try {
        await knex('login_attempts').insert({
          username: username || '',
          ip_address: clientIP,
          success: false,
          reason: 'User not found'
        }).catch(err => console.error('Failed to log login attempt:', err));
      } catch (logError) {
        console.error('Failed to create log entry:', logError);
      }

      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Verify if this is actually a staff user (based on THEMIS numeric roles)
    const staffRoleNumbers = [1, 2, 3, 5, 6]; // IT Admin, Clerk, Blotter Officer, Captain, Secretary
    if (!staffRoleNumbers.includes(parseInt(user.role))) {
      console.log('❌ Staff login failed: not a staff account - role:', user.role);
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Check password (support both bcrypt and plain text for migration compatibility)
    let isValidPassword = false;

    console.log('🔐 Password check - user:', user.username, 'hash length:', user.password_hash?.length, 'password provided:', !!password);

    // Check if password_hash looks like a bcrypt hash (starts with $2b$ or $2a$)
    if (user.password_hash && (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$'))) {
      // Try bcrypt comparison for properly hashed passwords
      console.log('🔐 Using bcrypt comparison for hashed password');
      try {
        isValidPassword = await bcrypt.compare(password, user.password_hash);
        console.log('🔐 Bcrypt comparison result:', isValidPassword);
      } catch (bcryptError) {
        console.log('❌ Bcrypt comparison failed:', bcryptError.message);
        isValidPassword = false;
      }
    } else {
      // Fallback: plain text comparison for backward compatibility
      console.log('🔓 Using plain text password comparison');
      isValidPassword = (user.password_hash === password);
      console.log('🔐 Plain text comparison result:', isValidPassword, 'hash:', user.password_hash, 'password:', password);
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

    // Get role information from THEMIS roles
    const staffRoleInfo = THEMIS_ROLES[user.role];

    if (!staffRoleInfo) {
      console.log('❌ Staff login failed: invalid role -', user.role);
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
      console.error('❌ Staff login error:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      res.status(500).json({
        error: 'Internal server error during staff authentication',
        details: error.message
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
 * Simplified Login - Direct MySQL authentication for all users
 * This provides consistent authentication using database credentials
 */
async function hybridLogin(req, res) {
  try {
    const { username } = req.body;

    console.log('🔐 Login attempt for:', username);

    // Determine user type and route to appropriate auth method
    const staffUsernames = ['superadmin', 'captain', 'secretary', 'clerk'];

    if (staffUsernames.includes(username)) {
      console.log('👔 Detected staff user, using staff auth');
      return staffLogin(req, res);
    } else {
      console.log('🏠 Detected resident user, checking email or Resident ID authentication');

      const { password } = req.body; // Use password instead of pin for email login
      if (!username || !password) {
        return res.status(400).json({
          error: 'Username and password are required'
        });
      }

      let user;

      // First, try to find user by email (for email-based login)
      console.log('🔍 Checking if username is an email...');
      user = await knex('users')
        .where('email', username)
        .where('role', 'resident')
        .where('is_active', true)
        .first();

      // If not found by email, try to find by Resident_ID
      if (!user) {
        console.log('🔍 Email not found, checking if username is a Resident ID...');
        // Look for resident with this Resident_ID, then get their user account
        const resident = await knex('residents')
          .where('Resident_ID', username)
          .first();

        if (resident) {
          // Found resident, now get their user account
          user = await knex('users')
            .where('email', resident.Email) // Link by email
            .where('role', 'resident')
            .where('is_active', true)
            .first();
        }
      }

      if (!user) {
        console.log('❌ No user found with this email or Resident ID');
        return res.status(401).json({
          error: 'Invalid email, Resident ID, or account not found'
        });
      }

      // Verify password (bcrypt hashed)
      console.log('🔐 Verifying password for user:', user.username);
      let isValidPassword = false;

      try {
        // Try bcrypt comparison for properly hashed passwords
        isValidPassword = await bcrypt.compare(password, user.password_hash);
        console.log('🔐 Bcrypt comparison result:', isValidPassword);
      } catch (bcryptError) {
        console.log('❌ Bcrypt comparison failed:', bcryptError.message);
        isValidPassword = false;
      }

      if (!isValidPassword) {
        console.log('❌ Invalid password');
        return res.status(401).json({
          error: 'Invalid password'
        });
      }

      // Update last login
      await knex('users')
        .where('id', user.id)
        .update({ last_login: knex.fn.now() });

      // Get role information
      const roleInfo = ROLE_HIERARCHY[user.role] || ROLE_HIERARCHY['resident'];

      // Create user object with hierarchy information
      const userWithHierarchy = {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        role_name: roleInfo.display_name,
        hierarchy_level: roleInfo.level,
        permissions: roleInfo.permissions,
        resident_id: user.resident_id,
        residency_status: user.residency_status,
        firebase_uid: user.firebase_uid,
        auth_type: 'database'
      };

      // Generate JWT token
      const token = generateToken(userWithHierarchy);

      console.log('✅ Resident login successful for:', username);

      // Return user info
      const userResponse = {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        role_name: roleInfo.display_name,
        hierarchy_level: roleInfo.level,
        permissions: roleInfo.permissions,
        resident_id: user.resident_id,
        residency_status: user.residency_status,
        firebase_uid: user.firebase_uid,
        auth_type: 'database'
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

/**
 * LOCAL MYSQL AUTHENTICATION - RESIDENT ENDPOINTS
 * Pure MySQL authentication system for residents
 */

/**
 * Check Census - Verify resident exists and is eligible for registration
 * POST /api/auth/check-census
 */
async function checkCensus(req, res) {
  try {
    const { last_name, resident_id } = req.body;

    console.log('🔍 Check Census - Resident ID:', resident_id, 'Last Name:', last_name);

    // Validate required fields
    if (!last_name || !resident_id) {
      return res.status(400).json({
        error: 'Last name and resident ID are required'
      });
    }

    // Query residents table
    const resident = await knex('residents')
      .where('Resident_ID', resident_id)
      .where('Last_Name', last_name)
      .first();

    if (!resident) {
      console.log('❌ Resident not found in census');
      return res.status(404).json({
        error: 'Resident not found in census'
      });
    }

    // Check if already registered (has password_hash)
    if (resident.password_hash) {
      console.log('❌ Account already active for resident:', resident_id);
      return res.status(400).json({
        error: 'Account already active'
      });
    }

    console.log('✅ Valid resident found:', resident_id);
    res.json({
      message: 'Valid',
      resident_id: resident.Resident_ID
    });

  } catch (error) {
    console.error('❌ Check census error:', error);
    res.status(500).json({
      error: 'Internal server error during census check'
    });
  }
}

/**
 * Register Resident - Set username/password and activate account
 * POST /api/auth/register-resident
 */
async function registerResident(req, res) {
  try {
    const { resident_id, username, password } = req.body;

    console.log('📝 Register Resident - Resident ID:', resident_id, 'Username:', username);

    // Validate required fields
    if (!resident_id || !username || !password) {
      return res.status(400).json({
        error: 'Resident ID, username, and password are required'
      });
    }

    // Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
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

    // Check if resident exists and is eligible
    const resident = await knex('residents')
      .where('Resident_ID', resident_id)
      .first();

    if (!resident) {
      return res.status(404).json({
        error: 'Resident not found'
      });
    }

    if (resident.password_hash) {
      return res.status(400).json({
        error: 'Account already registered'
      });
    }

    // Check if username is already taken
    const existingUsername = await knex('residents')
      .where('username', username)
      .whereNot('Resident_ID', resident_id) // Exclude current resident
      .first();

    if (existingUsername) {
      return res.status(409).json({
        error: 'Username already taken'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update resident record
    await knex('residents')
      .where('Resident_ID', resident_id)
      .update({
        username: username,
        password_hash: passwordHash,
        account_status: 'Unverified'
      });

    console.log('✅ Resident registered successfully:', resident_id);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: resident_id,
        role: 'resident',
        account_status: 'Unverified'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: resident_id,
        username: username,
        full_name: `${resident.First_Name} ${resident.Last_Name}`,
        role: 'resident',
        account_status: 'Unverified'
      }
    });

  } catch (error) {
    console.error('❌ Register resident error:', error);
    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
}

/**
 * Resident Login - Authenticate with username/password
 * POST /api/auth/resident/login
 */
async function residentLoginLocal(req, res) {
  try {
    const { username, password } = req.body;

    console.log('🔐 Resident Login - Username:', username);

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Find resident by username
    const resident = await knex('residents')
      .where('username', username)
      .whereNot('account_status', 'Unregistered')
      .first();

    if (!resident) {
      console.log('❌ Resident not found or not registered');
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, resident.password_hash);

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    console.log('✅ Resident login successful:', username);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: resident.Resident_ID,
        role: 'resident',
        account_status: resident.account_status
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: resident.Resident_ID,
        username: resident.username,
        full_name: `${resident.First_Name} ${resident.Last_Name}`,
        role: 'resident',
        account_status: resident.account_status
      }
    });

  } catch (error) {
    console.error('❌ Resident login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
}

module.exports = {
  login: hybridLogin, // Updated login function uses gateway
  register,
  getProfile,
  updateProfile,
  getSubordinates,
  instantResidentSignup,
  completeSignup,
  // Hybrid approach residency verification endpoints
  submitResidencyVerification,
  getResidencyVerificationStatus,
  getPendingResidencyVerifications,
  reviewResidencyVerification,
  // Email verification for residency graduation
  verifyEmailForResidency,
  // LOCAL MYSQL AUTHENTICATION - New resident endpoints
  checkCensus,
  registerResident,
  residentLoginLocal,
  // Expose individual auth methods for direct access if needed
  staffLogin,
  residentLogin,
  hybridLogin,
  // Export role hierarchies for use elsewhere
  ROLE_HIERARCHY,
  STAFF_ROLE_HIERARCHY
};
