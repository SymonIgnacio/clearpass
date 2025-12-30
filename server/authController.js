const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);

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
  checkCensus,
  registerResident,
  loginResident
};
