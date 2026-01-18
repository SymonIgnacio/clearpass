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
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3, // 3 registrations per hour
  message: { error: 'Too many registration attempts, try again later' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

module.exports = db => {
  // Resident login endpoint
  router.post(
    '/login',
    authLimiter,
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Find user by email (allow login even if not yet a full resident)
      const [users] = await db.execute(
        `SELECT u.*, r.Residency_Status, r.Resident_ID as real_resident_id, r.First_Name, r.Last_Name 
       FROM users u 
       LEFT JOIN residents r ON u.email = r.email 
       WHERE u.email = ?`,
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const user = users[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if account is active (users table)
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
        });
      }

      // Determine effective role and status
      // If they have a resident record, use its status/role.
      // If not, they are a Guest (Role 13) with pending/no application.
      let effectiveRole = 13; // Default to Guest
      let residentId = user.real_resident_id || user.resident_id || null;
      let residencyStatus = user.Residency_Status || null;

      if (residentId && residencyStatus) {
        // Full resident
        effectiveRole = user.role || 12; // Default to Resident (12)
        if (residencyStatus === 'Pending Verification' || residencyStatus === 'Transient') {
          effectiveRole = 13; // Treat as guest if pending
        }
      } else {
        // Check for pending application if not a resident
        const [apps] = await db.execute(
          'SELECT status, application_id FROM resident_applications WHERE email = ? ORDER BY created_at DESC LIMIT 1',
          [email]
        );
        if (apps.length > 0) {
          // Found an application
          residencyStatus = apps[0].status === 'pending' ? 'Pending Verification' : apps[0].status;
          // If they have an application, we might want to pass that ID or just keep them as Guest
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id, // User ID
          resident_id: residentId, // Might be null
          email: user.email,
          role: effectiveRole,
          type: 'resident',
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set HTTP-only cookie (Session Cookie - clears on browser close)
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        // maxAge removed to make it a session cookie
      });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          resident_id: residentId,
          email: user.email,
          full_name: user.full_name || user.username,
          name: user.full_name || user.username, // Keep for backward compatibility
          role: effectiveRole,
          role_name: effectiveRole === 13 ? 'Guest' : (user.role === 12 ? 'Resident' : 'User'), // Explicit role name
          type: 'resident',
          residency_status: residencyStatus,
        },
      });
    })
  );

  // Resident registration endpoint
  router.post(
    '/register',
    registerLimiter,
    asyncHandler(async (req, res) => {
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
        street_address,
        sitio,
        birth_place,
      } = req.body;

      // Validation
      if (
        !first_name ||
        !last_name ||
        !email ||
        !password ||
        !birthdate ||
        !gender ||
        !civil_status ||
        !street_address ||
        !sitio
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Required fields: first_name, last_name, email, password, birthdate, gender, civil_status, street_address, sitio',
        });
      }

      // Check if email already exists
      const [existingUsers] = await db.execute('SELECT email FROM users WHERE email = ?', [email]);
      if (existingUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate Application ID
      const randomBytes = crypto.randomBytes(4);
      const applicationId = `APP-${Date.now()}-${randomBytes.toString('hex').toUpperCase()}`;

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        // 1. Create Resident Application Record
        // This holds the personal data until approved
        await connection.execute(
          `INSERT INTO resident_applications (
          application_id, first_name, middle_name, last_name, email, mobile_number,
          birthdate, birth_place, gender, civil_status, street_address, sitio,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
          [
            applicationId,
            first_name,
            middle_name || '',
            last_name,
            email,
            mobile_number || '',
            birthdate,
            birth_place || '',
            gender,
            civil_status,
            street_address,
            sitio,
          ]
        );

        // 2. Create User Account (Role 13 = Guest)
        const [userResult] = await connection.execute(
          'INSERT INTO users (username, email, password_hash, role, full_name, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [email, email, hashedPassword, 13, `${first_name} ${last_name}`, true]
        );
        const userId = userResult.insertId;

        // Send notifications
        try {
          const notificationController = new NotificationController(db);
          const requirementsMsg =
            'Registration successful. Please log in and upload your Proof of Residency (Valid ID or Utility Bill) to complete your application.';

          await notificationController.createNotification(
            userId,
            'Action Required: Upload Proof of Residency',
            requirementsMsg,
            'info',
            'high'
          );

          await sendEmail({
            to: email,
            subject: 'Welcome to ClearPass - Action Required',
            text: `Welcome ${first_name}!\n\n${requirementsMsg}\n\nYour account is currently under review.`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Welcome ${first_name}!</h2><p>${requirementsMsg}</p><p>Please log in to the portal to upload your documents.</p></div>`,
          });
        } catch (notifyError) {
          console.error('Failed to send registration notifications:', notifyError);
        }

        await connection.commit();

        // Generate JWT token for auto-login
        const token = jwt.sign(
          {
            id: userId,
            resident_id: null, // Not a resident yet
            email: email,
            role: 13, // Guest role
            type: 'resident',
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Set HTTP-only cookie (Session Cookie)
        res.cookie('authToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          // maxAge removed
        });

        res.status(201).json({
          success: true,
          message: 'Registration successful. Please upload proof of residency.',
          token,
          user: {
            id: userId,
            resident_id: null,
            email: email,
            full_name: `${first_name} ${last_name}`,
            name: `${first_name} ${last_name}`,
            role: 13,
            role_name: 'Guest',
            type: 'resident',
            residency_status: 'Pending Verification',
          },
        });
      } catch (error) {
        console.error('Registration error:', error);
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    })
  );

  // Resident profile endpoint
  router.get(
    '/profile',
    verifyToken,
    checkRole(['resident', 'guest']),
    asyncHandler(async (req, res) => {
      const resident_id = req.user.resident_id;

      if (!resident_id) {
        // Handle Guest/Applicant: Fetch from resident_applications
        const [applications] = await db.execute(
          'SELECT * FROM resident_applications WHERE email = ? ORDER BY created_at DESC LIMIT 1',
          [req.user.email]
        );

        if (applications.length > 0) {
          const app = applications[0];
          // Normalize keys to match residents table structure expected by frontend
          const normalizedApp = {
            ...app,
            First_Name: app.first_name,
            Middle_Name: app.middle_name,
            Last_Name: app.last_name,
            Suffix: app.suffix,
            Birthdate: app.birthdate,
            Birth_Place: app.birth_place,
            Gender: app.gender,
            Civil_Status: app.civil_status,
            Occupation: app.occupation,
            Email: app.email,
            Mobile_Number: app.mobile_number,
            Street_Address: app.street_address,
            Residency_Status: app.status || 'Pending Verification',
          };
          return res.json({ success: true, profile: normalizedApp });
        }

        // Fallback for brand new users without application
        return res.json({
          success: true,
          profile: {
            First_Name: req.user.email,
            Last_Name: '',
            Residency_Status: 'Guest',
          },
        });
      }

      const [residents] = await db.execute(
        `SELECT r.*, h.Household_Number, s.name as sitio_name, v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent
       FROM residents r
       LEFT JOIN households h ON r.Household_ID = h.Household_ID
       LEFT JOIN sitios s ON h.Sitio_ID = s.id
       LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
       WHERE r.Resident_ID = ?`,
        [req.user.resident_id]
      );

      if (residents.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Resident profile not found',
        });
      }

      res.json({
        success: true,
        profile: residents[0],
      });
    })
  );

  return router;
};
