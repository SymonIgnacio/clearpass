const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csurf = require('csurf');
const xssClean = require('xss-clean');
const validator = require('validator');
const PDFDocument = require('pdfkit');
const bcrypt = require('bcrypt');
const knex = require('knex');
const admin = require('firebase-admin');
require('dotenv').config();

// Environment variable validation
function validateEnvironmentVariables() {
  const requiredVars = [
    'DB_HOST',
    'DB_USER',
    'DB_NAME',
    'JWT_SECRET'
  ];

  // DB_PASSWORD can be empty (for XAMPP default setup)
  const optionalVars = ['DB_PASSWORD'];

  const missingRequiredVars = requiredVars.filter(varName =>
    process.env[varName] === undefined || process.env[varName] === null
  );

  if (missingRequiredVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingRequiredVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📋 Please create a .env file with the required variables.');
    console.error('   Copy from server/.env.example and fill in your values.');
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
}

// Validate environment variables on startup
validateEnvironmentVariables();

// Import authentication system
const authController = require('./authController');
const {
  verifyToken,
  checkRole,
  checkHierarchyAccess,
  checkOwnershipOrHierarchy
} = require('./authMiddleware');

// Import Firebase middleware
const { verifyFirebaseToken } = require('./firebaseMiddleware');

// Import monitoring system
const {
  register,
  logger,
  requestLogger,
  monitorDatabaseQuery,
  monitorAIService,
  monitorCertificateIssuance,
  errorHandler,
  healthCheck
} = require('./monitoring');

// Import WebSocket server
const { initializeWebSocket } = require('./websocket');

// Import API documentation
const { swaggerUi, swaggerSpec } = require('./swagger');

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Import SSL configuration
const sslConfig = require('./ssl-config');

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for sensitive operations
  message: {
    error: 'Too many sensitive operations, please try again later.',
    retryAfter: 15 * 60 * 1000
  }
});

// Middleware
const corsOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.CLIENT_URL,
      process.env.CORS_ORIGIN,
      'https://stalwart-sorbet-d70d32.netlify.app',
      'https://agent-693f2dd0af115f4fdd--stalwart-sorbet-d70d32.netlify.app',
      'https://courageous-cupcake-987b2b.netlify.app',
      'https://glistening-lamington-a9e2b7.netlify.app', // NEW Netlify frontend
      // Add any future URLs here
    ].filter(Boolean)
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];

console.log('🔧 CORS Configuration:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   CLIENT_URL:', process.env.CLIENT_URL);
console.log('   CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('   Filtered origins:', corsOrigins);

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Add debug middleware to log all incoming requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;

  console.log(`[${timestamp}] ${method} ${url} - Incoming Request`);

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    console.log(`[${timestamp}] ${method} ${url} - Response: ${res.statusCode} ${typeof data === 'object' ? 'JSON' : 'HTML'}`);
    return originalJson.call(this, data);
  };

  next();
});

// Note: Static file serving removed for separate frontend deployment

// Security middleware - applied before body parsing
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "cdn.jsdelivr.net"],
      connectSrc: ["'self'", "http://localhost:5000"],
      frameSrc: ["'self'", "https://accounts.google.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));

// XSS Protection before body parsing
app.use(xssClean());

// Input sanitization middleware
app.use((req, res, next) => {
  if (req.body) {
    // Sanitize all string inputs
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validator.escape(req.body[key].trim());
      }
    }
  }
  next();
});

app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(requestLogger);

// CSRF Protection completely disabled (moved to production-ready implementation)
// TODO: Implement proper CSRF handling with React CSRF tokens
// app.use(csurf({ cookie: true }));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  res.setHeader('Expect-CT', 'max-age=86400, enforce, report-uri="https://report-uri.example.com/r/d/ct/enforce"');
  next();
});



// Apply rate limiting
// Temporarily disabled for development/testing
// app.use('/api/certificates', strictLimiter); // Certificate operations are sensitive
// app.use('/api/residents', apiLimiter);
// app.use('/api/blotter', apiLimiter);
// app.use('/api/', apiLimiter);

// Database connection - Support Railway DATABASE_URL and legacy configuration
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

// Add detailed logging for database configuration
console.log('🔧 Database Configuration:');
console.log('   DB_HOST:', process.env.DB_HOST);
console.log('   MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('   DB_USER:', process.env.DB_USER);
console.log('   MYSQL_USERNAME:', process.env.MYSQL_USERNAME);
console.log('   DB_NAME:', process.env.DB_NAME);
console.log('   MYSQL_DATABASE:', process.env.MYSQL_DATABASE);
console.log('   Resolved host:', dbConfig.host);
console.log('   Resolved user:', dbConfig.user);
console.log('   Resolved database:', dbConfig.database);
console.log('   Resolved port:', dbConfig.port);
console.log('   Has password:', !!dbConfig.password);

let db;
async function initializeDatabase() {
  try {
    db = await mysql.createPool(dbConfig);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Initialize database on startup
initializeDatabase();

// Utility function to calculate age
function calculateAge(birthdate) {
  if (!birthdate) return 0;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

// Modified multer configuration to store files in memory for BLOB storage
const multer = require('multer');
const xlsx = require('xlsx');

// Configuration for BLOB storage (in-memory)
const uploadBlob = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images, PDFs, and Word documents
    const allowedMimetypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and Word documents are allowed'));
    }
  }
});

// Legacy configuration for file system storage (if needed)
const uploadDisk = multer({ dest: 'uploads/' });

console.log('🔧 [Route Registration] Registering authentication routes...');

// ==========================================
// AUTHENTICATION & ACCOUNT HIERARCHY MODULE
// ==========================================

// Public authentication routes (no middleware needed)
// Support both /auth/... and /api/auth/... paths temporarily for compatibility
console.log('🔧 [Route Registration] Setting up /api/auth/login');
app.post('/api/auth/login', authController.residentLogin); // Primary /api route
app.post('/auth/login', authController.residentLogin); // Legacy /auth route

console.log('🔧 [Route Registration] Setting up /api/auth/officer-login');
app.post('/api/auth/officer-login', (req, res) => {
  console.log('🚀 [Route Hit] /api/auth/officer-login called with body:', {
    username: req.body?.username,
    hasPassword: !!req.body?.password
  });
  return authController.staffLogin(req, res);
}); // Primary /api route

app.post('/auth/officer-login', (req, res) => {
  console.log('🚀 [Route Hit] /auth/officer-login called with body:', {
    username: req.body?.username,
    hasPassword: !!req.body?.password
  });
  return authController.staffLogin(req, res);
}); // Legacy /auth route

console.log('🔧 [Route Registration] Setting up /api/auth/register');
app.post('/api/auth/register', verifyToken, checkRole(['Super Admin']), authController.register);
app.post('/auth/register', verifyToken, checkRole(['Super Admin']), authController.register);

// Add dual routing for commonly used endpoints
console.log('🔧 [Route Registration] Setting up dual routes for backward compatibility');

// Analytics/Census routes
app.get('/api/census', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT
        s.name as sitio_name,
        COUNT(r.Resident_ID) as total_residents,
        SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as pwd,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as single_parents
      FROM sitios s
      LEFT JOIN households h ON s.id = h.Sitio_ID
      LEFT JOIN residents r ON h.Household_ID = r.Household_ID
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    const [overall] = await db.execute(`
      SELECT
        COUNT(*) as total_residents,
        SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as total_pwd,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as total_single_parents
      FROM residents r
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
    `);

    res.json({
      bySitio: stats,
      overall: overall[0]
    });
  } catch (error) {
    console.error('Error fetching census:', error);
    res.status(500).json({ error: 'Failed to fetch census data' });
  }
});
app.get('/census', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), async (req, res) => {
  const [stats] = await db.execute(`
    SELECT
      s.name as sitio_name,
      COUNT(r.Resident_ID) as total_residents,
      SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as seniors,
      SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as pwd,
      SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as single_parents
    FROM sitios s
    LEFT JOIN households h ON s.id = h.Sitio_ID
    LEFT JOIN residents r ON h.Household_ID = r.Household_ID
    LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
    GROUP BY s.id, s.name
    ORDER BY s.name
  `);

  const [overall] = await db.execute(`
    SELECT
      COUNT(*) as total_residents,
      SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as total_seniors,
      SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as total_pwd,
      SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as total_single_parents
    FROM residents r
    LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
  `);

  res.json({
    bySitio: stats,
    overall: overall[0]
  });
});

// Blotter routes
app.get('/api/blotter', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT b.*,
             s.name as sitio_name
      FROM blotter b
      LEFT JOIN sitios s ON b.Location_Sitio = s.name
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching blotter:', error);
    res.status(500).json({ error: 'Failed to fetch blotter records' });
  }
});
app.get('/blotter', async (req, res) => {
  const [rows] = await db.execute(`
    SELECT b.*,
           s.name as sitio_name
    FROM blotter b
    LEFT JOIN sitios s ON b.Location_Sitio = s.name
    ORDER BY b.created_at DESC
  `);
  res.json(rows);
});

// Certificate routes
app.get('/api/certificates', (req, res, next) => {
  // Check for resident Firebase token first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    // Check if it looks like a Firebase ID token (longer than typical JWT)
    if (token && token.length > 500) {
      return verifyFirebaseToken(req, res, next); // Resident path
    }
  }
  // Default to JWT verification for staff (unrestricted access)
  return verifyToken(req, res, next);
}, async (req, res) => {
  try {
    // Check if user is a resident (Firebase authenticated)
    const isResident = req.firebaseUser ? true : false;

    let query, values;

    if (isResident && req.firebaseUser) {
      // Resident can only see their own certificates
      query = `
        SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
        FROM certificates_log c
        JOIN residents r ON c.resident_id = r.Resident_ID
        WHERE EXISTS (
          SELECT 1 FROM users u
          WHERE u.resident_id = r.Resident_ID
          AND u.firebase_uid = ?
        )
        ORDER BY c.created_at DESC
      `;
      values = [req.firebaseUser.uid];
    } else {
      // Staff can see all certificates
      query = `
        SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
        FROM certificates_log c
        JOIN residents r ON c.resident_id = r.Resident_ID
        ORDER BY c.created_at DESC
      `;
      values = [];
    }

    const [rows] = await db.execute(query, values);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});
app.get('/certificates', (req, res, next) => {
  // Check for resident Firebase token first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    // Check if it looks like a Firebase ID token (longer than typical JWT)
    if (token && token.length > 500) {
      return verifyFirebaseToken(req, res, next); // Resident path
    }
  }
  // Default to JWT verification for staff (unrestricted access)
  return verifyToken(req, res, next);
}, async (req, res) => {
  // Check if user is a resident (Firebase authenticated)
  const isResident = req.firebaseUser ? true : false;

  let query, values;

  if (isResident && req.firebaseUser) {
    // Resident can only see their own certificates
    query = `
      SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
      FROM certificates_log c
      JOIN residents r ON c.resident_id = r.Resident_ID
      WHERE EXISTS (
        SELECT 1 FROM users u
        WHERE u.resident_id = r.Resident_ID
        AND u.firebase_uid = ?
      )
      ORDER BY c.created_at DESC
    `;
    values = [req.firebaseUser.uid];
  } else {
    // Staff can see all certificates
    query = `
      SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
      FROM certificates_log c
      JOIN residents r ON c.resident_id = r.Resident_ID
      ORDER BY c.created_at DESC
    `;
    values = [];
  }

  const [rows] = await db.execute(query, values);
  res.json(rows);
});

console.log('🔧 [Route Registration] Authentication routes registered successfully');

// Public resident signup (no authentication required)
app.post('/api/auth/resident-signup', uploadBlob.single('proof_document'), authController.residentSignup);

// Instant signup with Firebase verification
app.post('/api/auth/instant-resident-signup', authController.instantResidentSignup);
app.post('/api/auth/complete-signup', verifyFirebaseToken, authController.completeSignup);

// Email verification for residency graduation
app.post('/api/auth/verify-email-for-residency', verifyFirebaseToken, authController.verifyEmailForResidency);

// Residency verification submission with file upload (support both Firebase and JWT tokens)
app.post('/api/auth/submit-residency-verification', uploadBlob.single('proof_document'), async (req, res) => {
  try {
    const { proof_type, notes } = req.body;

    // Check authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization header required'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Determine if it's a Firebase token (long) or JWT token (short)
    let user, firebaseUser, userId;

    if (token.length > 500) {
      // Firebase ID token
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        firebaseUser = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name
        };

        // Get user by Firebase UID
        const [userRows] = await db.execute(
          'SELECT id, full_name, email, resident_id FROM users WHERE firebase_uid = ?',
          [firebaseUser.uid]
        );

        if (userRows.length > 0) {
          user = userRows[0];
          userId = user.id;
        }
      } catch (firebaseError) {
        return res.status(401).json({
          error: 'Invalid Firebase token'
        });
      }
    } else {
      // JWT token - verify directly with jsonwebtoken
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;

        const [userRows] = await db.execute(
          'SELECT id, full_name, email, resident_id FROM users WHERE id = ?',
          [userId]
        );

        if (userRows.length > 0) {
          user = userRows[0];
        }
      } catch (jwtError) {
        return res.status(401).json({
          error: 'Invalid JWT token'
        });
      }
    }

    if (!user) {
      return res.status(404).json({
        error: 'User account not found'
      });
    }

    console.log('🚀 [Residency Verification] Submitting for user:', userId, user.full_name);

    if (!proof_type) {
      return res.status(400).json({
        error: 'Proof type is required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Proof document file is required'
      });
    }

    // Ensure user has a resident record
    let residentId = user.resident_id;
    if (!residentId) {
      // Create a basic resident record if it doesn't exist
      residentId = firebaseUser ?
        `RES-TEMP-${Date.now()}-${firebaseUser.uid.substring(0, 8)}` :
        `RES-TEMP-${Date.now()}-${userId}`;

      console.log('📝 Creating temporary resident record for user:', userId);

      try {
        await db.execute(
          'INSERT INTO residents (Resident_ID, First_Name, Email, Residency_Status, Date_Arrival, created_at) VALUES (?, ?, ?, ?, CURDATE(), NOW())',
          [residentId, user.full_name || 'Unknown', user.email || '', 'pending']
        );

        // Link resident to user
        await db.execute(
          'UPDATE users SET resident_id = ? WHERE id = ?',
          [residentId, userId]
        );
      } catch (createError) {
        console.error('Error creating resident record:', createError);
        // Continue anyway - may already exist
      }
    }

    // Generate request ID
    const requestId = `REQ-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    console.log('📄 File received:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'NONE');

    // Insert verification request with BLOB storage
    const [result] = await db.execute(`
      INSERT INTO resident_verification_requests (
        request_id, user_id, file_data, file_encoding, original_filename, mime_type, file_size,
        proof_type, notes, status, submitted_at
      ) VALUES (?, ?, ?, 'buffer', ?, ?, ?, ?, ?, 'pending', NOW())
    `, [
      requestId,
      userId,
      req.file.buffer, // Store actual file data as BLOB
      req.file.originalname, // Store original filename
      req.file.mimetype, // Store MIME type
      req.file.size, // Store file size
      proof_type,
      notes || null
    ]);

    console.log('✅ Residency verification submitted:', requestId);

    res.json({
      success: true,
      message: 'Residency verification request submitted successfully',
      request_id: requestId,
      file_name: req.file.originalname,
      submitted_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Residency verification submission error:', error);
    res.status(500).json({
      error: 'Failed to submit residency verification request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get residency verification status
app.get('/api/auth/residency-verification/status', verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUid = req.firebaseUser.uid;

    // Get user ID first
    const [userRows] = await db.execute('SELECT id FROM users WHERE firebase_uid = ?', [firebaseUid]);
    if (userRows.length === 0) {
      return res.json({ found: false, message: 'User not found' });
    }

    const userId = userRows[0].id;

    // Get latest verification request for this user using resident_verification_requests table
    const [rows] = await db.execute(`
      SELECT
        rvr.*, u.full_name, u.email,
        r.First_Name, r.Last_Name, r.Residency_Status as resident_status
      FROM resident_verification_requests rvr
      JOIN users u ON rvr.user_id = u.id
      LEFT JOIN residents r ON u.resident_id = r.Resident_ID
      WHERE rvr.user_id = ? AND rvr.status != 'rejected'
      ORDER BY rvr.submitted_at DESC
      LIMIT 1
    `, [userId]);

    if (rows.length === 0) {
      return res.json({
        found: false,
        message: 'No active verification request found'
      });
    }

    const request = rows[0];

    res.json({
      found: true,
      status: request.status,
      request_id: request.id,
      proof_type: request.proof_type,
      notes: request.notes,
      submitted_at: request.submitted_at,
      reviewed_at: request.reviewed_at,
      officer_notes: request.review_notes,
      review_reason: request.review_reason
    });

  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({
      error: 'Failed to fetch verification status'
    });
  }
});

// Protected auth routes (use Firebase middleware for residents, JWT for staff)
// Check user auth type and route accordingly
app.get('/api/auth/profile', (req, res, next) => {
  // Check for resident Firebase token first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    // Check if it looks like a Firebase ID token (longer than typical JWT)
    if (token && token.length > 500) {
      return verifyFirebaseToken(req, res, next); // Resident path
    }
  }
  // Default to JWT verification for staff
  return verifyToken(req, res, next);
}, authController.getProfile);

app.put('/api/auth/profile', (req, res, next) => {
  // Check for resident Firebase token first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    // Check if it looks like a Firebase ID token (longer than typical JWT)
    if (token && token.length > 500) {
      return verifyFirebaseToken(req, res, next); // Resident path
    }
  }
  // Default to JWT verification for staff
  return verifyToken(req, res, next);
}, authController.updateProfile);

app.get('/api/auth/subordinates', verifyToken, authController.getSubordinates);

// Firebase users management
app.get('/api/auth/firebase-users', verifyToken, checkRole(['admin', 'captain', 'secretary']), async (req, res) => {
  try {
    console.log('=== FETCHING FIREBASE USERS ===');

    // Get Firebase users using Admin SDK
    const firebaseUsers = [];
    let nextPageToken;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      firebaseUsers.push(...listUsersResult.users);
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`Found ${firebaseUsers.length} Firebase users`);

    // Get corresponding database records for enhanced info
    const [dbUsersRows] = await db.execute(`
      SELECT firebase_uid, full_name, email, role, is_active, created_at, last_login, residency_status
      FROM users
      WHERE firebase_uid IS NOT NULL
    `);
    const dbUsers = dbUsersRows;

    // Create a map for quick lookup
    const dbUserMap = {};
    dbUsers.forEach(dbUser => {
      dbUserMap[dbUser.firebase_uid] = dbUser;
    });

    // Combine Firebase and database data
    const combinedUsers = firebaseUsers.map(firebaseUser => {
      const dbUser = dbUserMap[firebaseUser.uid];
      const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0];

      return {
        id: firebaseUser.uid,
        firebase_uid: firebaseUser.uid,
        username: displayName,
        full_name: dbUser?.full_name || displayName,
        email: firebaseUser.email,
        role: dbUser?.role || 'resident',
        is_active: dbUser?.is_active !== false, // Default to true if not in DB
        email_verified: firebaseUser.emailVerified,
        phone_verified: firebaseUser.phoneNumber ? true : false,
        created_at: firebaseUser.metadata.creationTime,
        last_login: firebaseUser.metadata.lastSignInTime,
        residency_status: dbUser?.residency_status || 'pending'
      };
    });

    console.log(`Returning ${combinedUsers.length} combined users`);

    res.json({
      success: true,
      users: combinedUsers,
      total: combinedUsers.length
    });

  } catch (error) {
    console.error('Error fetching Firebase users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Firebase users',
      details: error.message
    });
  }
});

// Protected resident signup management (officer only)
app.get('/api/auth/resident-signups/pending', verifyToken, checkRole(['captain', 'secretary', 'clerk']), authController.getPendingResidentSignups);
app.put('/api/auth/resident-signups/:request_id/review', verifyToken, checkRole(['captain', 'secretary', 'clerk']), authController.reviewResidentSignup);
app.get('/api/auth/resident-signups/stats', verifyToken, checkRole(['captain', 'secretary', 'clerk']), authController.getResidentSignupStats);

// Protected residency verification management
app.get('/api/auth/residency-verifications/pending', verifyToken, checkRole(['captain', 'secretary', 'clerk']), authController.getPendingResidencyVerifications);
app.put('/api/auth/residency-verifications/:request_id/review', verifyToken, checkRole(['captain', 'secretary', 'clerk']), authController.reviewResidencyVerification);
app.get('/api/auth/residency-verifications/status/:user_id', verifyToken, authController.getResidencyVerificationStatus);

// BLOB file retrieval endpoint - serve files stored in database
app.get('/api/auth/residency-verifications/:request_id/file', verifyFirebaseToken, async (req, res) => {
  try {
    const requestId = req.params.request_id;
    const firebaseUid = req.firebaseUser.uid;

    // Get the verification request to check ownership and file data
    const [rows] = await db.execute(`
      SELECT rvr.file_data, rvr.original_filename, rvr.mime_type, rvr.file_size, rvr.user_id, u.firebase_uid
      FROM resident_verification_requests rvr
      JOIN users u ON rvr.user_id = u.id
      WHERE rvr.id = ? AND rvr.status != 'rejected'
    `, [requestId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    const request = rows[0];

    // Check if user owns this verification request (or is staff)
    if (request.firebase_uid !== firebaseUid) {
      // Only allow officers to view files they review
      return res.status(403).json({ error: 'Access denied - not your verification request' });
    }

    if (!request.file_data) {
      return res.status(404).json({ error: 'No file attached to this verification request' });
    }

    // Set appropriate headers for file download/display
    const fileName = request.original_filename || 'verification_document.bin';
    const mimeType = request.mime_type || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    if (request.file_size) {
      res.setHeader('Content-Length', request.file_size);
    }

    // Send the BLOB data directly
    res.send(request.file_data);

  } catch (error) {
    console.error('Error retrieving BLOB file:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
});

// Officer endpoint to view resident verification files
app.get('/api/auth/residency-verifications/:request_id/file/officer', verifyToken, checkRole(['captain', 'secretary', 'clerk']), async (req, res) => {
  try {
    const requestId = req.params.request_id;

    // Get the verification request file data
    const [rows] = await db.execute(`
      SELECT file_data, original_filename, mime_type, file_size
      FROM resident_verification_requests
      WHERE id = ?
    `, [requestId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    const request = rows[0];

    if (!request.file_data) {
      return res.status(404).json({ error: 'No file attached to this verification request' });
    }

    // Set appropriate headers
    const fileName = request.original_filename || 'verification_document.bin';
    const mimeType = request.mime_type || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    if (request.file_size) {
      res.setHeader('Content-Length', request.file_size);
    }

    // Send the BLOB data directly
    res.send(request.file_data);

  } catch (error) {
    console.error('Error retrieving BLOB file for officer:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
});

// ==========================================
// PUBLIC STATS ENDPOINTS (No Auth Required)
// ==========================================

// Template stats endpoint - does not require authentication
app.get('/api/templates/stats', async (req, res) => {
  try {
    console.log('=== TEMPLATE STATS ROUTE CALLED ===');
    console.log('Template controller exists:', typeof templateController !== 'undefined');
    console.log('getTemplateStats exists:', typeof templateController?.getTemplateStats === 'function');

    if (typeof templateController?.getTemplateStats === 'function') {
      console.log('Calling getTemplateStats method...');
      await templateController.getTemplateStats(req, res);
    } else {
      console.log('ERROR: getTemplateStats method not found!');
      res.status(500).json({
        error: 'Template stats method not available',
        controller_loaded: typeof templateController !== 'undefined',
        method_exists: typeof templateController?.getTemplateStats === 'function'
      });
    }
  } catch (error) {
    console.log('ERROR in template stats route:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Certificate types endpoint - does not require authentication
app.get('/api/certificate-types', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        id,
        name,
        fee,
        validity_days,
        description,
        purpose,
        when_needed,
        required_data
      FROM certificate_types
      WHERE is_active = TRUE
      ORDER BY name
    `);

    console.log('Certificate types API called, found:', rows.length, 'types');

    // Parse JSON required_data for each certificate type
    const certificateTypes = rows.map(type => ({
      id: type.id,
      label: type.name, // Frontend expects 'label' property
      name: type.name,  // Keep both for compatibility
      fee: type.fee,
      validity_days: type.validity_days,
      description: type.description,
      purpose: type.purpose,
      when_needed: type.when_needed,
      required_data: type.required_data ? JSON.parse(type.required_data) : [],
      is_active: true
    }));

    // Return in the format expected by frontend
    res.json({
      success: true,
      data: certificateTypes
    });
  } catch (error) {
    console.error('Error fetching certificate types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificate types'
    });
  }
});

// ==========================================
// RESIDENT PROFILING MODULE (RBIM Enhanced)
// ==========================================

// Get all residents with RBIM data (protected - requires auth)
app.get('/api/residents', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk']), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, sitio_id, residency_status, show_vulnerable } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let values = [];

    if (search) {
      whereConditions.push('(r.First_Name LIKE ? OR r.Last_Name LIKE ? OR r.Mobile_Number LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (sitio_id) {
      whereConditions.push('h.Sitio_ID = ?');
      values.push(sitio_id);
    }

    if (residency_status) {
      whereConditions.push('r.Residency_Status = ?');
      values.push(residency_status);
    }

    if (show_vulnerable === 'true') {
      whereConditions.push('v.Vulnerability_Score > 0');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [rows] = await db.execute(`
      SELECT
        r.*,
        h.Household_Number,
        h.Street_Address,
        s.name as sitio_name,
        v.Is_4Ps,
        v.Is_PWD,
        v.Is_Senior,
        v.Is_Solo_Parent,
        v.Is_Out_of_School_Youth,
        v.Vulnerability_Score,
        v.Disability_Type
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      ${whereClause}
      ORDER BY r.Last_Name, r.First_Name
      LIMIT ? OFFSET ?
    `, [...values, parseInt(limit), offset]);

    const [totalRows] = await db.execute(`
      SELECT COUNT(*) as total
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      ${whereClause}
    `, values);

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRows[0].total,
        pages: Math.ceil(totalRows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

// Get resident by ID (RBIM enhanced) - protected with hierarchy check
app.get('/api/residents/:id', verifyToken, checkOwnershipOrHierarchy, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        r.*,
        h.Household_Number,
        h.Street_Address,
        h.Household_Type,
        s.name as sitio_name,
        v.Is_4Ps,
        v.Is_PWD,
        v.Is_Senior,
        v.Is_Solo_Parent,
        v.Is_Out_of_School_Youth,
        v.Vulnerability_Score,
        v.Disability_Type
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Resident_ID = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching resident:', error);
    res.status(500).json({ error: 'Failed to fetch resident' });
  }
});

// Duplicate checker (RBIM requirement)
app.post('/api/residents/check-duplicate', async (req, res) => {
  try {
    const { first_name, last_name, birthdate } = req.body;

    if (!first_name || !last_name || !birthdate) {
      return res.status(400).json({ error: 'First name, last name, and birthdate are required' });
    }

    const [duplicates] = await db.execute(`
      SELECT
        r.Resident_ID,
        r.First_Name,
        r.Last_Name,
        r.Birthdate,
        r.Residency_Status,
        h.Household_Number,
        s.name as sitio_name
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE r.First_Name = ? AND r.Last_Name = ? AND r.Birthdate = ?
      AND r.Residency_Status = 'Active'
    `, [first_name.trim(), last_name.trim(), birthdate]);

    res.json({
      is_duplicate: duplicates.length > 0,
      duplicates: duplicates,
      message: duplicates.length > 0 ?
        'Possible duplicate found. Please verify if this is the same person.' :
        'No duplicates found. Safe to proceed.'
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({ error: 'Failed to check for duplicates' });
  }
});

// Create new resident (RBIM enhanced) - protected with JWT
app.post('/api/residents', verifyToken, async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      household_id,
      relation_to_head,
      first_name,
      middle_name,
      last_name,
      suffix,
      birthdate,
      gender,
      civil_status,
      occupation,
      income_estimate,
      mobile_number,
      voter_status,
      date_arrival,
      profile_photo_url,
      // Vulnerability data
      is_4ps,
      is_pwd,
      is_solo_parent,
      is_out_of_school_youth,
      disability_type
    } = req.body;

    // Validation
    if (!first_name || !last_name || !birthdate || !household_id) {
      return res.status(400).json({ error: 'Required fields: first_name, last_name, birthdate, household_id' });
    }

    // Verify household exists
    const [householdCheck] = await connection.execute(
      'SELECT Household_ID FROM households WHERE Household_ID = ?',
      [household_id]
    );
    if (householdCheck.length === 0) {
      return res.status(400).json({ error: 'Invalid household_id - household does not exist' });
    }

    // Generate Resident_ID (UUID format)
    const residentId = `RES-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Generate QR Hash
    const qrHash = crypto.createHash('sha256')
      .update(`${residentId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    // Insert resident
    await connection.execute(`
      INSERT INTO residents (
        Resident_ID, Household_ID, Relation_to_Head, First_Name, Middle_Name, Last_Name, Suffix,
        Birthdate, Gender, Civil_Status, Occupation, Income_Estimate, Mobile_Number,
        Voter_Status, Date_Arrival, Residency_Status, Profile_Photo_URL, QR_Hash_String
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      residentId, household_id, relation_to_head || 'Head', first_name.trim(), middle_name?.trim(),
      last_name.trim(), suffix?.trim(), birthdate, gender, civil_status || 'Single',
      occupation?.trim(), income_estimate || 0, mobile_number?.trim(),
      voter_status || 'Non-Registered', date_arrival, 'Active',
      profile_photo_url?.trim(), qrHash
    ]);

    // Insert vulnerability data
    await connection.execute(`
      INSERT INTO vulnerabilities (
        Resident_ID, Is_4Ps, Is_PWD, Is_Solo_Parent, Is_Out_of_School_Youth, Disability_Type
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      residentId,
      is_4ps || false,
      is_pwd || false,
      is_solo_parent || false,
      is_out_of_school_youth || false,
      disability_type?.trim()
    ]);

    // Update household member count
    await connection.execute(`
      UPDATE households
      SET Total_Members = Total_Members + 1
      WHERE Household_ID = ?
    `, [household_id]);

    await connection.commit();

    res.status(201).json({
      resident_id: residentId,
      qr_hash: qrHash,
      message: 'Resident created successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating resident:', error);
    res.status(500).json({ error: 'Failed to create resident' });
  } finally {
    connection.release();
  }
});

// Update resident (RBIM enhanced)
app.put('/api/residents/:id', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const residentId = req.params.id;
    const {
      household_id,
      relation_to_head,
      first_name,
      middle_name,
      last_name,
      suffix,
      birthdate,
      gender,
      civil_status,
      occupation,
      income_estimate,
      mobile_number,
      voter_status,
      date_arrival,
      residency_status,
      profile_photo_url,
      // Vulnerability updates
      is_4ps,
      is_pwd,
      is_solo_parent,
      is_out_of_school_youth,
      disability_type
    } = req.body;

    // Update resident data
    const residentUpdates = [];
    const residentValues = [];

    if (household_id !== undefined) {
      residentUpdates.push('Household_ID = ?');
      residentValues.push(household_id);
    }
    if (relation_to_head !== undefined) {
      residentUpdates.push('Relation_to_Head = ?');
      residentValues.push(relation_to_head);
    }
    if (first_name !== undefined) {
      residentUpdates.push('First_Name = ?');
      residentValues.push(first_name.trim());
    }
    if (middle_name !== undefined) {
      residentUpdates.push('Middle_Name = ?');
      residentValues.push(middle_name?.trim());
    }
    if (last_name !== undefined) {
      residentUpdates.push('Last_Name = ?');
      residentValues.push(last_name.trim());
    }
    if (suffix !== undefined) {
      residentUpdates.push('Suffix = ?');
      residentValues.push(suffix?.trim());
    }
    if (birthdate !== undefined) {
      residentUpdates.push('Birthdate = ?');
      residentValues.push(birthdate);
    }
    if (gender !== undefined) {
      residentUpdates.push('Gender = ?');
      residentValues.push(gender);
    }
    if (civil_status !== undefined) {
      residentUpdates.push('Civil_Status = ?');
      residentValues.push(civil_status);
    }
    if (occupation !== undefined) {
      residentUpdates.push('Occupation = ?');
      residentValues.push(occupation?.trim());
    }
    if (income_estimate !== undefined) {
      residentUpdates.push('Income_Estimate = ?');
      residentValues.push(income_estimate);
    }
    if (mobile_number !== undefined) {
      residentUpdates.push('Mobile_Number = ?');
      residentValues.push(mobile_number?.trim());
    }
    if (voter_status !== undefined) {
      residentUpdates.push('Voter_Status = ?');
      residentValues.push(voter_status);
    }
    if (date_arrival !== undefined) {
      residentUpdates.push('Date_Arrival = ?');
      residentValues.push(date_arrival);
    }
    if (residency_status !== undefined) {
      residentUpdates.push('Residency_Status = ?');
      residentValues.push(residency_status);
    }
    if (profile_photo_url !== undefined) {
      residentUpdates.push('Profile_Photo_URL = ?');
      residentValues.push(profile_photo_url?.trim());
    }

    if (residentUpdates.length > 0) {
      const residentSql = `UPDATE residents SET ${residentUpdates.join(', ')} WHERE Resident_ID = ?`;
      residentValues.push(residentId);
      await connection.execute(residentSql, residentValues);
    }

    // Update vulnerability data
    const vulnUpdates = [];
    const vulnValues = [];

    if (is_4ps !== undefined) {
      vulnUpdates.push('Is_4Ps = ?');
      vulnValues.push(is_4ps);
    }
    if (is_pwd !== undefined) {
      vulnUpdates.push('Is_PWD = ?');
      vulnValues.push(is_pwd);
    }
    if (is_solo_parent !== undefined) {
      vulnUpdates.push('Is_Solo_Parent = ?');
      vulnValues.push(is_solo_parent);
    }
    if (is_out_of_school_youth !== undefined) {
      vulnUpdates.push('Is_Out_of_School_Youth = ?');
      vulnValues.push(is_out_of_school_youth);
    }
    if (disability_type !== undefined) {
      vulnUpdates.push('Disability_Type = ?');
      vulnValues.push(disability_type?.trim());
    }

    if (vulnUpdates.length > 0) {
      const vulnSql = `UPDATE vulnerabilities SET ${vulnUpdates.join(', ')} WHERE Resident_ID = ?`;
      vulnValues.push(residentId);
      await connection.execute(vulnSql, vulnValues);
    }

    await connection.commit();
    res.json({ message: 'Resident updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating resident:', error);
    res.status(500).json({ error: 'Failed to update resident' });
  } finally {
    connection.release();
  }
});

// Archive resident (Migration handler - RBIM requirement)
app.put('/api/residents/:id/archive', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const residentId = req.params.id;
    const { departure_date, departure_reason, destination } = req.body;

    // Update resident status
    await connection.execute(`
      UPDATE residents
      SET Residency_Status = 'Transferred Out',
          updated_at = CURRENT_TIMESTAMP
      WHERE Resident_ID = ?
    `, [residentId]);

    // Update household member count
    await connection.execute(`
      UPDATE households
      SET Total_Members = Total_Members - 1
      WHERE Household_ID = (SELECT Household_ID FROM residents WHERE Resident_ID = ?)
    `, [residentId]);

    // Log the migration (you could create a separate migration_log table)
    console.log(`Resident ${residentId} archived - Departure: ${departure_date}, Reason: ${departure_reason}, Destination: ${destination}`);

    await connection.commit();
    res.json({
      message: 'Resident archived successfully',
      status: 'Transferred Out'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error archiving resident:', error);
    res.status(500).json({ error: 'Failed to archive resident' });
  } finally {
    connection.release();
  }
});

// Bulk import residents (Excel/CSV parser)
app.post('/api/residents/bulk-import', uploadBlob.single('file'), async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const results = {
      imported: 0,
      skipped: 0,
      errors: [],
      duplicates: []
    };

    for (const row of data) {
      try {
        // Map Excel columns to database fields (adjust column names as needed)
        const residentData = {
          household_id: row['Household_ID'] || row['Household ID'],
          relation_to_head: row['Relation_to_Head'] || row['Relation to Head'] || 'Member',
          first_name: row['First_Name'] || row['First Name'],
          middle_name: row['Middle_Name'] || row['Middle Name'],
          last_name: row['Last_Name'] || row['Last Name'],
          suffix: row['Suffix'],
          birthdate: row['Birthdate'] || row['Date_of_Birth'] || row['DOB'],
          gender: row['Gender'],
          civil_status: row['Civil_Status'] || row['Civil Status'] || 'Single',
          occupation: row['Occupation'],
          income_estimate: parseFloat(row['Income_Estimate'] || row['Monthly_Income'] || '0'),
          mobile_number: row['Mobile_Number'] || row['Contact_Number'] || row['Phone'],
          voter_status: row['Voter_Status'] || row['Voter Status'] || 'Non-Registered',
          date_arrival: row['Date_Arrival'] || row['Date Arrived'] || new Date().toISOString().split('T')[0],
          is_4ps: row['Is_4Ps'] || row['4Ps_Member'] ? true : false,
          is_pwd: row['Is_PWD'] || row['PWD'] ? true : false,
          is_solo_parent: row['Is_Solo_Parent'] || row['Solo_Parent'] ? true : false,
          is_out_of_school_youth: row['Is_Out_of_School_Youth'] || row['OSY'] ? true : false,
          disability_type: row['Disability_Type'] || row['Disability Type']
        };

        // Check for duplicates
        const [duplicates] = await connection.execute(`
          SELECT Resident_ID FROM residents
          WHERE First_Name = ? AND Last_Name = ? AND Birthdate = ? AND Residency_Status = 'Active'
        `, [residentData.first_name, residentData.last_name, residentData.birthdate]);

        if (duplicates.length > 0) {
          results.duplicates.push({
            name: `${residentData.first_name} ${residentData.last_name}`,
            existing_id: duplicates[0].Resident_ID
          });
          results.skipped++;
          continue;
        }

        // Generate IDs and insert (similar to single insert logic)
        const residentId = `RES-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const qrHash = crypto.createHash('sha256')
          .update(`${residentId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`)
          .digest('hex')
          .substring(0, 16)
          .toUpperCase();

        await connection.execute(`
          INSERT INTO residents (
            Resident_ID, Household_ID, Relation_to_Head, First_Name, Middle_Name, Last_Name, Suffix,
            Birthdate, Gender, Civil_Status, Occupation, Income_Estimate, Mobile_Number,
            Voter_Status, Date_Arrival, Residency_Status, QR_Hash_String
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          residentId, residentData.household_id, residentData.relation_to_head,
          residentData.first_name, residentData.middle_name, residentData.last_name, residentData.suffix,
          residentData.birthdate, residentData.gender, residentData.civil_status,
          residentData.occupation, residentData.income_estimate, residentData.mobile_number,
          residentData.voter_status, residentData.date_arrival, 'Active', qrHash
        ]);

        await connection.execute(`
          INSERT INTO vulnerabilities (
            Resident_ID, Is_4Ps, Is_PWD, Is_Solo_Parent, Is_Out_of_School_Youth, Disability_Type
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          residentId, residentData.is_4ps, residentData.is_pwd,
          residentData.is_solo_parent, residentData.is_out_of_school_youth, residentData.disability_type
        ]);

        results.imported++;
      } catch (rowError) {
        results.errors.push({
          row: data.indexOf(row) + 2, // +2 because Excel is 1-indexed and has header
          error: rowError.message,
          data: row
        });
      }
    }

    await connection.commit();

    // Clean up uploaded file
    require('fs').unlinkSync(req.file.path);

    res.json({
      message: `Bulk import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors.length} errors`,
      results
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in bulk import:', error);
    res.status(500).json({ error: 'Failed to process bulk import' });
  } finally {
    connection.release();
  }
});

// Get household members
app.get('/api/households/:id/members', async (req, res) => {
  try {
    const [members] = await db.execute(`
      SELECT
        r.*,
        v.Is_4Ps,
        v.Is_PWD,
        v.Is_Senior,
        v.Is_Solo_Parent,
        v.Is_Out_of_School_Youth,
        v.Vulnerability_Score
      FROM residents r
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Household_ID = ?
      ORDER BY
        CASE r.Relation_to_Head
          WHEN 'Head' THEN 1
          WHEN 'Spouse' THEN 2
          ELSE 3
        END,
        r.Birthdate
    `, [req.params.id]);

    const [household] = await db.execute(`
      SELECT h.*, s.name as sitio_name
      FROM households h
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE h.Household_ID = ?
    `, [req.params.id]);

    if (household.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json({
      household: household[0],
      members: members
    });
  } catch (error) {
    console.error('Error fetching household members:', error);
    res.status(500).json({ error: 'Failed to fetch household members' });
  }
});

// Generate QR code for resident ID (RBIM enhanced)
app.post('/api/residents/:id/generate-qr', async (req, res) => {
  try {
    const residentId = req.params.id;

    // Generate unique QR code string (Barangay ID format)
    const qrString = `BARANGAY-ID-${residentId}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // Update resident with QR code
    await db.execute(
      'UPDATE residents SET QR_Hash_String = ? WHERE Resident_ID = ?',
      [qrString, residentId]
    );

    // Get updated resident data with household info
    const [residents] = await db.execute(`
      SELECT
        r.*,
        h.Household_Number,
        h.Street_Address,
        s.name as sitio_name,
        v.Vulnerability_Score
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Resident_ID = ?
    `, [residentId]);

    res.json({
      success: true,
      qr_code: qrString,
      resident: residents[0],
      message: 'QR code generated successfully for Barangay ID'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// ==========================================
// HOUSEHOLDS MANAGEMENT (RBIM)
// ==========================================

// Get all households
app.get('/api/households', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT h.*, s.name as sitio_name
      FROM households h
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      ORDER BY h.Household_Number
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching households:', error);
    res.status(500).json({ error: 'Failed to fetch households' });
  }
});

// Get household by ID
app.get('/api/households/:id', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT h.*, s.name as sitio_name
      FROM households h
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE h.Household_ID = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching household:', error);
    res.status(500).json({ error: 'Failed to fetch household' });
  }
});

// Create new household
app.post('/api/households', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { Household_Number, Sitio_ID, Street_Address, Household_Type } = req.body;

    // Validation
    if (!Household_Number || !Sitio_ID || !Street_Address) {
      return res.status(400).json({ error: 'Household_Number, Sitio_ID, and Street_Address are required' });
    }

    // Generate Household_ID
    const householdId = `H-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Insert household
    await connection.execute(`
      INSERT INTO households (
        Household_ID, Household_Number, Sitio_ID, Street_Address, Household_Type
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      householdId, Household_Number.trim(), Sitio_ID, Street_Address.trim(),
      Household_Type || 'Nuclear'
    ]);

    await connection.commit();

    res.status(201).json({
      household_id: householdId,
      message: 'Household created successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating household:', error);
    res.status(500).json({ error: 'Failed to create household' });
  } finally {
    connection.release();
  }
});

// Update household
app.put('/api/households/:id', async (req, res) => {
  try {
    const { Household_Number, Sitio_ID, Street_Address, Household_Type } = req.body;

    const updates = [];
    const values = [];

    if (Household_Number !== undefined) {
      updates.push('Household_Number = ?');
      values.push(Household_Number.trim());
    }
    if (Sitio_ID !== undefined) {
      updates.push('Sitio_ID = ?');
      values.push(Sitio_ID);
    }
    if (Street_Address !== undefined) {
      updates.push('Street_Address = ?');
      values.push(Street_Address.trim());
    }
    if (Household_Type !== undefined) {
      updates.push('Household_Type = ?');
      values.push(Household_Type);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const sql = `UPDATE households SET ${updates.join(', ')} WHERE Household_ID = ?`;
    values.push(req.params.id);

    await db.execute(sql, values);
    res.json({ message: 'Household updated successfully' });
  } catch (error) {
    console.error('Error updating household:', error);
    res.status(500).json({ error: 'Failed to update household' });
  }
});

// Delete household
app.delete('/api/households/:id', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const householdId = req.params.id;

    // Check if household has residents
    const [residents] = await connection.execute(
      'SELECT COUNT(*) as count FROM residents WHERE Household_ID = ?',
      [householdId]
    );

    if (residents[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete household with active residents. Archive residents first.'
      });
    }

    await connection.execute('DELETE FROM households WHERE Household_ID = ?', [householdId]);
    await connection.commit();

    res.json({ message: 'Household deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting household:', error);
    res.status(500).json({ error: 'Failed to delete household' });
  } finally {
    connection.release();
  }
});

// Get census statistics
app.get('/api/census', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT
        s.name as sitio_name,
        COUNT(r.Resident_ID) as total_residents,
        SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as pwd,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as single_parents
      FROM sitios s
      LEFT JOIN households h ON s.id = h.Sitio_ID
      LEFT JOIN residents r ON h.Household_ID = r.Household_ID
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    const [overall] = await db.execute(`
      SELECT
        COUNT(*) as total_residents,
        SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as total_pwd,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as total_single_parents
      FROM residents r
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
    `);

    res.json({
      bySitio: stats,
      overall: overall[0]
    });
  } catch (error) {
    console.error('Error fetching census:', error);
    res.status(500).json({ error: 'Failed to fetch census data' });
  }
});

// Analytics census endpoint (for Analytics page)
app.get('/api/analytics/census', async (req, res) => {
  try {
    const [bySitio] = await db.execute(`
      SELECT
        s.id as sitio_id,
        s.name as sitio_name,
        COUNT(r.Resident_ID) as total_residents,
        SUM(CASE WHEN r.Gender = 'Male' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN r.Gender = 'Female' THEN 1 ELSE 0 END) as total_women,
        SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as total_pwds,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as total_single_parents
      FROM sitios s
      LEFT JOIN households h ON s.id = h.Sitio_ID
      LEFT JOIN residents r ON h.Household_ID = r.Household_ID
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    const [overall] = await db.execute(`
      SELECT
        COUNT(*) as total_residents,
        SUM(CASE WHEN Gender = 'Male' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN Gender = 'Female' THEN 1 ELSE 0 END) as total_women,
        SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as total_pwds,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as total_single_parents
      FROM residents r
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
    `);

    res.json({
      bySitio,
      overall: overall[0]
    });
  } catch (error) {
    console.error('Error fetching analytics census:', error);
    res.status(500).json({ error: 'Failed to fetch analytics census data' });
  }
});

// ==========================================
// BLOTTER & INCIDENT REPORTING MODULE
// ==========================================

// Get all blotter records
app.get('/api/blotter', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT b.*,
             s.name as sitio_name
      FROM blotter b
      LEFT JOIN sitios s ON b.Location_Sitio = s.name
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching blotter:', error);
    res.status(500).json({ error: 'Failed to fetch blotter records' });
  }
});

// Create new blotter record (using new Katarungang Pambarangay schema)
app.post('/api/blotter', async (req, res) => {
  try {
    const {
      Case_Number,
      Complainant_Details,
      Respondent_Details,
      Incident_Type,
      Narrative,
      DateTime_Incident,
      Location_Sitio,
      Status
    } = req.body;

    // Validation
    if (!Complainant_Details || !Incident_Type || !Narrative || !Location_Sitio) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Generate case number if not provided
    let caseNumber = Case_Number;
    if (!caseNumber) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(4, '0');
      caseNumber = `BLOT-${year}-${month}-${sequence}`;
    }

    const [result] = await db.execute(`
      INSERT INTO blotter (
        Case_Number, Complainant_Details, Respondent_Details, Incident_Type,
        Narrative, DateTime_Incident, Location_Sitio, Status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      caseNumber,
      JSON.stringify(Complainant_Details),
      Respondent_Details ? JSON.stringify(Respondent_Details) : null,
      Incident_Type,
      Narrative,
      DateTime_Incident,
      Location_Sitio,
      Status || 'Pending'
    ]);

    res.status(201).json({
      id: result.insertId,
      Case_Number: caseNumber,
      message: 'Blotter record created successfully'
    });
  } catch (error) {
    console.error('Error creating blotter record:', error);
    res.status(500).json({ error: 'Failed to create blotter record' });
  }
});

// Update blotter record (using new schema)
app.put('/api/blotter/:caseNumber', async (req, res) => {
  try {
    const {
      Complainant_Details,
      Respondent_Details,
      Incident_Type,
      Narrative,
      DateTime_Incident,
      Location_Sitio,
      Status,
      Hearing_Schedule
    } = req.body;

    const updateFields = [];
    const values = [];

    if (Complainant_Details !== undefined) {
      updateFields.push('Complainant_Details = ?');
      values.push(JSON.stringify(Complainant_Details));
    }
    if (Respondent_Details !== undefined) {
      updateFields.push('Respondent_Details = ?');
      values.push(Respondent_Details ? JSON.stringify(Respondent_Details) : null);
    }
    if (Incident_Type !== undefined) {
      updateFields.push('Incident_Type = ?');
      values.push(Incident_Type);
    }
    if (Narrative !== undefined) {
      updateFields.push('Narrative = ?');
      values.push(Narrative);
    }
    if (DateTime_Incident !== undefined) {
      updateFields.push('DateTime_Incident = ?');
      values.push(DateTime_Incident);
    }
    if (Location_Sitio !== undefined) {
      updateFields.push('Location_Sitio = ?');
      values.push(Location_Sitio);
    }
    if (Status !== undefined) {
      updateFields.push('Status = ?');
      values.push(Status);
    }
    if (Hearing_Schedule !== undefined) {
      updateFields.push('Hearing_Schedule = ?');
      values.push(Hearing_Schedule);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const sql = `UPDATE blotter SET ${updateFields.join(', ')} WHERE Case_Number = ?`;
    values.push(req.params.caseNumber);

    await db.execute(sql, values);
    res.json({ message: 'Blotter record updated successfully' });
  } catch (error) {
    console.error('Error updating blotter record:', error);
    res.status(500).json({ error: 'Failed to update blotter record' });
  }
});

// Delete blotter record
app.delete('/api/blotter/:caseNumber', async (req, res) => {
  try {
    await db.execute('DELETE FROM blotter WHERE Case_Number = ?', [req.params.caseNumber]);
    res.json({ message: 'Blotter record deleted successfully' });
  } catch (error) {
    console.error('Error deleting blotter record:', error);
    res.status(500).json({ error: 'Failed to delete blotter record' });
  }
});

// ==========================================
// DOCUMENT REQUEST & GENERATION MODULE
// ==========================================

// Import document controller
const documentController = require('./documentController');

// Document type management
app.get('/api/documents/types', documentController.getDocumentTypes);

// Document request management
app.post('/api/documents/requests', documentController.createDocumentRequest);
app.get('/api/documents/requests', documentController.getDocumentRequests);
app.put('/api/documents/requests/:request_id/approve', documentController.approveDocumentRequest);
app.get('/api/documents/requests/:request_id/download', documentController.downloadDocument);

// Officer dashboard - pending requests
app.get('/api/documents/pending', documentController.getPendingRequests);

// QR validation
app.post('/api/documents/validate-qr', documentController.validateDocument);

// ==========================================
// DOCUMENT TEMPLATE MANAGEMENT MODULE
// ==========================================

// Import template controller
const templateController = require('./templateController');

console.log('=== TEMPLATE CONTROLLER DEBUG ===');
console.log('Template Controller loaded:', typeof templateController !== 'undefined');
console.log('Template Controller type:', typeof templateController);
if (templateController) {
  console.log('Controller has getTemplateStats:', typeof templateController.getTemplateStats === 'function');
  console.log('Controller methods:', Object.getOwnPropertyNames(templateController.constructor.prototype));
} else {
  console.log('TEMPLATE CONTROLLER IS UNDEFINED!');
}
console.log('=== END TEMPLATE CONTROLLER DEBUG ===\n');

// Template management routes (admin, captain, secretary access)
app.get('/api/templates', verifyToken, checkRole(['admin', 'captain', 'secretary']), templateController.getAllTemplates);
app.get('/api/templates/:id', verifyToken, checkRole(['admin', 'captain', 'secretary']), templateController.getTemplateById);
app.post('/api/templates', verifyToken, checkRole(['admin', 'captain']), templateController.createTemplate);
app.put('/api/templates/:id', verifyToken, checkRole(['admin', 'captain']), templateController.updateTemplate);
app.delete('/api/templates/:id', verifyToken, checkRole(['admin']), templateController.deleteTemplate);

// Certificate types management routes (admin, captain, secretary access)
app.get('/api/certificate-types', verifyToken, checkRole(['admin', 'captain', 'secretary']), templateController.getCertificateTypes);

// Template file upload/download routes
app.post('/api/templates/upload', verifyToken, checkRole(['admin', 'captain']), uploadBlob.single('template_file'), templateController.uploadTemplateFile);
app.delete('/api/templates/:id/with-file', verifyToken, checkRole(['admin']), templateController.deleteTemplateWithFile);
app.get('/api/templates/:id/download', verifyToken, checkRole(['admin', 'captain']), templateController.downloadTemplateFile);

// Template utilities (stats endpoint doesn't require authentication since it's just statistics)
app.get('/api/templates/active/:document_type', templateController.getActiveTemplate);
app.post('/api/templates/:id/duplicate', verifyToken, checkRole(['admin', 'captain']), templateController.duplicateTemplate);
// Template stats endpoint (public access for statistics)
app.get('/api/templates/stats', templateController.getTemplateStats);
app.get('/templates/stats', templateController.getTemplateStats);

// Debug routes removed - using browser console now

// ==========================================
// CERTIFICATE ISSUANCE MODULE
// ==========================================

// Get certificate types (from database - removed hardcoded data)
app.get('/api/certificate-types', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        id,
        name,
        fee,
        validity_days,
        description,
        purpose,
        when_needed,
        required_data
      FROM certificate_types
      WHERE is_active = TRUE
      ORDER BY name
    `);

    console.log('Certificate types API called, found:', rows.length, 'types');

    // Parse JSON required_data for each certificate type
    const certificateTypes = rows.map(type => ({
      id: type.id,
      label: type.name, // Frontend expects 'label' property
      name: type.name,  // Keep both for compatibility
      fee: type.fee,
      validity_days: type.validity_days,
      description: type.description,
      purpose: type.purpose,
      when_needed: type.when_needed,
      required_data: type.required_data ? JSON.parse(type.required_data) : [],
      is_active: true
    }));

    // Return in the format expected by frontend
    res.json({
      success: true,
      data: certificateTypes
    });
  } catch (error) {
    console.error('Error fetching certificate types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificate types'
    });
  }
});

// Get all certificates (supports both resident and staff with dynamic auth)
app.get('/api/certificates', (req, res, next) => {
  // Check for resident Firebase token first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    // Check if it looks like a Firebase ID token (longer than typical JWT)
    if (token && token.length > 500) {
      return verifyFirebaseToken(req, res, next); // Resident path
    }
  }
  // Default to JWT verification for staff (unrestricted access)
  return verifyToken(req, res, next);
}, async (req, res) => {
  try {
    // Check if user is a resident (Firebase authenticated)
    const isResident = req.firebaseUser ? true : false;

    let query, values;

    if (isResident && req.firebaseUser) {
      // Resident can only see their own certificates
      query = `
        SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
        FROM certificates_log c
        JOIN residents r ON c.resident_id = r.Resident_ID
        WHERE EXISTS (
          SELECT 1 FROM users u
          WHERE u.resident_id = r.Resident_ID
          AND u.firebase_uid = ?
        )
        ORDER BY c.created_at DESC
      `;
      values = [req.firebaseUser.uid];
    } else {
      // Staff can see all certificates
      query = `
        SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
        FROM certificates_log c
        JOIN residents r ON c.resident_id = r.Resident_ID
        ORDER BY c.created_at DESC
      `;
      values = [];
    }

    const [rows] = await db.execute(query, values);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Issue new certificate (supports both auto-fill and manual creation)
app.post('/api/certificates', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      resident_id,
      certificate_type_id,
      purpose,
      data,
      issued_by,
      status,
      fee_paid,
      // Manual certificate creation fields
      manual_certificate,
      resident_name,
      address,
      manual_purpose,
      certificate_type,
      issued_date,
      valid_until,
      control_number,
      signatory_captain,
      signatory_secretary,
      location
    } = req.body;

    // Check if this is manual certificate creation
    if (manual_certificate) {
      // Manual certificate creation - bypass standard validation
      console.log('Creating manual certificate for:', resident_name);

      // Generate control number if not provided
      const finalControlNo = control_number || `CERT-MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const [result] = await connection.execute(`
        INSERT INTO certificates_log (
          control_no, resident_id, certificate_type, purpose, data,
          date_issued, valid_until, status, fee_paid, issued_by,
          signatory_captain, signatory_secretary, location, is_manual
        ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
      `, [
        finalControlNo, certificate_type, manual_purpose || purpose,
        JSON.stringify({
          manual_resident_name: resident_name,
          manual_address: address,
          custom_data: data || {}
        }),
        issued_date || new Date().toISOString().split('T')[0],
        valid_until || null,
        status || 'approved',
        fee_paid || 0,
        issued_by || 1,
        signatory_captain || 'Captain Juan Dela Cruz',
        signatory_secretary || 'Secretary Maria Santos',
        location || 'Barangay Batia, Bocaue, Bulacan'
      ]);

      await connection.commit();

      res.status(201).json({
        id: result.insertId,
        control_no: finalControlNo,
        message: 'Manual certificate created successfully',
        type: 'manual'
      });

      return;
    }

    // Standard auto-fill certificate creation
    if (!resident_id || isNaN(resident_id)) {
      return res.status(400).json({ error: 'Valid resident_id is required' });
    }

    if (!certificate_type_id || isNaN(certificate_type_id)) {
      return res.status(400).json({ error: 'Valid certificate_type_id is required' });
    }

    if (!purpose || purpose.trim().length === 0) {
      return res.status(400).json({ error: 'Purpose is required' });
    }

    // Verify resident exists
    const [residentCheck] = await connection.execute('SELECT Resident_ID FROM residents WHERE Resident_ID = ?', [resident_id]);
    if (residentCheck.length === 0) {
      return res.status(400).json({ error: 'Resident not found' });
    }

    // Get certificate type name from database
    const [certTypeRows] = await connection.execute(
      'SELECT name FROM certificate_types WHERE id = ? AND is_active = TRUE',
      [certificate_type_id]
    );

    if (certTypeRows.length === 0) {
      return res.status(400).json({ error: 'Invalid certificate type' });
    }

    const certificate_type_name = certTypeRows[0].name;

    // CRITICAL BUSINESS RULE: Check blotter before issuing clearance or good moral certificates
    // As per survey requirements - block issuance for residents with active blotter cases
    if (certificate_type_name === 'Barangay Clearance' || certificate_type_name === 'Good Moral') {
      const [blotterCheck] = await connection.execute(`
        SELECT COUNT(*) as active_cases,
               GROUP_CONCAT(case_number) as case_numbers,
               GROUP_CONCAT(incident_type) as incident_types
        FROM blotter
        WHERE respondent_id = ? AND status = 'Pending'
      `, [resident_id]);

      if (blotterCheck[0].active_cases > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'BLOCK ISSUANCE: Active blotter case found for this resident',
          details: {
            caseCount: blotterCheck[0].active_cases,
            caseNumbers: blotterCheck[0].case_numbers,
            incidentTypes: blotterCheck[0].incident_types,
            message: 'Cannot issue clearance certificate while resident has pending blotter cases'
          }
        });
      }
    }

    // Generate certificate number with transaction safety
    const controlNo = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const [result] = await connection.execute(`
      INSERT INTO certificates_log (
        control_no, resident_id, certificate_type, purpose,
        date_issued, status,
        signatory_captain, signatory_secretary
      ) VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?)
    `, [
      controlNo, resident_id, certificate_type_name, purpose.trim(),
      status || 'Released',
      'Captain Juan Dela Cruz', 'Secretary Maria Santos'
    ]);

    await connection.commit();

    res.status(201).json({
      id: result.insertId,
      control_no: controlNo,
      message: 'Certificate issued successfully',
      type: 'standard'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error issuing certificate:', error);
    res.status(500).json({ error: 'Failed to issue certificate' });
  } finally {
    connection.release();
  }
});

// ==========================================
// AI INTEGRATION MODULE
// ==========================================

// AI Service proxy helper function
async function proxyToAIService(endpoint, data, method = 'POST') {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    const url = `${aiServiceUrl}${endpoint}`;

    const config = {
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000 // 30 second timeout
    };

    if (data && method !== 'GET') {
      config.data = data;
    } else if (data && method === 'GET') {
      // For GET requests, add query parameters
      const params = new URLSearchParams(data);
      config.url = `${url}?${params}`;
    }

    const response = await axios(url, config);
    return response.data;
  } catch (error) {
    console.error(`AI Service proxy error for ${endpoint}:`, error.message);
    throw error;
  }
}

// Social Aid Priority
app.post('/api/ai/priority', async (req, res) => {
  try {
    const { resident_id } = req.body;

    // Get resident data
    const [residents] = await db.execute('SELECT * FROM residents WHERE Resident_ID = ?', [resident_id]);
    if (residents.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    const resident = residents[0];

    // Call AI service
    const aiResponse = await proxyToAIService('/suggest-aid', {
      monthly_income: resident.Income_Estimate,
      age: resident.age || calculateAge(resident.Birthdate),
      is_senior: resident.is_senior || (calculateAge(resident.Birthdate) >= 60),
      is_pwd: resident.is_pwd || false,
      is_single_parent: resident.is_single_parent || false,
      employment_status: resident.employment_status || 'unemployed',
      sitio_name: resident.sitio_name || 'Unknown'
    });

    res.json({
      resident_id,
      resident_name: `${resident.First_Name} ${resident.Last_Name}`,
      ...aiResponse
    });
  } catch (error) {
    console.error('AI service error:', error.message);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// AI Priority Score (for Social Aid page)
app.post('/api/ai/priority-score', async (req, res) => {
  try {
    const { resident_id } = req.body;

    // Get resident data
    const [residents] = await db.execute('SELECT * FROM residents WHERE Resident_ID = ?', [resident_id]);
    if (residents.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    const resident = residents[0];

    try {
      // Try AI service first
      const aiResponse = await proxyToAIService('/suggest-aid', {
        monthly_income: resident.Income_Estimate || 0,
        age: calculateAge(resident.Birthdate),
        is_senior: calculateAge(resident.Birthdate) >= 60,
        is_pwd: resident.is_pwd || false,
        is_single_parent: resident.is_single_parent || false,
        employment_status: resident.employment_status || 'unemployed',
        sitio_name: resident.sitio_name || 'Unknown'
      });

      res.json({
        data: aiResponse,
        fallback: false
      });
    } catch (aiError) {
      console.error('AI service error, using fallback:', aiError.message);
      // Fallback calculation
      const income = resident.Income_Estimate || 0;
      const age = calculateAge(resident.Birthdate);
      const isSenior = age >= 60;
      const isPwd = resident.is_pwd || false;
      const isSingleParent = resident.is_single_parent || false;

      let priority = 'MEDIUM';
      let score = 50;
      let reasons = [];

      if (income < 10000 || isSenior || isPwd) {
        priority = 'HIGH';
        score = 80;
        if (income < 10000) reasons.push('Low monthly income (below ₱10,000)');
        if (isSenior) reasons.push('Senior citizen status');
        if (isPwd) reasons.push('Person with disability');
      } else if (income > 20000) {
        priority = 'LOW';
        score = 25;
        reasons.push('High income');
      } else {
        if (isSingleParent) reasons.push('Single parent household');
        reasons.push('Moderate income level');
      }

      res.json({
        data: {
          priority,
          score,
          reasons,
          final_score: score,
          urgency: priority === 'HIGH' ? 'Fast-tracked assistance needed' : 'Scheduled assistance appropriate'
        },
        fallback: true
      });
    }
  } catch (error) {
    console.error('Priority calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate priority score' });
  }
});

// Predictive Patrol Suggestions
app.get('/api/ai/patrol-suggestions', async (req, res) => {
  try {
    // Get recent blotter data (last 30 days for better analysis)
    const [blotterData] = await db.execute(`
      SELECT b.*, s.name as sitio_name
      FROM blotter b
      LEFT JOIN sitios s ON b.Location_Sitio = s.name
      WHERE b.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY b.created_at DESC
      LIMIT 50
    `);

    // Try AI service first
    try {
      const aiResponse = await proxyToAIService('/suggest-patrol', {
        blotter_data: blotterData
      });
      res.json(aiResponse);
    } catch (aiError) {
      console.error('AI service error, using fallback:', aiError.message);

      // Fallback mock response
      const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const overallRisk = riskLevels[Math.floor(Math.random() * riskLevels.length)];

      res.json({
        overall_risk_level: overallRisk,
        risk_assessment: {
          total_incidents: blotterData.length,
          high_risk_sitios: ['Batia Proper', 'Northville 5'],
          peak_hours: '8PM-2AM',
          trend: 'STABLE'
        },
        patrol_suggestions: [
          'Increase patrol presence in Batia Proper during evening hours',
          'Focus on theft prevention in Northville 5 commercial areas',
          'Monitor noise complaints in residential zones',
          'Establish additional checkpoints at high-traffic areas',
          'Coordinate with local PNP for joint patrols'
        ],
        recommended_schedule: {
          priority_areas: ['Batia Proper', 'Northville 5', 'St. Martha'],
          suggested_tanods: 8,
          shift_coverage: '18:00-06:00'
        },
        generated_at: new Date().toISOString(),
        fallback: true
      });
    }
  } catch (dbError) {
    console.error('Database error in patrol suggestions:', dbError.message);

    // Complete fallback when database is unavailable
    res.json({
      overall_risk_level: 'MEDIUM',
      risk_assessment: {
        total_incidents: 0,
        high_risk_sitios: ['Batia Proper'],
        peak_hours: '20:00-02:00',
        trend: 'UNKNOWN'
      },
      patrol_suggestions: [
        'Conduct regular evening patrols in main commercial areas',
        'Monitor high-traffic zones for potential incidents',
        'Establish community watch programs',
        'Increase visibility in residential neighborhoods',
        'Coordinate with local law enforcement'
      ],
      recommended_schedule: {
        priority_areas: ['Batia Proper', 'Northville 5'],
        suggested_tanods: 6,
        shift_coverage: '19:00-05:00'
      },
      generated_at: new Date().toISOString(),
      fallback: true,
      db_error: true
    });
  }
});

// Analytics endpoints - proxy to AI service with fallbacks
app.get('/api/analytics/dashboard-summary', async (req, res) => {
  try {
    const summary = await proxyToAIService('/analytics/dashboard-summary', {}, 'GET');
    res.json(summary);
  } catch (error) {
    console.error('Analytics dashboard error, using fallback:', error.message);
    // Fallback mock data
    res.json({
      total_incidents_30d: 28,
      active_cases: 5,
      high_risk_areas: ["Batia Proper", "Northville 5"],
      trend_direction: "STABLE",
      forecast_next_week: 8,
      response_time_avg: "12 minutes",
      coverage_percentage: 78,
      generated_at: new Date().toISOString()
    });
  }
});

app.get('/api/analytics/charts/:chart_type', async (req, res) => {
  try {
    const { chart_type } = req.params;
    const chartData = await proxyToAIService(`/analytics/charts/${chart_type}`, {}, 'GET');
    res.json(chartData);
  } catch (error) {
    console.error(`Analytics chart error for ${req.params.chart_type}, using fallback:`, error.message);

    const { chart_type } = req.params;

    // Provide fallback chart data based on type
    let fallbackData = {};

    if (chart_type === 'incident_trends') {
      const dates = Array.from({length: 30}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });

      fallbackData = {
        labels: dates,
        datasets: [{
          label: "Daily Incidents",
          data: Array.from({length: 30}, () => Math.floor(Math.random() * 6)),
          borderColor: "#1DB954",
          backgroundColor: "rgba(29, 185, 84, 0.1)",
          tension: 0.4
        }]
      };
    } else if (chart_type === 'incident_types') {
      fallbackData = {
        labels: ["Physical Injury", "Theft", "Unjust Vexation", "Malicious Mischief", "Other"],
        datasets: [{
          label: "Incidents by Type",
          data: [8, 6, 4, 3, 7],
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]
        }]
      };
    } else if (chart_type === 'sitio_distribution') {
      fallbackData = {
        labels: ["Batia Proper", "Northville 5", "St. Martha", "AFP/PNP"],
        datasets: [{
          label: "Incidents by Sitio",
          data: [12, 8, 5, 3],
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]
        }]
      };
    } else if (chart_type === 'hourly_patterns') {
      fallbackData = {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        datasets: [{
          label: "Incidents by Hour",
          data: Array.from({length: 24}, () => Math.floor(Math.random() * 4)),
          borderColor: "#1DB954",
          backgroundColor: "rgba(29, 185, 84, 0.1)",
          fill: true
        }]
      };
    }

    res.json(fallbackData);
  }
});

app.post('/api/analytics/generate-report', async (req, res) => {
  try {
    const reportData = await proxyToAIService('/analytics/generate-report', req.body);
    res.json(reportData);
  } catch (error) {
    console.error('Analytics report generation error, using fallback:', error.message);

    // Fallback mock report
    const reportType = req.body?.report_type || 'incident_analysis';
    const mockReports = {
      incident_analysis: {
        report_type: "incident_analysis",
        generated_at: new Date().toISOString(),
        date_range: { start: "2025-11-12", end: "2025-12-12", days: 30 },
        metrics: {
          total_incidents: 28,
          incidents_by_type: { "Physical Injury": 8, "Theft": 6, "Unjust Vexation": 4 },
          incidents_by_sitio: { "Batia Proper": 12, "Northville 5": 8, "St. Martha": 5, "AFP/PNP": 3 },
          average_daily_incidents: 0.93
        },
        insights: ["Average of 0.9 incidents per day", "Most common: Physical Injury (8 cases)"],
        recommendations: ["Increase patrol presence", "Focus on high-risk areas"]
      },
      trend_analysis: {
        report_type: "trend_analysis",
        metrics: { trend_direction: "STABLE", total_period_incidents: 28 },
        insights: ["Incident rates are stable", "Consistent daily patterns"],
        recommendations: ["Maintain current patrol levels"]
      }
    };

    res.json(mockReports[reportType] || mockReports.incident_analysis);
  }
});

// Chatbot endpoints - proxy to AI service with fallbacks
app.post('/api/ai/chatbot/message', async (req, res) => {
  try {
    const chatbotResponse = await proxyToAIService('/chatbot/message', req.body);
    res.json(chatbotResponse);
  } catch (error) {
    console.error('Chatbot error, using fallback:', error.message);

    const userMessage = req.body?.message?.toLowerCase() || '';
    let response = "I'm here to help with barangay services. How can I assist you today?";
    let intent = "general_inquiry";

    // Simple fallback responses based on keywords
    if (userMessage.includes('certificate') || userMessage.includes('clearance')) {
      response = "For barangay clearance, you need: valid ID, proof of residency, cedula, and P50 fee. Would you like to schedule an appointment?";
      intent = "certificate_inquiry";
    } else if (userMessage.includes('blotter') || userMessage.includes('report')) {
      response = "To file a blotter report, please come to the barangay office with your valid ID and any supporting evidence. I can help you schedule an appointment.";
      intent = "blotter_inquiry";
    } else if (userMessage.includes('appointment') || userMessage.includes('schedule')) {
      response = "I can help you schedule an appointment. What type of service do you need?";
      intent = "appointment_request";
    } else if (userMessage.includes('hours') || userMessage.includes('open')) {
      response = "Our barangay office is open Monday-Friday 8AM-5PM, Saturday 8AM-12NN.";
      intent = "faq";
    }

    res.json({
      response: response,
      intent: intent,
      confidence: 0.8,
      actions: [],
      appointment_booked: false,
      requires_followup: false,
      timestamp: new Date().toISOString()
    });
  }
});

// ==========================================
// TANOD SCHEDULE MODULE
// ==========================================

// Get tanod schedules
app.get('/api/tanod-schedules', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT t.*, s.name as sitio_name
      FROM tanod_schedule t
      LEFT JOIN sitios s ON t.sitio_id = s.id
      ORDER BY t.shift_date DESC, t.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tanod schedules:', error);
    res.status(500).json({ error: 'Failed to fetch tanod schedules' });
  }
});

// Create tanod schedule
app.post('/api/tanod-schedules', async (req, res) => {
  try {
    const { patrol_area, sitio_id, number_of_tanods, shift_time, shift_date, notes } = req.body;

    const [result] = await db.execute(`
      INSERT INTO tanod_schedule (
        patrol_area, sitio_id, number_of_tanods, shift_time, shift_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [patrol_area, sitio_id, number_of_tanods, shift_time, shift_date, notes]);

    res.status(201).json({ id: result.insertId, message: 'Tanod schedule created successfully' });
  } catch (error) {
    console.error('Error creating tanod schedule:', error);
    res.status(500).json({ error: 'Failed to create tanod schedule' });
  }
});

// ==========================================
// USER MANAGEMENT MODULE (Secretary and above)
// ==========================================

// Get all users (admin management)
app.get('/api/users', verifyToken, checkRole(['admin', 'captain', 'secretary']), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role: roleFilter, status } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let values = [];

    if (search) {
      whereConditions.push("(full_name LIKE ? OR username LIKE ? OR email LIKE ?)");
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (roleFilter) {
      whereConditions.push("role = ?");
      values.push(roleFilter);
    }

    if (status) {
      if (status === 'active') {
        whereConditions.push("is_active = true");
      } else if (status === 'inactive') {
        whereConditions.push("is_active = false");
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [rows] = await db.execute(`
      SELECT
        id,
        username,
        full_name,
        email,
        contact_number,
        role,
        is_active,
        firebase_uid,
        resident_id,
        last_login,
        created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...values, parseInt(limit), offset]);

    const [totalRows] = await db.execute(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, values);

    res.json({
      users: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRows[0].total,
        pages: Math.ceil(totalRows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
app.get('/api/users/:id', verifyToken, checkRole(['admin', 'captain', 'secretary']), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        id,
        username,
        full_name,
        email,
        contact_number,
        role,
        is_active,
        firebase_uid,
        resident_id,
        last_login,
        created_at,
        updated_at
      FROM users WHERE id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
app.post('/api/users', verifyToken, checkRole(['admin', 'captain', 'secretary']), async (req, res) => {
  try {
    const {
      username,
      full_name,
      email,
      contact_number,
      role,
      is_active = true
    } = req.body;

    // Validation
    if (!username || !full_name || !role) {
      return res.status(400).json({ error: 'Username, full name, and role are required' });
    }

    // Check if username already exists
    const [existing] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(tempPassword, saltRounds);

    const [result] = await db.execute(`
      INSERT INTO users (
        username,
        password_hash,
        full_name,
        email,
        contact_number,
        role,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [username, passwordHash, full_name, email, contact_number, role, is_active]);

    res.status(201).json({
      user: {
        id: result.insertId,
        username,
        full_name,
        email,
        contact_number,
        role,
        is_active,
        temp_password: tempPassword // Send temp password to admin for sharing
      },
      message: 'User created successfully. Temporary password generated.'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
app.put('/api/users/:id', verifyToken, checkRole(['admin', 'captain', 'secretary']), async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      full_name,
      email,
      contact_number,
      role,
      is_active
    } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (contact_number !== undefined) {
      updates.push('contact_number = ?');
      values.push(contact_number);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add updated_at
    updates.push('updated_at = NOW()');

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    values.push(userId);

    await db.execute(sql, values);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Toggle user active status
app.put('/api/users/:id/toggle-status', verifyToken, checkRole(['admin', 'captain', 'secretary']), async (req, res) => {
  try {
    const userId = req.params.id;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({ error: 'is_active value is required' });
    }

    await db.execute(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active, userId]
    );

    res.json({
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Reset user password
app.put('/api/users/:id/reset-password', verifyToken, checkRole(['admin', 'captain', 'secretary']), async (req, res) => {
  try {
    const userId = req.params.id;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(new_password, saltRounds);

    await db.execute(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, userId]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete user
app.delete('/api/users/:id', verifyToken, checkRole(['admin', 'captain', 'secretary']), async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deletion of current user
    if (req.user.id == userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user has active residents (optional - you may want to prevent or handle this)
    const [residents] = await db.execute('SELECT COUNT(*) as count FROM users WHERE id = ? AND resident_id IS NOT NULL', [userId]);

    if (residents[0].count > 0) {
      // Option 1: Prevent deletion
      // return res.status(400).json({ error: 'Cannot delete user with associated resident record' });

      // Option 2: Update resident record (remove association)
      await db.execute('UPDATE users SET resident_id = NULL WHERE id = ?', [userId]);
    }

    await db.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==========================================
// UTILITY ENDPOINTS
// ==========================================

// Get sitios
app.get('/api/sitios', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM sitios ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sitios:', error);
    res.status(500).json({ error: 'Failed to fetch sitios' });
  }
});

app.get('/sitios', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM sitios ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sitios:', error);
    res.status(500).json({ error: 'Failed to fetch sitios' });
  }
});

// Households routes
app.get('/households', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT h.*, s.name as sitio_name
      FROM households h
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      ORDER BY h.Household_Number
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching households:', error);
    res.status(500).json({ error: 'Failed to fetch households' });
  }
});

// Residents routes
app.get('/residents', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk']), async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let values = [];

    if (search && search.trim()) {
      whereClause = 'WHERE r.First_Name LIKE ? OR r.Last_Name LIKE ? OR r.Mobile_Number LIKE ?';
      const searchTerm = `%${search.trim()}%`;
      values = [searchTerm, searchTerm, searchTerm];
    }

    // Build the final parameter array
    const params = [...values, parseInt(limit), offset];

    console.log(`Residents query - search: ${search}, params length: ${params.length}, whereClause: ${whereClause}`); // Debug log

    const [rows] = await db.execute(`
      SELECT
        r.*,
        h.Household_Number,
        h.Street_Address,
        s.name as sitio_name,
        v.Is_4Ps,
        v.Is_PWD,
        v.Is_Senior,
        v.Is_Solo_Parent,
        v.Is_Out_of_School_Youth,
        v.Vulnerability_Score
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      ${whereClause}
      ORDER BY r.Last_Name, r.First_Name
      LIMIT ? OFFSET ?
    `, params);

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

// Templates routes
app.get('/templates', verifyToken, checkRole(['admin', 'captain', 'secretary']), templateController.getAllTemplates);

// Certificate types route (duplicate for non-API prefix)
app.get('/certificate-types', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        id,
        name,
        fee,
        validity_days,
        description,
        purpose,
        when_needed,
        required_data
      FROM certificate_types
      WHERE is_active = TRUE
      ORDER BY name
    `);

    console.log('Certificate types API called, found:', rows.length, 'types');

    const certificateTypes = rows.map(type => ({
      id: type.id,
      label: type.name,
      name: type.name,
      fee: type.fee,
      validity_days: type.validity_days,
      description: type.description,
      purpose: type.purpose,
      when_needed: type.when_needed,
      required_data: type.required_data ? JSON.parse(type.required_data) : [],
      is_active: true
    }));

    res.json({
      success: true,
      data: certificateTypes
    });
  } catch (error) {
    console.error('Error fetching certificate types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificate types'
    });
  }
});

// Template stats route (duplicate for non-API prefix)
app.get('/templates/stats', async (req, res) => {
  console.log('=== TEMPLATE STATS ROUTE (non-API) CALLED ===');
  console.log('Template controller exists:', typeof templateController !== 'undefined');
  console.log('getTemplateStats exists:', typeof templateController?.getTemplateStats === 'function');

  try {
    if (typeof templateController?.getTemplateStats === 'function') {
      console.log('Calling getTemplateStats method...');
      await templateController.getTemplateStats(req, res);
    } else {
      console.log('ERROR: getTemplateStats method not found!');
      res.status(500).json({
        error: 'Template stats method not available',
        controller_loaded: typeof templateController !== 'undefined',
        method_exists: typeof templateController?.getTemplateStats === 'function'
      });
    }
  } catch (error) {
    console.log('ERROR in template stats route:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// AI Patrol Suggestions route
app.get('/ai/patrol-suggestions', async (req, res) => {
  try {
    // Get recent blotter data (last 30 days for better analysis)
    const [blotterData] = await db.execute(`
      SELECT b.*, s.name as sitio_name
      FROM blotter b
      LEFT JOIN sitios s ON b.Location_Sitio = s.name
      WHERE b.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY b.created_at DESC
      LIMIT 50
    `);

    // Try AI service first
    try {
      const aiResponse = await proxyToAIService('/suggest-patrol', {
        blotter_data: blotterData
      });
      res.json(aiResponse);
    } catch (aiError) {
      console.error('AI service error, using fallback:', aiError.message);

      // Fallback mock response
      const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const overallRisk = riskLevels[Math.floor(Math.random() * riskLevels.length)];

      res.json({
        overall_risk_level: overallRisk,
        risk_assessment: {
          total_incidents: blotterData.length,
          high_risk_sitios: ['Batia Proper', 'Northville 5'],
          peak_hours: '8PM-2AM',
          trend: 'STABLE'
        },
        patrol_suggestions: [
          'Increase patrol presence in Batia Proper during evening hours',
          'Focus on theft prevention in Northville 5 commercial areas',
          'Monitor noise complaints in residential zones',
          'Establish additional checkpoints at high-traffic areas',
          'Coordinate with local PNP for joint patrols'
        ],
        recommended_schedule: {
          priority_areas: ['Batia Proper', 'Northville 5', 'St. Martha'],
          suggested_tanods: 8,
          shift_coverage: '18:00-06:00'
        },
        generated_at: new Date().toISOString(),
        fallback: true
      });
    }
  } catch (dbError) {
    console.error('Database error in patrol suggestions:', dbError.message);

    // Complete fallback when database is unavailable
    res.json({
      overall_risk_level: 'MEDIUM',
      risk_assessment: {
        total_incidents: 0,
        high_risk_sitios: ['Batia Proper'],
        peak_hours: '20:00-02:00',
        trend: 'UNKNOWN'
      },
      patrol_suggestions: [
        'Conduct regular evening patrols in main commercial areas',
        'Monitor high-traffic zones for potential incidents',
        'Establish community watch programs',
        'Increase visibility in residential neighborhoods',
        'Coordinate with local law enforcement'
      ],
      recommended_schedule: {
        priority_areas: ['Batia Proper', 'Northville 5'],
        suggested_tanods: 6,
        shift_coverage: '19:00-05:00'
      },
      generated_at: new Date().toISOString(),
      fallback: true,
      db_error: true
    });
  }
});

app.get('/auth/firebase-users', verifyToken, checkRole(['admin', 'captain', 'secretary']), async (req, res) => {
  try {
    console.log('=== FETCHING FIREBASE USERS (non-API route) ===');

    // Get Firebase users using Admin SDK
    const firebaseUsers = [];
    let nextPageToken;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      firebaseUsers.push(...listUsersResult.users);
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`Found ${firebaseUsers.length} Firebase users`);

    // Get corresponding database records for enhanced info
    const [dbUsersRows] = await db.execute(`
      SELECT firebase_uid, full_name, email, role, is_active, created_at, last_login, residency_status
      FROM users
      WHERE firebase_uid IS NOT NULL
    `);
    const dbUsers = dbUsersRows;

    // Create a map for quick lookup
    const dbUserMap = {};
    dbUsers.forEach(dbUser => {
      dbUserMap[dbUser.firebase_uid] = dbUser;
    });

    // Combine Firebase and database data
    const combinedUsers = firebaseUsers.map(firebaseUser => {
      const dbUser = dbUserMap[firebaseUser.uid];
      const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0];

      return {
        id: firebaseUser.uid,
        firebase_uid: firebaseUser.uid,
        username: displayName,
        full_name: dbUser?.full_name || displayName,
        email: firebaseUser.email,
        role: dbUser?.role || 'resident',
        is_active: dbUser?.is_active !== false, // Default to true if not in DB
        email_verified: firebaseUser.emailVerified,
        phone_verified: firebaseUser.phoneNumber ? true : false,
        created_at: firebaseUser.metadata.creationTime,
        last_login: firebaseUser.metadata.lastSignInTime,
        residency_status: dbUser?.residency_status || 'pending'
      };
    });

    console.log(`Returning ${combinedUsers.length} combined users`);

    res.json({
      success: true,
      users: combinedUsers,
      total: combinedUsers.length
    });

  } catch (error) {
    console.error('Error fetching Firebase users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Firebase users',
      details: error.message
    });
  }
});

// Residency verifications routes (non-API prefix)
app.get('/auth/residency-verifications/pending', verifyToken, checkRole(['captain', 'secretary', 'clerk']), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [rows] = await db.execute(`
      SELECT
        rvr.*,
        users.username,
        users.full_name,
        users.email
      FROM resident_verification_requests rvr
      JOIN users ON rvr.user_id = users.id
      WHERE rvr.status = 'pending'
      ORDER BY rvr.submitted_at ASC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);

    const formattedRequests = rows.map(row => ({
      request_id: row.request_id,
      user_id: row.user_id,
      username: row.username,
      full_name: row.full_name,
      email: row.email,
      proof_type: row.proof_type,
      proof_path: row.proof_path, // Use correct column name
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
});

app.put('/auth/residency-verifications/:request_id/review', verifyToken, checkRole(['captain', 'secretary', 'clerk']), async (req, res) => {
  // Use connection instead of knex transaction
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
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
    const [rows] = await connection.execute(
      'SELECT * FROM resident_verification_requests WHERE request_id = ? AND status = ?',
      [request_id, 'pending']
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Verification request not found or already processed.'
      });
    }

    const verificationRequest = rows[0];
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update verification request
    await connection.execute(`
      UPDATE resident_verification_requests
      SET status = ?, reviewed_at = NOW(), reviewed_by = ?, review_notes = ?, updated_at = NOW()
      WHERE request_id = ?
    `, [newStatus, reviewed_by, review_notes, request_id]);

    if (action === 'approve') {
      // Update user residency status
      await connection.execute(`
        UPDATE users
        SET residency_status = ?, residency_verified_at = NOW(), residency_verified_by = ?, updated_at = NOW()
        WHERE id = ?
      `, ['verified', reviewed_by, verificationRequest.user_id]);

      // Log the approval
      try {
        await connection.execute(`
          INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `, [
          reviewed_by,
          'RESIDENCY_VERIFICATION_APPROVED',
          'resident_verification_request',
          request_id,
          JSON.stringify({
            user_id: verificationRequest.user_id,
            request_id: request_id
          })
        ]);
      } catch (logError) {
        console.log('⚠️ Failed to log approval:', logError.message);
      }

      await connection.commit();

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
      await connection.commit();

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
    await connection.rollback();
    console.error('Error reviewing residency verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process verification review'
    });
  } finally {
    connection.release();
  }
});

// AI Patrol Suggestions route (non-API prefix - this is what client is calling)
app.get('/ai/patrol-suggestions', async (req, res) => {
  try {
    // Get recent blotter data (last 30 days for better analysis)
    const [blotterData] = await db.execute(`
      SELECT b.*, s.name as sitio_name
      FROM blotter b
      LEFT JOIN sitios s ON b.Location_Sitio = s.name
      WHERE b.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY b.created_at DESC
      LIMIT 50
    `);

    // Try AI service first
    try {
      const aiResponse = await proxyToAIService('/suggest-patrol', {
        blotter_data: blotterData
      });
      res.json(aiResponse);
    } catch (aiError) {
      console.error('AI service error, using fallback:', aiError.message);

      // Fallback mock response
      const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const overallRisk = riskLevels[Math.floor(Math.random() * riskLevels.length)];

      res.json({
        overall_risk_level: overallRisk,
        risk_assessment: {
          total_incidents: blotterData.length,
          high_risk_sitios: ['Batia Proper', 'Northville 5'],
          peak_hours: '8PM-2AM',
          trend: 'STABLE'
        },
        patrol_suggestions: [
          'Increase patrol presence in Batia Proper during evening hours',
          'Focus on theft prevention in Northville 5 commercial areas',
          'Monitor noise complaints in residential zones',
          'Establish additional checkpoints at high-traffic areas',
          'Coordinate with local PNP for joint patrols'
        ],
        recommended_schedule: {
          priority_areas: ['Batia Proper', 'Northville 5', 'St. Martha'],
          suggested_tanods: 8,
          shift_coverage: '18:00-06:00'
        },
        generated_at: new Date().toISOString(),
        fallback: true
      });
    }
  } catch (dbError) {
    console.error('Database error in patrol suggestions:', dbError.message);

    // Complete fallback when database is unavailable
    res.json({
      overall_risk_level: 'MEDIUM',
      risk_assessment: {
        total_incidents: 0,
        high_risk_sitios: ['Batia Proper'],
        peak_hours: '20:00-02:00',
        trend: 'UNKNOWN'
      },
      patrol_suggestions: [
        'Conduct regular evening patrols in main commercial areas',
        'Monitor high-traffic zones for potential incidents',
        'Establish community watch programs',
        'Increase visibility in residential neighborhoods',
        'Coordinate with local law enforcement'
      ],
      recommended_schedule: {
        priority_areas: ['Batia Proper', 'Northville 5'],
        suggested_tanods: 6,
        shift_coverage: '19:00-05:00'
      },
      generated_at: new Date().toISOString(),
      fallback: true,
      db_error: true
    });
  }
});

// Analytics dashboard summary route (non-API prefix)
app.get('/analytics/dashboard-summary', async (req, res) => {
  try {
    const summary = await proxyToAIService('/analytics/dashboard-summary', {}, 'GET');
    res.json(summary);
  } catch (error) {
    console.error('Analytics dashboard error, using fallback:', error.message);
    // Fallback mock data
    res.json({
      total_incidents_30d: 28,
      active_cases: 5,
      high_risk_areas: ["Batia Proper", "Northville 5"],
      trend_direction: "STABLE",
      forecast_next_week: 8,
      response_time_avg: "12 minutes",
      coverage_percentage: 78,
      generated_at: new Date().toISOString()
    });
  }
});

// Programs route (community events)
app.get('/programs', (req, res, next) => {
  // Check for resident Firebase token first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    // Check if it looks like a Firebase ID token (longer than typical JWT)
    if (token && token.length > 500) {
      return verifyFirebaseToken(req, res, next); // Resident path - programs are public
    }
  }
  // Default to JWT verification for staff (required for access)
  return verifyToken(req, res, next);
}, async (req, res) => {
  try {
    // Programs are public information for residents - no filtering needed
    const [rows] = await db.execute(`
      SELECT p.*,
             s.name as sitio_name,
             JSON_LENGTH(p.target_beneficiaries) as target_count
      FROM community_programs p
      LEFT JOIN sitios s ON p.sitio_id = s.id
      ORDER BY p.program_date DESC, p.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// ==========================================
// QR CODE & ID SYSTEM
// ==========================================

// Generate QR code for resident ID
app.post('/api/residents/:id/generate-qr', async (req, res) => {
  try {
    const residentId = req.params.id;

    // Generate unique QR code string
    const qrString = `BARANGAY-ID-${residentId}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // Update resident with QR code
    await db.execute(
      'UPDATE residents SET qr_code_string = ? WHERE Resident_ID = ?',
      [qrString, residentId]
    );

    // Get updated resident data
    const [residents] = await db.execute(`
      SELECT r.*, s.name as sitio_name
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE r.Resident_ID = ?
    `, [residentId]);

    res.json({
      success: true,
      qr_code: qrString,
      resident: residents[0],
      message: 'QR code generated successfully'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Generate QR code for certificate
app.post('/api/certificates/:id/generate-qr', async (req, res) => {
  try {
    const certificateId = req.params.id;

    // Generate unique QR validation hash
    const qrHash = crypto.createHash('sha256')
      .update(`CERT-${certificateId}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
      .digest('hex')
      .substring(0, 32)
      .toUpperCase();

    // Update certificate with QR hash
    await db.execute(
      'UPDATE certificates_log SET qr_validation_string = ? WHERE id = ?',
      [qrHash, certificateId]
    );

    res.json({
      success: true,
      qr_hash: qrHash,
      verification_url: `${req.protocol}://${req.get('host')}/verify-qr/${qrHash}`,
      message: 'QR code generated successfully'
    });
  } catch (error) {
    console.error('Error generating certificate QR:', error);
    res.status(500).json({ error: 'Failed to generate certificate QR' });
  }
});

// Public QR verification endpoint
app.get('/verify-qr/:hash', async (req, res) => {
  try {
    const qrHash = req.params.hash;

    // Check if hash exists in certificates_log
    const [certificates] = await db.execute(`
      SELECT c.*,
             CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name,
             r.Mobile_Number as contact_number,
             s.name as sitio_name
      FROM certificates_log c
      JOIN residents r ON c.resident_id = r.Resident_ID
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE c.qr_validation_string = ? AND c.status = 'Released'
    `, [qrHash]);

    if (certificates.length > 0) {
      const cert = certificates[0];
      res.json({
        status: 'VALID',
        type: 'certificate',
        certificate: {
          number: cert.control_no,
          type: cert.certificate_type,
          resident_name: cert.resident_name,
          sitio: cert.sitio_name,
          issued_date: cert.date_issued,
          signatory_captain: cert.signatory_captain,
          signatory_secretary: cert.signatory_secretary
        },
        message: 'Certificate is valid and authentic'
      });
    } else {
      // Check if hash exists in residents (Barangay ID)
      const [residents] = await db.execute(`
        SELECT r.*,
               s.name as sitio_name
        FROM residents r
        LEFT JOIN sitios s ON r.sitio_id = s.id
        WHERE r.qr_identity_hash = ?
      `, [qrHash]);

      if (residents.length > 0) {
        const resident = residents[0];
        res.json({
          status: 'VALID',
          type: 'barangay_id',
          resident: {
            name: `${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`.trim(),
            sitio: resident.sitio_name,
            age: resident.age,
            address: resident.address,
            contact: resident.mobile_number
          },
          message: 'Barangay ID is valid and authentic'
        });
      } else {
        res.json({
          status: 'INVALID',
          message: 'QR code not found or invalid. This document may be counterfeit.'
        });
      }
    }
  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Verification service temporarily unavailable'
    });
  }
});

// ==========================================
// COMMUNITY EVENTS MODULE
// ==========================================

// Get all community programs/events (supports both resident and staff with dynamic auth)
app.get('/api/programs', (req, res, next) => {
  // Check for resident Firebase token first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    // Check if it looks like a Firebase ID token (longer than typical JWT)
    if (token && token.length > 500) {
      return verifyFirebaseToken(req, res, next); // Resident path - programs are public
    }
  }
  // Default to JWT verification for staff (required for access)
  return verifyToken(req, res, next);
}, async (req, res) => {
  try {
    // Programs are public information for residents - no filtering needed
    const [rows] = await db.execute(`
      SELECT p.*,
             s.name as sitio_name,
             JSON_LENGTH(p.target_beneficiaries) as target_count
      FROM community_programs p
      LEFT JOIN sitios s ON p.sitio_id = s.id
      ORDER BY p.program_date DESC, p.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Create new community program/event - Secretary and above
app.post('/api/programs', verifyToken, checkRole(['admin', 'captain', 'secretary']), async (req, res) => {
  try {
    const {
      program_name,
      description,
      program_date,
      sitio_id,
      target_beneficiaries,
      status,
      organizer,
      budget_allocated,
      notes
    } = req.body;

    const [result] = await db.execute(`
      INSERT INTO community_programs (
        program_name, description, program_date, sitio_id,
        target_beneficiaries, status, organizer, budget_allocated, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      program_name, description, program_date, sitio_id,
      JSON.stringify(target_beneficiaries || []), status || 'Planned', organizer, budget_allocated || 0, notes
    ]);

    res.status(201).json({
      id: result.insertId,
      message: 'Community program created successfully'
    });
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({ error: 'Failed to create program' });
  }
});

// Update community program/event - Secretary and above
app.put('/api/programs/:id', verifyToken, checkRole(['admin', 'captain', 'secretary']), async (req, res) => {
  try {
    const {
      program_name,
      description,
      program_date,
      sitio_id,
      target_beneficiaries,
      status,
      organizer,
      budget_allocated,
      actual_cost,
      participants_count,
      success_rating,
      notes
    } = req.body;

    await db.execute(`
      UPDATE community_programs SET
        program_name = ?, description = ?, program_date = ?, sitio_id = ?,
        target_beneficiaries = ?, status = ?, organizer = ?, budget_allocated = ?,
        actual_cost = ?, participants_count = ?, success_rating = ?, notes = ?
      WHERE id = ?
    `, [
      program_name, description, program_date, sitio_id,
      JSON.stringify(target_beneficiaries || []), status, organizer, budget_allocated,
      actual_cost, participants_count, success_rating, notes,
      req.params.id
    ]);

    res.json({ message: 'Program updated successfully' });
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(500).json({ error: 'Failed to update program' });
  }
});

// Add resident to community program
app.post('/api/programs/:id/add-participant', async (req, res) => {
  try {
    const { resident_id } = req.body;
    const programId = req.params.id;

    // Get current program
    const [programs] = await db.execute(
      'SELECT * FROM community_programs WHERE id = ?',
      [programId]
    );

    if (programs.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const program = programs[0];
    let participants_count = program.participants_count || 0;
    participants_count += 1;

    // Update program
    await db.execute(
      'UPDATE community_programs SET participants_count = ? WHERE id = ?',
      [participants_count, programId]
    );

    res.json({ message: 'Participant added successfully' });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// ==========================================
// SMS NOTIFICATION SYSTEM
// ==========================================

// SMS stub function (ready for Twilio/Semaphore integration)
function sendSMS(mobile, message) {
  // For now, just log the SMS (replace with actual SMS service)
  const timestamp = new Date().toISOString();
  console.log(`📱 [${timestamp}] SMS to ${mobile}: ${message}`);

  // TODO: Integrate with actual SMS service
  // Example with Twilio:
  // const twilio = require('twilio');
  // const client = twilio(accountSid, authToken);
  // return client.messages.create({
  //   body: message,
  //   from: '+1234567890',
  //   to: mobile
  // });

  return {
    success: true,
    message: 'SMS logged (integration ready)',
    timestamp: timestamp,
    recipient: mobile,
    content: message
  };
}

// Send SMS notification
app.post('/api/sms/send', async (req, res) => {
  try {
    const { mobile, message, resident_id } = req.body;

    // If resident_id provided, get mobile from database
    let targetMobile = mobile;
    if (resident_id && !mobile) {
      const [residents] = await db.execute(
        'SELECT Mobile_Number FROM residents WHERE Resident_ID = ?',
        [resident_id]
      );
      if (residents.length > 0 && residents[0].Mobile_Number) {
        targetMobile = residents[0].Mobile_Number;
      } else {
        return res.status(400).json({ error: 'Resident has no mobile number on record' });
      }
    }

    if (!targetMobile) {
      return res.status(400).json({ error: 'Mobile number required' });
    }

    // Send SMS (currently just logs)
    const smsResult = sendSMS(targetMobile, message);

    res.json({
      success: true,
      sms_result: smsResult,
      message: 'SMS notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

// Bulk SMS to community program participants (simplified - using participants_count)
app.post('/api/programs/:id/notify-participants', async (req, res) => {
  try {
    const { message } = req.body;
    const programId = req.params.id;

    // Get program details
    const [programs] = await db.execute(`
      SELECT p.program_name, p.participants_count, p.sitio_id
      FROM community_programs p
      WHERE p.id = ?
    `, [programId]);

    if (programs.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const program = programs[0];

    if (program.participants_count === 0) {
      return res.status(400).json({ error: 'No participants in this program' });
    }

    // Get resident mobile numbers from the sitio
    const [participantData] = await db.execute(`
      SELECT Resident_ID as id, Mobile_Number as mobile_number, CONCAT(First_Name, ' ', Last_Name) as name
      FROM residents
      WHERE sitio_id = ?
      AND Mobile_Number IS NOT NULL
      AND Mobile_Number != ''
      LIMIT ?
    `, [program.sitio_id, program.participants_count]);

    // Send SMS to participants
    const smsResults = [];
    for (const participant of participantData) {
      const personalizedMessage = message.replace('{name}', participant.name);
      const smsResult = sendSMS(participant.mobile_number, personalizedMessage);
      smsResults.push({
        resident_id: participant.id,
        name: participant.name,
        mobile: participant.mobile_number,
        sms_result: smsResult
      });
    }

    res.json({
      success: true,
      program_name: program.program_name,
      total_participants: program.participants_count,
      sms_sent: smsResults.length,
      results: smsResults,
      message: `SMS notifications sent to ${smsResults.length} participants`
    });
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    res.status(500).json({ error: 'Failed to send bulk SMS' });
  }
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Enhanced health check with monitoring
app.get('/health', async (req, res) => {
  try {
    const { checks, isHealthy } = await healthCheck(db);
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(checks);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      service: 'Barangay Management API',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// ==========================================
// PDF GENERATION MODULE
// ==========================================

// Generate Barangay Clearance PDF (placeholder implementation)
app.get('/generate-clearance/:residentId', verifyToken, async (req, res) => {
  try {
    const { residentId } = req.params;

    // Get resident data
    const [residents] = await db.execute(`
      SELECT
        r.*,
        h.Household_Number,
        h.Street_Address,
        s.name as sitio_name
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE r.Resident_ID = ?
    `, [residentId]);

    if (residents.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    const resident = residents[0];
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create PDF document in memory (not saved to disk)
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Barangay_Clearance_${residentId}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // TODO: REPLACE THIS BLOCK WITH FINAL CERTIFICATE DESIGN LATER

    // Simple placeholder design - centered text only
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Title
    doc.fontSize(24).font('Helvetica-Bold');
    const title = 'BARANGAY CLEARANCE CERTIFICATE';
    const titleWidth = doc.widthOfString(title);
    doc.text(title, (pageWidth - titleWidth) / 2, 100);

    // Certificate content in center
    doc.fontSize(14).font('Helvetica');
    const contentY = pageHeight / 2 - 50;

    doc.text(`Resident Name: ${resident.First_Name} ${resident.Last_Name}`, (pageWidth - 400) / 2, contentY);
    doc.text(`Date: ${currentDate}`, (pageWidth - 400) / 2, contentY + 30);
    doc.text(`Purpose: General Clearance`, (pageWidth - 400) / 2, contentY + 60);

    // Footer
    doc.fontSize(10).font('Helvetica-Oblique');
    const footer = 'This is a placeholder certificate. Final design will be implemented later.';
    const footerWidth = doc.widthOfString(footer);
    doc.text(footer, (pageWidth - footerWidth) / 2, pageHeight - 100);

    // End document
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Add error handling middleware
app.use(errorHandler);

// ==========================================
// NOTIFICATION REST ENDPOINTS
// ==========================================

// Poll for notifications (fallback when WebSocket unavailable)
app.get('/api/notifications/poll', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user notifications using the getUserNotifications function from websocket module
    const websocketModule = require('./websocket');
    const notifications = await websocketModule.getUserNotifications(userId);

    // Return latest 10 notifications
    const recentNotifications = notifications.slice(0, 10);

    res.json({
      success: true,
      notifications: recentNotifications,
      count: recentNotifications.length,
      hasUnread: recentNotifications.some(n => !n.read)
    });
  } catch (error) {
    console.error('Error polling notifications:', error);
    res.status(500).json({ error: 'Failed to poll notifications' });
  }
});

// ==========================================
// START SERVER
// ==========================================
const startServer = async () => {
  // Determine if HTTPS should be enabled
  // NOTE: Railway only supports HTTP - disable HTTPS for Railway deployments
  const isRailway = process.env.RAILWAY_STATIC_URL !== undefined;
  const enableHTTPS = !isRailway && (process.env.NODE_ENV === 'production' || process.env.ENABLE_HTTPS === 'true');

  console.log('🔧 Server Configuration:');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   ENABLE_HTTPS:', process.env.ENABLE_HTTPS);
  console.log('   isRailway:', isRailway);
  console.log('   HTTPS enabled:', enableHTTPS);

  // Start server (HTTP or HTTPS based on configuration)
  let server;

  // For Railway deployments, always use HTTP only
  if (isRailway) {
    server = app.listen(port, () => {
      console.log(`🚢 Railway HTTP Server started on port ${port}`);
      console.log(`📊 Database: ${process.env.DB_NAME || 'barangay_management'}`);
      console.log(`🤖 AI Service: ${process.env.AI_SERVICE_URL || 'http://localhost:5000'}`);
      console.log(`🔍 QR Verification: http://localhost:${port}/verify-qr/{hash}`);
      console.log(`🔔 Real-time Notifications: WebSocket enabled`);
    });
  } else if (enableHTTPS) {
    // HTTPS server with SSL certificates
    const httpsOptions = sslConfig.getHttpsOptions();

    if (httpsOptions) {
      const https = require('https');
      server = https.createServer(httpsOptions, app).listen(port, () => {
        console.log('🔒 HTTPS server enabled with SSL certificates');
        console.log(`🚀 Barangay Management Server running on https://localhost:${port}`);
        console.log(`📊 Database: ${process.env.DB_NAME || 'barangay_management'}`);
        console.log(`🤖 AI Service: ${process.env.AI_SERVICE_URL || 'http://localhost:5000'}`);
        console.log(`🔍 QR Verification: https://localhost:${port}/verify-qr/{hash}`);
        console.log(`🔔 Real-time Notifications: WebSocket enabled`);
      });
    } else {
      console.log('⚠️ HTTPS requested but SSL certificates not available, falling back to HTTP');
      server = app.listen(port, () => {
        console.log(`🚀 Barangay Management Server running on http://localhost:${port}`);
        console.log(`📊 Database: ${process.env.DB_NAME || 'barangay_management'}`);
        console.log(`🤖 AI Service: ${process.env.AI_SERVICE_URL || 'http://localhost:5000'}`);
        console.log(`🔍 QR Verification: http://localhost:${port}/verify-qr/{hash}`);
        console.log('⚠️  WARNING: Running on HTTP (not secure) - set NODE_ENV=production or ENABLE_HTTPS=true for HTTPS');
        console.log(`🔔 Real-time Notifications: WebSocket enabled`);
      });
    }
  } else {
    // HTTP server for development
    server = app.listen(port, () => {
      console.log(`🚀 Barangay Management Server running on http://localhost:${port}`);
      console.log(`📊 Database: ${process.env.DB_NAME || 'barangay_management'}`);
      console.log(`🤖 AI Service: ${process.env.AI_SERVICE_URL || 'http://localhost:5000'}`);
      console.log(`🔍 QR Verification: http://localhost:${port}/verify-qr/{hash}`);
      console.log('⚠️  WARNING: Running on HTTP (not secure) - set NODE_ENV=production or ENABLE_HTTPS=true for HTTPS');
      console.log(`🔔 Real-time Notifications: WebSocket enabled`);
    });
  }

  // Initialize WebSocket server
  initializeWebSocket(server);
};

startServer();

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

// Note: Graceful shutdown handlers would go here, but since the server variable is now inside startServer(),
// they would need to be implemented differently in a production environment.
// For now, we'll rely on the process terminating naturally.
