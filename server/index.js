require('dotenv').config();

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
    logger.error('Missing required environment variables', { missingVars: missingRequiredVars });
    missingRequiredVars.forEach(varName => {
      logger.error(`Missing variable: ${varName}`);
    });
    logger.error('Please create a .env file with the required variables');
    process.exit(1);
  }

  logger.info('Environment variables validated successfully');
}

// Validate environment variables on startup
validateEnvironmentVariables();

// Import authentication system
const authController = require('./controllers/authController');
const residentController = require('./controllers/residentController');
const householdController = require('./controllers/householdController');
const userController = require('./controllers/userController');
const adminController = require('./controllers/adminController');
const blotterController = require('./controllers/blotterController');
const certificateController = require('./controllers/certificateController');
const { ROLES } = require('./config/roles');
const {
  verifyToken,
  checkRole,
  checkHierarchyAccess,
  checkOwnershipOrHierarchy
} = require('./middleware/authMiddleware');
const { errorHandler: globalErrorHandler } = require('./middleware/errorHandler');

// Import JWT middleware for document requests (consolidated to authMiddleware)
const { verifyToken: verifyTokenJWT } = require('./middleware/authMiddleware');

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

// Rate limiting - Updated to express-rate-limit v7 syntax
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

// Stricter rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // limit each IP to 10 requests per windowMs for sensitive operations
  message: {
    error: 'Too many sensitive operations, please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

// Strict rate limiting for authentication endpoints (anti-brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // limit each IP to 5 authentication attempts per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Replacement for onLimitReached - modern handler function
  handler: (req, res, next, options) => {
    // Log the warning
    logger.warn('Rate limit exceeded for authentication', { ip: req.ip });
    // Return the standard response
    res.status(options.statusCode).send(options.message);
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

logger.info('CORS Configuration', {
  nodeEnv: process.env.NODE_ENV,
  clientUrl: process.env.CLIENT_URL,
  corsOrigin: process.env.CORS_ORIGIN,
  filteredOrigins: corsOrigins
});

// SIMPLIFIED CORS CONFIGURATION - Force deploy with minimal config
logger.info('DEPLOYMENT_CORS_CHECK', { timestamp: new Date().toISOString() });

// CRITICAL FIX: GLOBAL CORS BEFORE ANY ROUTES
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow ALL Netlify domains in production
    if (process.env.NODE_ENV === 'production' && origin && origin.includes('netlify.app')) {
      logger.info('GLOBAL_CORS_ALLOW', { origin, timestamp: new Date().toISOString() });
      return callback(null, true);
    }

    // Allow localhost in development
    if (process.env.NODE_ENV !== 'production' && origin && (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      corsOrigins.includes(origin)
    )) {
      return callback(null, true);
    }

    // Production-specific domains
    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn('GLOBAL_CORS_DENY', { origin, timestamp: new Date().toISOString() });
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// SECOND CORs LAYER: SPECIFIC API ROUTE HANDLING
app.use('/api/*', cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow ALL Netlify domains in production for API routes
    if (process.env.NODE_ENV === 'production' && origin && origin.includes('netlify.app')) {
      logger.info('API_CORS_ALLOW', { origin, timestamp: new Date().toISOString() });
      return callback(null, true);
    }

    // Allow localhost in development
    if (process.env.NODE_ENV !== 'production' && origin && (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      corsOrigins.includes(origin)
    )) {
      return callback(null, true);
    }

    // Production-specific domains
    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn('API_CORS_DENY', { origin, timestamp: new Date().toISOString() });
    return callback(new Error('API access denied by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Handle OPTIONS preflight for ALL routes
app.options('*', cors({
  origin: function (origin, callback) {
    // Allow all preflight requests for Netlify
    if (process.env.NODE_ENV === 'production' && (!origin || origin.includes('netlify.app'))) {
      return callback(null, true);
    }
    // Allow localhost in development
    if (process.env.NODE_ENV !== 'production' && (!origin ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      corsOrigins.includes(origin)
    )) {
      return callback(null, true);
    }
    return callback(new Error('Preflight request denied'));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Add debug middleware to log all incoming requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;

  logger.info('Incoming Request', {
    timestamp,
    method,
    url
  });

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    logger.info('Response', { timestamp, method, url, statusCode: res.statusCode });
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

app.use(express.json({ limit: '1mb', strict: true })); // Limit payload size to 1MB
app.use(express.urlencoded({ extended: true, limit: '1mb', parameterLimit: 1000 })); // Limit URL-encoded data
app.use((req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 1048576) {
    return res.status(413).json({ error: 'Request entity too large' });
  }
  next();
});
app.use(requestLogger);

// CSRF Protection enabled for state-changing operations
const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

// CSRF token endpoint for frontend
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

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

// ==========================================
// THEMIS CLEARPASS ORGANIZED ROUTES
// ==========================================

// Import organized routes
const themisRoutes = require('./routes');

// Apply strict auth rate limiting to authentication endpoints
app.use('/api/auth', authLimiter);

// Mount THEMIS ClearPass role-based routes at /api
app.use('/api', themisRoutes);

// DEBUG: Direct admin route test
app.get('/api/admin/test', (req, res) => {
  logger.info('ADMIN TEST ROUTE HIT');
  res.json({ message: 'Admin routes are working', timestamp: new Date().toISOString() });
});

// ==========================================
// IT ADMIN REPORTS ENDPOINTS
// ==========================================

// Users Report
app.get('/api/admin/reports/users', verifyToken, checkRole(['admin']), adminController.getUsersReport);
app.get('/api/admin/reports/blotter', verifyToken, checkRole(['admin']), adminController.getBlotterReport);
app.get('/api/admin/reports/certificates', verifyToken, checkRole(['admin']), adminController.getCertificatesReport);
app.get('/api/admin/reports/residents', verifyToken, checkRole(['admin']), adminController.getResidentsReport);
app.get('/api/admin/reports/system', verifyToken, checkRole(['admin']), adminController.getSystemReport);
app.get('/api/admin/reports/security', verifyToken, checkRole(['admin']), adminController.getSecurityReport);
// ==========================================
// DETAILED ADMIN REPORTS ENDPOINTS (for table data)
// ==========================================

// Detailed Users Report
app.get('/api/admin/reports/detailed/users', verifyToken, checkRole(['admin']), adminController.getDetailedUsersReport);
app.get('/api/admin/reports/detailed/blotter', verifyToken, checkRole(['admin']), adminController.getDetailedBlotterReport);
app.get('/api/admin/reports/detailed/certificates', verifyToken, checkRole(['admin']), adminController.getDetailedCertificatesReport);
app.get('/api/admin/reports/detailed/residents', verifyToken, checkRole(['admin']), adminController.getDetailedResidentsReport);
app.get('/api/admin/reports/detailed/security', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    logger.info('Admin Reports: Generating detailed security report');

    const { dateFrom, dateTo, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // For now, return mock security events data
    // In a real implementation, this would query audit logs, security events, etc.
    const mockSecurityEvents = [
      {
        id: 1,
        event_type: 'login_success',
        user_id: 1,
        username: 'admin',
        ip_address: '192.168.1.100',
        user_agent: 'Chrome/91.0',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        details: 'Successful login'
      },
      {
        id: 2,
        event_type: 'login_failure',
        user_id: null,
        username: 'unknown',
        ip_address: '10.0.0.5',
        user_agent: 'Firefox/89.0',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        details: 'Invalid credentials'
      },
      {
        id: 3,
        event_type: 'admin_access',
        user_id: 1,
        username: 'admin',
        ip_address: '192.168.1.100',
        user_agent: 'Chrome/91.0',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        details: 'Accessed admin reports'
      }
    ];

    // Apply filtering
    let filteredEvents = mockSecurityEvents;

    if (dateFrom) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= dateFrom);
    }
    if (dateTo) {
      filteredEvents = filteredEvents.filter(event => event.timestamp <= dateTo + ' 23:59:59');
    }
    if (search) {
      filteredEvents = filteredEvents.filter(event =>
        event.username?.toLowerCase().includes(search.toLowerCase()) ||
        event.event_type?.toLowerCase().includes(search.toLowerCase()) ||
        event.ip_address?.includes(search)
      );
    }

    // Apply pagination
    const total = filteredEvents.length;
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    const report = {
      columns: ['Event ID', 'Event Type', 'User', 'IP Address', 'Timestamp', 'Details'],
      data: paginatedEvents.map(event => [
        event.id,
        event.event_type.replace('_', ' ').toUpperCase(),
        event.username || 'N/A',
        event.ip_address,
        new Date(event.timestamp).toLocaleString(),
        event.details
      ]),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      },
      generated_at: new Date().toISOString(),
      report_type: 'detailed_security'
    };

    logger.info('Admin Reports: Detailed security report generated', { eventCount: paginatedEvents.length });
    res.json(report);
  } catch (error) {
    logger.error('Admin Reports: Error generating detailed security report', { error });
    res.status(500).json({
      error: 'Failed to generate detailed security report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});



// Apply rate limiting
app.use('/api/certificates', strictLimiter); // Certificate operations are sensitive
app.use('/api/residents', apiLimiter);
app.use('/api/blotter', apiLimiter);
app.use('/api/', apiLimiter);

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
logger.info('Database Configuration', {
  dbHost: process.env.DB_HOST,
  mysqlHost: process.env.MYSQL_HOST,
  dbUser: process.env.DB_USER,
  mysqlUsername: process.env.MYSQL_USERNAME,
  dbName: process.env.DB_NAME,
  mysqlDatabase: process.env.MYSQL_DATABASE,
  resolvedHost: dbConfig.host,
  resolvedUser: dbConfig.user,
  resolvedDatabase: dbConfig.database,
  resolvedPort: dbConfig.port,
  hasPassword: !!dbConfig.password
});

let db;
async function initializeDatabase() {
  try {
    db = await mysql.createPool(dbConfig);
    app.locals.db = db; // Make db accessible to controllers
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', { error });
    process.exit(1);
  }
}

// Initialize database on startup
initializeDatabase().then(async () => {
  // Initialize cache service
  const { cacheService } = require('./utils/cache');
  await cacheService.connect();

  // Mount modular routes AFTER database is initialized
  const adminRoutes = require('./routes/adminRoutes')(db);
  const residentRoutes = require('./routes/residentRoutes')(db);
  const certificateRoutes = require('./routes/certificateRoutes')(db);
  const blotterRoutes = require('./routes/blotterRoutes')(db);
  const censusRoutes = require('./routes/censusRoutes')(db);
  const userRoutes = require('./routes/userRoutes')(db);
  const performanceRoutes = require('./routes/performanceRoutes');

  app.use('/api/admin', adminRoutes);
  app.use('/api/residents', residentRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/blotter', blotterRoutes);
  app.use('/api/census', censusRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/performance', performanceRoutes);
  
  logger.info('Modular routes mounted successfully');
});

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

logger.info('Route Registration: Registering authentication routes');

// ==========================================
// THEMIS CLEARPASS CLERK MODULE (/clerk routes)
// ==========================================

logger.info('Route Registration: Registering Clerk routes');

// Clerk Dashboard - Get clearance statistics and recent activity
// app.get('/api/clerk/dashboard', verifyToken, clerkController.getClerkDashboard);
// app.get('/clerk/dashboard', verifyToken, clerkController.getClerkDashboard);

// All clerk routes commented out due to controller import issues
// app.get('/api/clerk/dashboard', verifyToken, clerkController.getClerkDashboard);
// app.get('/clerk/dashboard', verifyToken, clerkController.getClerkDashboard);
// app.post('/api/clerk/issue-clearance', verifyToken, clerkController.issueClearance);
// app.post('/clerk/issue-clearance', verifyToken, clerkController.issueClearance);
// app.post('/api/clerk/validate-resident', verifyToken, clerkController.validateForClearance);
// app.post('/clerk/validate-resident', verifyToken, clerkController.validateForClearance);
// app.get('/api/clerk/clearance-history/:residentId', verifyToken, clerkController.getClearanceHistory);
// app.get('/clerk/clearance-history/:residentId', verifyToken, clerkController.getClearanceHistory);

// Issue Clearance - MAIN CLEARPASS FUNCTION with Logic Gate
// app.post('/api/clerk/issue-clearance', verifyToken, clerkController.issueClearance);
// app.post('/clerk/issue-clearance', verifyToken, clerkController.issueClearance);

// Validate resident for clearance (pre-check ClearPass)
// app.post('/api/clerk/validate-resident', verifyToken, clerkController.validateForClearance);
// app.post('/clerk/validate-resident', verifyToken, clerkController.validateForClearance);

// Get clearance history for a resident
// app.get('/api/clerk/clearance-history/:residentId', verifyToken, clerkController.getClearanceHistory);
// app.get('/clerk/clearance-history/:residentId', verifyToken, clerkController.getClearanceHistory);

logger.info('Route Registration: Clerk routes registered successfully');

// ==========================================
// AUTHENTICATION & ACCOUNT HIERARCHY MODULE
// ==========================================

// Public authentication routes (no middleware needed)
app.post('/api/auth/login', authController.login);

logger.info('Route Registration: Setting up THEMIS ResidentID + PIN login');
// app.post('/api/auth/themis-resident-login', authController.loginResident); // THEMIS ResidentID + PIN login
// app.post('/auth/themis-resident-login', authController.loginResident); // Legacy THEMIS route

logger.info('Route Registration: Setting up /api/auth/officer-login');
// app.post('/api/auth/officer-login', (req, res) => {
//   console.log('🚀 [Route Hit] /api/auth/officer-login called with body:', {
//     username: req.body?.username,
//     hasPassword: !!req.body?.password
//   });
//   return authController.staffLogin(req, res);
// }); // Primary /api route

// app.post('/auth/officer-login', (req, res) => {
//   console.log('🚀 [Route Hit] /auth/officer-login called with body:', {
//     username: req.body?.username,
//     hasPassword: !!req.body?.password
//   });
//   return authController.staffLogin(req, res);
// }); // Legacy /auth route

logger.info('Route Registration: Setting up /api/auth/register');
// app.post('/api/auth/register', verifyToken, checkRole(['Super Admin']), authController.register);
// app.post('/auth/register', verifyToken, checkRole(['Super Admin']), authController.register);

// Add dual routing for commonly used endpoints
logger.info('Route Registration: Setting up dual routes for backward compatibility');

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
    logger.error('Error fetching census', { error });
    res.status(500).json({ error: 'Failed to fetch census data' });
  }
});

// Blotter routes
app.get('/api/blotter', blotterController.getAll);
// Certificate routes - FIXED: MySQL-only authentication
app.get('/api/certificates', verifyToken, certificateController.getAll);
app.get('/api/auth/profile', verifyToken, (req, res) => { 
  res.json({ 
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      role_id: req.user.role_id
    }
  }); 
});

app.put('/api/auth/profile', verifyToken, (req, res) => { 
  res.json({ message: 'Update profile temporarily disabled' }); 
});

app.get('/api/auth/subordinates', verifyToken, (req, res) => { res.json({ message: 'Subordinates temporarily disabled' }); });

// Firebase users management - REMOVED (MySQL-only authentication)



// Protected residency verification management - REMOVED (Firebase legacy)

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
        validity_days,
        description,
        purpose,
        when_needed,
        required_data
      FROM certificate_types
      WHERE is_active = TRUE
      ORDER BY name
    `);

    logger.info('Certificate types API called', { count: rows.length });

    // Parse JSON required_data for each certificate type
    const certificateTypes = rows.map(type => ({
      id: type.id,
      label: type.name, // Frontend expects 'label' property
      name: type.name,  // Keep both for compatibility
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
    logger.error('Error fetching certificate types', { error });
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
app.get('/api/residents', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk']), residentController.getAll);
  

// Get resident by ID (RBIM enhanced) - protected with hierarchy check
app.get('/api/residents/:id', verifyToken, checkOwnershipOrHierarchy, residentController.getById);

// Duplicate checker (RBIM requirement)
app.post('/api/residents/check-duplicate', residentController.checkDuplicate);

// Create new resident (RBIM enhanced) - protected with JWT
app.post('/api/residents', verifyToken, residentController.create);

// Update resident (RBIM enhanced)
app.put('/api/residents/:id', residentController.update);

// Archive resident (Migration handler - RBIM requirement)
app.put('/api/residents/:id/archive', residentController.archive);

// Bulk import residents (Excel/CSV parser)
app.post('/api/residents/bulk-import', uploadBlob.single('file'), residentController.bulkImport);

// Get household members
app.get('/api/households/:id/members', residentController.getHouseholdMembers);

// Generate QR code for resident ID (RBIM enhanced)
app.post('/api/residents/:id/generate-qr', residentController.generateQR);
// ==========================================
// HOUSEHOLDS MANAGEMENT (RBIM)
// ==========================================

// Get all households
app.get('/api/households', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), householdController.getAll);
app.get('/api/households/:id', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), householdController.getById);
app.post('/api/households', householdController.create);
app.put('/api/households/:id', householdController.update);
app.delete('/api/households/:id', householdController.delete);
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
    logger.error('Error fetching census', { error });
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
    logger.error('Error fetching analytics census', { error });
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
    logger.error('Error fetching blotter', { error });
    res.status(500).json({ error: 'Failed to fetch blotter records' });
  }
});

// Create new blotter record (using new Katarungang Pambarangay schema)
app.post('/api/blotter', blotterController.create);
app.put('/api/blotter/:caseNumber', blotterController.update);
app.delete('/api/blotter/:caseNumber', blotterController.delete);
// ==========================================
// DOCUMENT REQUEST & GENERATION MODULE
// ==========================================

// Import document controller
const documentController = require('./controllers/documentController');

// Document type management
app.get('/api/documents/types', documentController.getDocumentTypes);

// Document request management
app.post('/api/documents/requests', verifyTokenJWT, documentController.createDocumentRequest);
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
const templateController = require('./controllers/templateController');

logger.info('TEMPLATE CONTROLLER DEBUG', {
  loaded: typeof templateController !== 'undefined',
  type: typeof templateController,
  hasGetTemplateStats: typeof templateController?.getTemplateStats === 'function',
  methods: templateController ? Object.getOwnPropertyNames(templateController.constructor.prototype) : []
});

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
app.get('/api/templates/stats', async (req, res) => {
  logger.info('TEMPLATE STATS ROUTE CALLED', {
    controllerExists: typeof templateController !== 'undefined',
    methodExists: typeof templateController?.getTemplateStats === 'function'
  });

  try {
    if (typeof templateController?.getTemplateStats === 'function') {
      logger.info('Calling getTemplateStats method');
      await templateController.getTemplateStats(req, res);
    } else {
      logger.error('getTemplateStats method not found', {
        controller_loaded: typeof templateController !== 'undefined',
        method_exists: typeof templateController?.getTemplateStats === 'function'
      });
      res.status(500).json({
        error: 'Template stats method not available',
        controller_loaded: typeof templateController !== 'undefined',
        method_exists: typeof templateController?.getTemplateStats === 'function'
      });
    }
  } catch (error) {
    logger.error('Error in template stats route', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Debug routes removed - using browser console now

// ==========================================
// CERTIFICATE ISSUANCE MODULE
// ==========================================



// Get all certificates (JWT authentication only)
app.get('/api/certificates', verifyToken, async (req, res) => {
  try {
    // Check if user is a resident (role-based access)
    const isResident = req.user.role_id === ROLES.RESIDENT;

    let query, values;

    if (isResident) {
      // Resident can only see their own certificates
      query = `
        SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
        FROM certificates_log c
        JOIN residents r ON c.resident_id = r.Resident_ID
        WHERE r.Resident_ID = ?
        ORDER BY c.created_at DESC
      `;
      values = [req.user.id];
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
    logger.error('Error fetching certificates', { error });
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
      logger.info('Creating manual certificate', { residentName: resident_name });

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
    // AUDIT FIX: Also check for empty/null status (404 cases have empty status)
    if (certificate_type_name === 'Barangay Clearance' || certificate_type_name === 'Good Moral') {
      const [blotterCheck] = await connection.execute(`
        SELECT COUNT(*) as active_cases,
               GROUP_CONCAT(case_number) as case_numbers,
               GROUP_CONCAT(incident_type) as incident_types
        FROM blotter
        WHERE respondent_id = ? 
        AND (status IN ('Pending', 'Scheduled for Mediation', 'Ongoing') OR status = '' OR status IS NULL)
      `, [resident_id]);

      if (blotterCheck[0].active_cases > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'BLOCK ISSUANCE: Active blotter case found for this resident',
          details: {
            caseCount: blotterCheck[0].active_cases,
            caseNumbers: blotterCheck[0].case_numbers,
            incidentTypes: blotterCheck[0].incident_types,
            message: 'Cannot issue clearance certificate while resident has pending/ongoing blotter cases'
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
    logger.error('Error issuing certificate', { error });
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
    logger.error('AI Service proxy error', { endpoint, error: error.message });
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
    logger.error('AI service error', { error: error.message });
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
      logger.error('AI service error, using fallback', { error: aiError.message });
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
    logger.error('Priority calculation error', { error });
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
      logger.error('AI service error, using fallback', { error: aiError.message });

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
    logger.error('Database error in patrol suggestions', { error: dbError.message });

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
    logger.error('Analytics dashboard error, using fallback', { error: error.message });
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
    logger.error('Analytics chart error, using fallback', { chartType: req.params.chart_type, error: error.message });

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
    logger.error('Analytics report generation error, using fallback', { error: error.message });

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
    logger.error('Chatbot error, using fallback', { error: error.message });

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
    logger.error('Error fetching tanod schedules', { error });
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
    logger.error('Error creating tanod schedule', { error });
    res.status(500).json({ error: 'Failed to create tanod schedule' });
  }
});

// ==========================================
// USER MANAGEMENT MODULE (Secretary and above)
// ==========================================

// Get all users (admin management)
app.get('/api/users', verifyToken, checkRole(['admin', 'captain', 'secretary']), userController.getAll);
app.get('/api/users/:id', verifyToken, checkRole(['admin', 'captain', 'secretary']), userController.getById);
app.post('/api/users', verifyToken, checkRole(['admin', 'captain', 'secretary']), userController.create);
app.put('/api/users/:id', verifyToken, checkRole(['admin', 'captain', 'secretary']), userController.update);
app.put('/api/users/:id/toggle-status', verifyToken, checkRole(['admin', 'captain', 'secretary']), userController.toggleStatus);
app.put('/api/users/:id/reset-password', verifyToken, checkRole(['admin', 'captain', 'secretary']), userController.resetPassword);
app.delete('/api/users/:id', verifyToken, checkRole(['admin', 'captain', 'secretary']), userController.delete);
// ==========================================
// UTILITY ENDPOINTS
// ==========================================

// Get sitios
app.get('/api/sitios', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM sitios ORDER BY name');
    res.json(rows);
  } catch (error) {
    logger.error('Error fetching sitios', { error });
    res.status(500).json({ error: 'Failed to fetch sitios' });
  }
});








// Firebase users route - REMOVED (MySQL-only authentication)

// Residency verifications routes (non-API prefix) - FIXED: Use db instead of knex
app.get('/auth/residency-verifications/pending', verifyToken, checkRole(['captain', 'secretary', 'clerk']), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Use db.execute instead of knex
    const [requests] = await db.execute(`
      SELECT
        rvr.*,
        u.username,
        u.full_name,
        u.email
      FROM resident_verification_requests rvr
      JOIN users u ON rvr.user_id = u.id
      WHERE rvr.status = 'pending'
      ORDER BY rvr.submitted_at ASC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);

    const formattedRequests = requests.map(row => ({
      request_id: row.request_id,
      user_id: row.user_id,
      username: row.username,
      full_name: row.full_name,
      email: row.email,
      proof_type: row.proof_type,
      proof_path: row.proof_path,
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
    logger.error('Error fetching pending residency verifications', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending verifications'
    });
  }
});

app.put('/auth/residency-verifications/:request_id/review', verifyToken, checkRole(['captain', 'secretary', 'clerk']), async (req, res) => {
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

    // Get the verification request using db.execute
    const [verificationRows] = await connection.execute(
      'SELECT * FROM resident_verification_requests WHERE request_id = ? AND status = ?',
      [request_id, 'pending']
    );

    if (verificationRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Verification request not found or already processed.'
      });
    }

    const verificationRequest = verificationRows[0];
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update verification request
    await connection.execute(
      'UPDATE resident_verification_requests SET status = ?, reviewed_at = NOW(), reviewed_by = ?, review_notes = ?, updated_at = NOW() WHERE request_id = ?',
      [newStatus, reviewed_by, review_notes, request_id]
    );

    if (action === 'approve') {
      // Update user residency status
      await connection.execute(
        'UPDATE users SET residency_status = ?, residency_verified_at = NOW(), residency_verified_by = ?, updated_at = NOW() WHERE id = ?',
        ['verified', reviewed_by, verificationRequest.user_id]
      );

      // Log the approval (optional - simplified)
      logger.info('Residency verification approved', { requestId: request_id });

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
    logger.error('Error reviewing residency verification', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to process verification review'
    });
  } finally {
    connection.release();
  }
});




// ==========================================
// QR CODE & ID SYSTEM
// ==========================================

// Generate QR code for resident ID
app.post('/api/residents/:id/generate-qr', residentController.generateQR);
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
    logger.error('Error generating certificate QR', { error });
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
    logger.error('Error verifying QR code', { error });
    res.status(500).json({
      status: 'ERROR',
      message: 'Verification service temporarily unavailable'
    });
  }
});

// ==========================================
// COMMUNITY EVENTS MODULE
// ==========================================

// Get all community programs/events - FIXED: MySQL-only authentication
app.get('/api/programs', verifyToken, async (req, res) => {
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
    logger.error('Error fetching programs', { error });
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
    logger.error('Error creating program', { error });
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
    logger.error('Error updating program', { error });
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
    logger.error('Error adding participant', { error });
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// ==========================================
// SMS NOTIFICATION SYSTEM
// ==========================================

// SMS stub function (ready for Twilio/Semaphore integration)
function sendSMS(mobile, message) {
  // SMS stub function (ready for Twilio/Semaphore integration)
  const timestamp = new Date().toISOString();
  logger.info('SMS sent', { mobile, message, timestamp });

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
    logger.error('Error sending SMS', { error });
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
    logger.error('Error sending bulk SMS', { error });
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
    logger.error('Error generating PDF', { error });
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Add error handling middleware
app.use(globalErrorHandler);

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
    logger.error('Error polling notifications', { error });
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

  logger.info('Server Configuration', {
    nodeEnv: process.env.NODE_ENV,
    enableHttps: process.env.ENABLE_HTTPS,
    isRailway,
    httpsEnabled: enableHTTPS
  });

  // Start server (HTTP or HTTPS based on configuration)
  let server;

  // For Railway deployments, always use HTTP only
  if (isRailway) {
    server = app.listen(port, () => {
      logger.info('Railway HTTP Server started', {
        port,
        database: process.env.DB_NAME || 'barangay_management',
        aiService: process.env.AI_SERVICE_URL || 'http://localhost:5000'
      });
    });
  } else if (enableHTTPS) {
    // HTTPS server with SSL certificates
    const httpsOptions = sslConfig.getHttpsOptions();

    if (httpsOptions) {
      const https = require('https');
      server = https.createServer(httpsOptions, app).listen(port, () => {
        logger.info('HTTPS server enabled with SSL certificates', {
          port,
          database: process.env.DB_NAME || 'barangay_management',
          aiService: process.env.AI_SERVICE_URL || 'http://localhost:5000'
        });
      });
    } else {
      logger.warn('HTTPS requested but SSL certificates not available, falling back to HTTP');
      server = app.listen(port, () => {
        logger.info('HTTP Server started (fallback)', {
          port,
          database: process.env.DB_NAME || 'barangay_management',
          aiService: process.env.AI_SERVICE_URL || 'http://localhost:5000',
          warning: 'Running on HTTP (not secure)'
        });
      });
    }
  } else {
    // HTTP server for development
    server = app.listen(port, () => {
      logger.info('HTTP Server started (development)', {
        port,
        database: process.env.DB_NAME || 'barangay_management',
        aiService: process.env.AI_SERVICE_URL || 'http://localhost:5000',
        warning: 'Running on HTTP (not secure)'
      });
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
