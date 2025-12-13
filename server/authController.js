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
      let dbUser = await dbKnex('users')
        .where('email', email)
        .first();

      if (!dbUser) {
        // Create user in database if they don't exist
        const [userId] = await dbKnex('users').insert({
          username: username,
          email: email,
          full_name: userCredential.displayName || username,
          firebase_uid: userCredential.uid,
          role: role,
          is_active: true,
          created_at: dbKnex.fn.now()
        });

        dbUser = await dbKnex('users')
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

      const user = await dbKnex('users')
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
  const trx = await dbKnex.transaction();

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
      // Use the properly configured dbKnex instance
      user = await dbKnex('users')
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

    // Get role information from hierarchy mapping
    const roleInfo = ROLE_HIERARCHY[user.role] || ROLE_HIERARCHY['resident'];
    console.log('🔍 [Profile Debug] Role info:', { userRole: user.role, roleInfo });

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
      last_login: user.last_login
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
  const trx = await dbKnex.transaction();

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

    const requests = await dbKnex('resident_signup_requests')
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
  const trx = await dbKnex.transaction();

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
 * Complete Signup After Firebase Verification
 * Called after Firebase email verification is successful
 * Creates the database user record and links it to Firebase UID
 */
async function completeSignup(req, res) {
  console.log('Starting complete signup...');

  try {
    // This endpoint should be called with Firebase ID token (middleware sets req.firebaseUser)
    const { signupData, verificationMethod } = req.body;
    const firebaseUser = req.firebaseUser; // Set by Firebase middleware

    console.log('Firebase user:', firebaseUser?.uid);
    console.log('Signup data:', signupData);

    if (!firebaseUser || !signupData) {
      console.log('Missing Firebase user or signup data');
      return res.status(400).json({
        error: 'Invalid verification data'
      });
    }

    // Check if user already exists in database (avoid duplicates)
    let existingUser = await db.execute(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [firebaseUser.uid]
    );

    if (existingUser[0].length > 0) {
      console.log('User already exists in database');
      return res.status(409).json({
        error: 'Account already verified'
      });
    }

    // Check for username conflicts
    const usernameCheck = await db.execute(
      'SELECT id FROM users WHERE username = ? AND is_active = true',
      [signupData.username]
    );

    if (usernameCheck[0].length > 0) {
      console.log('Username already taken');
      return res.status(409).json({
        error: 'Username already taken'
      });
    }

    console.log('Creating database user record...');

    // Create user record in database linked to Firebase UID
    const userData = [
      signupData.username,
      null, // password_hash (not used with Firebase Auth)
      signupData.full_name.trim(),
      firebaseUser.email || signupData.email,
      signupData.mobile_number || null,
      'resident',
      true, // is_active (verified)
      firebaseUser.uid, // firebase_uid
      verificationMethod === 'email' ? true : false, // email_verified
      verificationMethod === 'sms' ? true : false, // phone_verified
      new Date(), // verified_at
      new Date() // created_at
    ];

    console.log('Inserting user with data:', userData);

    const [result] = await db.execute(
      `INSERT INTO users (
        username, password_hash, full_name, email, contact_number, role, is_active,
        firebase_uid, email_verified, phone_verified, verified_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      userData
    );

    const userId = result.insertId;
    console.log('User created with ID:', userId);

    // Generate resident ID and create resident record (optional for documents)
    const residentId = `RES-${Date.now()}-${userId}`;

    console.log('Creating resident record...');

    const residentData = [
      residentId,
      signupData.full_name.split(' ')[0], // First name
      signupData.full_name.split(' ').slice(1).join(' ') || '', // Last name
      signupData.mobile_number || null,
      firebaseUser.email || signupData.email,
      'Active', // Residency_Status
      new Date() // created_at
    ];

    await db.execute(
      `INSERT INTO residents (
        Resident_ID, First_Name, Last_Name, Mobile_Number, Email, Residency_Status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      residentData
    );

    console.log('Resident record created');

    // Update user with resident_id
    await db.execute(
      'UPDATE users SET resident_id = ? WHERE id = ?',
      [residentId, userId]
    );

    console.log('User updated with resident_id');

    // Get complete user data for response
    const [userRows] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    const completeUser = userRows[0];
    const roleInfo = ROLE_HIERARCHY[completeUser.role] || ROLE_HIERARCHY['resident'];

    console.log('Generating JWT token...');

    // Generate JWT token for immediate login
    const token = generateToken({
      ...completeUser,
      role_name: roleInfo.display_name,
      hierarchy_level: roleInfo.level,
      permissions: roleInfo.permissions
    });

    console.log('Signup completed successfully');

    res.json({
      success: true,
      message: 'Account verification completed successfully',
      token,
      user: {
        id: completeUser.id,
        username: completeUser.username,
        full_name: completeUser.full_name,
        email: completeUser.email,
        mobile_number: completeUser.contact_number,
        resident_id: residentId,
        firebase_uid: completeUser.firebase_uid,
        role: completeUser.role,
        role_name: roleInfo.display_name,
        hierarchy_level: roleInfo.level,
        permissions: roleInfo.permissions
      }
    });

  } catch (error) {
    console.error('Complete signup error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);

    res.status(500).json({
      error: 'Internal server error during verification completion',
      details: error.message
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
        await dbKnex('login_attempts').insert({
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
      await dbKnex('users')
        .where('id', dbUser.id)
        .update({ last_login: dbKnex.fn.now() });

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

      const result = await loginDatabaseFallback(req, res, username, password);
      if (result) {
        // Add auth type indicator
        result.user.auth_type = 'database_fallback';
      }
      return result;
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

module.exports = {
  login: hybridLogin, // Updated login function uses gateway
  register,
  getProfile,
  getSubordinates,
  residentSignup,
  getPendingResidentSignups,
  reviewResidentSignup,
  getResidentSignupStats,
  instantResidentSignup,
  completeSignup,
  // Expose individual auth methods for direct access if needed
  staffLogin,
  residentLogin,
  hybridLogin
};
