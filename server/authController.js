const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_management',
  port: process.env.DB_PORT || 3306
};

// Get database connection
async function getDbConnection() {
  return await mysql.createConnection(dbConfig);
}

/**
 * Census-First Authentication Controller
 * Strict local authentication using bcrypt and jsonwebtoken
 * No Firebase, no signups - only activation of existing residents
 */

// Generate JWT token for residents
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: 'resident',
      account_status: user.account_status
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

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

    const connection = await getDbConnection();
    try {
      // Query residents table
      const [rows] = await connection.execute(
        'SELECT * FROM residents WHERE Resident_ID = ? AND Last_Name = ?',
        [resident_id, last_name]
      );

      const resident = rows[0];

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
    } finally {
      await connection.end();
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

    const connection = await getDbConnection();
    let resident;
    try {
      // Check if resident exists and is eligible
      const [residentRows] = await connection.execute(
        'SELECT * FROM residents WHERE Resident_ID = ?',
        [resident_id]
      );
      resident = residentRows[0];

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
      const [usernameRows] = await connection.execute(
        'SELECT Resident_ID FROM residents WHERE username = ? AND Resident_ID != ?',
        [username, resident_id]
      );

      if (usernameRows.length > 0) {
        return res.status(409).json({
          error: 'Username already taken'
        });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Update resident record
      await connection.execute(
        'UPDATE residents SET username = ?, password_hash = ?, account_status = ? WHERE Resident_ID = ?',
        [username, passwordHash, 'Unverified', resident_id]
      );

    } finally {
      await connection.end();
    }

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

    // Send welcome email asynchronously (don't block response)
    try {
      const { sendWelcomeEmail } = require('./notificationService');
      sendWelcomeEmail(resident).catch(err => {
        console.error('Failed to send welcome email:', err);
      });
    } catch (emailError) {
      console.error('Failed to load notification service:', emailError);
    }

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
async function loginResident(req, res) {
  try {
    const { username, password } = req.body;

    console.log('🔐 Resident Login - Username:', username);

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    const connection = await getDbConnection();
    let resident;
    try {
      // Find resident by username
      const [rows] = await connection.execute(
        'SELECT * FROM residents WHERE username = ? AND account_status != ?',
        [username, 'Unregistered']
      );
      resident = rows[0];

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
    } finally {
      await connection.end();
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

/**
 * Staff Login - Authenticate officers against users table
 * POST /api/auth/officer-login
 */
async function staffLogin(req, res) {
  try {
    const { username, password } = req.body;

    console.log('🔐 Staff Login - Username:', username);

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    const connection = await getDbConnection();
    let user;
    try {
      // Find user in users table
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE username = ? AND is_active = true',
        [username]
      );
      user = rows[0];

      if (!user) {
        console.log('❌ Staff not found or inactive');
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        console.log('❌ Invalid password');
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }
    } finally {
      await connection.end();
    }

    console.log('✅ Staff login successful:', username);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Staff sessions last longer
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        contact_number: user.contact_number
      }
    });

  } catch (error) {
    console.error('❌ Staff login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
}

/**
 * Register New User - Super Admin only
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { username, password, full_name, email, role } = req.body;

    console.log('👤 User Registration - Username:', username, 'Role:', role);

    // Validate required fields
    if (!username || !password || !full_name || !role) {
      return res.status(400).json({
        error: 'Username, password, full name, and role are required'
      });
    }

    // Validate role (must be 1-6 for THEMIS system)
    if (role < 1 || role > 6) {
      return res.status(400).json({
        error: 'Invalid role. Must be between 1-6'
      });
    }

    const connection = await getDbConnection();
    try {
      // Check if username already exists
      const [existingRows] = await connection.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (existingRows.length > 0) {
        return res.status(409).json({
          error: 'Username already exists'
        });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const [result] = await connection.execute(
        'INSERT INTO users (username, password_hash, full_name, email, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())',
        [username, passwordHash, full_name, email, parseInt(role)]
      );

      const userId = result.insertId;

      console.log('✅ User registered successfully:', username);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: userId,
          username,
          full_name,
          email,
          role: parseInt(role)
        }
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ User registration error:', error);
    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
}

module.exports = {
  checkCensus,
  registerResident,
  loginResident,
  staffLogin,
  register
};
