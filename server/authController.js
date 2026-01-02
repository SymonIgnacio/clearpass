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

    // Validate role (must be valid THEMIS roles: 2,3,4,5,6,12)
    const validRoles = [2, 3, 4, 5, 6, 12];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be one of: 2(Captain), 3(Secretary), 4(Clerk), 5(IT Admin), 6(Blotter Officer), 12(Resident)'
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

/**
 * Get user profile - MySQL-only (no Firebase)
 * GET /api/auth/profile
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let profile;

    if (userRole === 'resident') {
      // Get resident profile
      const [residents] = await getDbConnection().execute(`
        SELECT
          r.Resident_ID as id,
          r.First_Name,
          r.Last_Name,
          r.Middle_Name,
          r.Suffix,
          r.Birthdate,
          r.Gender,
          r.Civil_Status,
          r.Mobile_Number,
          r.Email,
          r.Occupation,
          r.Income_Estimate,
          r.Residency_Status,
          r.Date_Arrival,
          r.Profile_Photo_URL,
          h.Household_Number,
          h.Street_Address,
          s.name as sitio_name
        FROM residents r
        LEFT JOIN households h ON r.Household_ID = h.Household_ID
        LEFT JOIN sitios s ON h.Sitio_ID = s.id
        WHERE r.Resident_ID = ?
      `, [userId]);

      if (residents.length === 0) {
        return res.status(404).json({ error: 'Resident profile not found' });
      }

      profile = {
        id: residents[0].id,
        full_name: `${residents[0].First_Name} ${residents[0].Middle_Name || ''} ${residents[0].Last_Name} ${residents[0].Suffix || ''}`.trim(),
        first_name: residents[0].First_Name,
        middle_name: residents[0].Middle_Name,
        last_name: residents[0].Last_Name,
        suffix: residents[0].Suffix,
        birthdate: residents[0].Birthdate,
        gender: residents[0].Gender,
        civil_status: residents[0].Civil_Status,
        mobile_number: residents[0].Mobile_Number,
        email: residents[0].Email,
        occupation: residents[0].Occupation,
        income_estimate: residents[0].Income_Estimate,
        residency_status: residents[0].Residency_Status,
        date_arrival: residents[0].Date_Arrival,
        profile_photo_url: residents[0].Profile_Photo_URL,
        household_number: residents[0].Household_Number,
        street_address: residents[0].Street_Address,
        sitio_name: residents[0].sitio_name,
        role: 'resident'
      };
    } else {
      // Get staff profile from users table
      const [users] = await getDbConnection().execute(`
        SELECT
          id,
          username,
          full_name,
          email,
          contact_number,
          role,
          is_active,
          last_login,
          created_at
        FROM users
        WHERE id = ?
      `, [userId]);

      if (users.length === 0) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      profile = {
        id: users[0].id,
        username: users[0].username,
        full_name: users[0].full_name,
        email: users[0].email,
        contact_number: users[0].contact_number,
        role: users[0].role,
        is_active: users[0].is_active,
        last_login: users[0].last_login,
        created_at: users[0].created_at
      };
    }

    res.json({
      success: true,
      profile: profile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error during profile retrieval'
    });
  }
}

/**
 * Update user profile - MySQL-only (no Firebase)
 * PUT /api/auth/profile
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const updates = req.body;

    const connection = await getDbConnection();

    if (userRole === 'resident') {
      // Update resident profile
      const allowedFields = [
        'First_Name', 'Middle_Name', 'Last_Name', 'Suffix', 'Birthdate',
        'Gender', 'Civil_Status', 'Mobile_Number', 'Email', 'Occupation',
        'Income_Estimate', 'Profile_Photo_URL'
      ];

      const updateFields = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updateFields.length > 0) {
        const sql = `UPDATE residents SET ${updateFields.join(', ')} WHERE Resident_ID = ?`;
        values.push(userId);
        await connection.execute(sql, values);
      }

      // Get updated profile
      const [updatedResidents] = await connection.execute(`
        SELECT
          r.Resident_ID as id,
          r.First_Name, r.Last_Name, r.Middle_Name, r.Suffix,
          r.Birthdate, r.Gender, r.Civil_Status, r.Mobile_Number, r.Email,
          r.Occupation, r.Income_Estimate, r.Profile_Photo_URL
        FROM residents r
        WHERE r.Resident_ID = ?
      `, [userId]);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        profile: updatedResidents[0]
      });

    } else {
      // Update staff profile
      const allowedFields = ['full_name', 'email', 'contact_number'];

      const updateFields = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updateFields.length > 0) {
        const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        values.push(userId);
        await connection.execute(sql, values);
      }

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    }

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error during profile update'
    });
  }
}

/**
 * Get subordinates (for hierarchy management)
 * GET /api/auth/subordinates
 */
async function getSubordinates(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get users who report to this user (based on parent_user_id)
    const [subordinates] = await getDbConnection().execute(`
      SELECT
        id,
        username,
        full_name,
        email,
        role,
        is_active,
        last_login
      FROM users
      WHERE parent_user_id = ? AND is_active = true
      ORDER BY role, full_name
    `, [userId]);

    res.json({
      success: true,
      subordinates: subordinates,
      count: subordinates.length
    });

  } catch (error) {
    console.error('Get subordinates error:', error);
    res.status(500).json({
      error: 'Internal server error during subordinates retrieval'
    });
  }
}

module.exports = {
  checkCensus,
  registerResident,
  residentLogin: loginResident,
  staffLogin,
  register,
  getProfile,
  updateProfile,
  getSubordinates
};
