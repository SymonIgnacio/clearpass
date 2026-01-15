const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const NotificationController = require('../controllers/notificationController');
const { sendEmail } = require('../utils/emailService');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Increased limit for testing
  message: { error: 'Too many authentication attempts, try again later' },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3, // 3 registrations per hour
  message: { error: 'Too many registration attempts, try again later' },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

module.exports = (db) => {
  // Resident login endpoint
  router.post('/login', authLimiter, asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find resident by email
    const [residents] = await db.execute(
      'SELECT r.*, u.password_hash, u.role FROM residents r JOIN users u ON r.email = u.email WHERE r.email = ? AND (r.Residency_Status = "Active" OR r.Residency_Status = "Pending Verification")',
      [email]
    );

    if (residents.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or inactive account'
      });
    }

    const resident = residents[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, resident.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Determine effective role (fallback to GUEST if status is Pending)
    const effectiveRole = resident.Residency_Status === 'Pending Verification' ? 13 : (resident.role || 12);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: resident.Resident_ID,
        resident_id: resident.Resident_ID,
        email: resident.email,
        role: effectiveRole,
        type: 'resident'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: resident.Resident_ID,
        resident_id: resident.Resident_ID,
        email: resident.email,
        name: `${resident.First_Name} ${resident.Last_Name}`,
        role: effectiveRole,
        type: 'resident'
      }
    });
  }));

  // Resident registration endpoint
  router.post('/register', registerLimiter, asyncHandler(async (req, res) => {
    const {
      first_name,
      middle_name,
      last_name,
      email,
      mobile_number,
      birthdate,
      gender,
      civil_status,
      password,
      household_id,
      sitio_id
    } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !password || !birthdate || !gender || !civil_status) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: first_name, last_name, email, password, birthdate, gender, civil_status'
      });
    }

    // Check if email already exists
    const [existingUsers] = await db.execute('SELECT email FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate resident ID using crypto
    const randomBytes = crypto.randomBytes(4);
    const residentId = `RES-${Date.now()}-${randomBytes.toString('hex').toUpperCase()}`;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Create resident record
      await connection.execute(
        `INSERT INTO residents (
          Resident_ID, First_Name, Middle_Name, Last_Name, email, Mobile_Number,
          Birthdate, Gender, Civil_Status, Household_ID, Date_Arrival, Residency_Status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Pending Verification', NOW(), NOW())`,
        [residentId, first_name, middle_name || '', last_name, email, mobile_number || '', birthdate, gender, civil_status, household_id || null]
      );

      // Create user account
      const [userResult] = await connection.execute(
        'INSERT INTO users (username, email, password_hash, role, full_name, resident_id, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [email, email, hashedPassword, 13, `${first_name} ${last_name}`, residentId, true] // Role 13 = GUEST
      );
      const userId = userResult.insertId;

      // Send notifications
      try {
        const notificationController = new NotificationController(db);
        const requirementsMsg = "Registration received. Please prepare the following requirements: Valid ID for 4Ps, PWD docs, and Barangay Clearance.";
        
        await notificationController.createNotification(
          userId,
          'Registration Successful - Requirements',
          requirementsMsg,
          'info',
          'high'
        );

        await sendEmail({
          to: email,
          subject: 'Welcome to ClearPass - Requirements',
          text: `Welcome ${first_name}!\n\n${requirementsMsg}\n\nYour account is pending verification.`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Welcome ${first_name}!</h2><p>${requirementsMsg}</p><p>Your account is pending verification.</p></div>`
        });
      } catch (notifyError) {
        console.error('Failed to send registration notifications:', notifyError);
        // Continue execution - don't fail registration
      }

      await connection.commit();

      // Generate JWT token for auto-login
      const token = jwt.sign(
        {
          id: residentId,
          resident_id: residentId,
          email: email,
          role: 13, // Guest role (Pending)
          type: 'resident'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful. Account pending verification.',
        resident_id: residentId,
        token,
        user: {
          id: residentId,
          resident_id: residentId,
          email: email,
          name: `${first_name} ${last_name}`,
          role: 13, // Guest role
          type: 'resident'
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }));

  // Resident profile endpoint
  router.get('/profile', verifyToken, checkRole(['resident']), asyncHandler(async (req, res) => {
    const [residents] = await db.execute(
      `SELECT r.*, h.Household_Number, s.name as sitio_name, v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent
       FROM residents r
       LEFT JOIN households h ON r.Household_ID = h.Household_ID
       LEFT JOIN sitios s ON h.Sitio_ID = s.id
       LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
       WHERE r.Resident_ID = ?`,
      [req.user.id]
    );

    if (residents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resident profile not found'
      });
    }

    res.json({
      success: true,
      profile: residents[0]
    });
  }));

  return router;
};
