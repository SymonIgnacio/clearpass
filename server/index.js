const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xssClean = require('xss-clean');

// Environment validation
function validateEnvironmentVariables() {
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    process.exit(1);
  }
}

validateEnvironmentVariables();

const cookieParser = require('cookie-parser');
const csrf = require('csurf');

// CSRF protection setup
const csrfProtection =
  process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : csrf({
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          path: '/',
        },
      });

// Import controllers
const authController = require('./controllers/authController');
const residentController = require('./controllers/residentController');
const blotterController = require('./controllers/blotterController');
const certificateController = require('./controllers/certificateController');
const householdController = require('./controllers/householdController');
const userController = require('./controllers/userController');
const adminController = require('./controllers/adminController');

// Import middleware
const { verifyToken, checkRole } = require('./middleware/authMiddleware');
const { ROLES } = require('./config/roles');
const { errorHandler } = require('./middleware/errorHandler');
const { validateLogin } = require('./middleware/validation');
const { auditMiddleware } = require('./middleware/auditLogger');

const app = express();
const port = process.env.SERVER_PORT || 3002;
const http = require('http');
const server = http.createServer(app);
const WebSocketService = require('./services/websocketService');
const crypto = require('crypto');

// Enhanced rate limiting with environment-specific configurations
const isDevelopment = process.env.NODE_ENV !== 'production';

// Authentication rate limiting - stricter for production
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDevelopment ? 100 : 20, // Much lower in production
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: req => {
    // Use IP + user agent for better identification
    return req.ip + ':' + req.get('User-Agent');
  },
});

// Admin operations - very strict rate limiting
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDevelopment ? 100 : 10, // Very restrictive in production
  message: { error: 'Too many admin requests. Contact administrator if needed.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: req => {
    // Include user ID if authenticated for better tracking
    if (req.user && req.user.id) {
      return `admin:${req.user.id}`;
    }
    return req.ip;
  },
});

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDevelopment ? 1000 : 200, // Reasonable limits
  message: { error: 'Too many API requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// File upload rate limiting - more restrictive
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDevelopment ? 50 : 10, // Very restrictive for uploads
  message: { error: 'Too many upload attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    if (req.user && req.user.id) {
      return `upload:${req.user.id}`;
    }
    return req.ip;
  },
});

// Search rate limiting - prevent abuse of search endpoints
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: isDevelopment ? 100 : 30, // 30 searches per minute
  message: { error: 'Too many search requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    if (req.user && req.user.id) {
      return `search:${req.user.id}`;
    }
    return req.ip;
  },
});

// Apply rate limiting to specific endpoint categories
app.use('/api/auth', authLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api/uploads', uploadLimiter);
app.use('/api/residents/search', searchLimiter);
app.use('/api/blotter/search', searchLimiter);

// General API limiter for all other endpoints
app.use('/api/', apiLimiter);

// CORS configuration
const corsOrigins =
  process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://glistening-lamington-a9e2b7.netlify.app']
    : [
        'http://localhost:3002',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
      ];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === 'production' && origin && origin.includes('netlify.app')) {
        return callback(null, true);
      }

      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow localhost with any port for development
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        return callback(null, true);
      }

      console.warn('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  })
);

// Enhanced logging system
const { logger, securityLogger, requestLogger } = require('./utils/logger');

// Request logging middleware
app.use(requestLogger);

// Enhanced security middleware with CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Material-UI and Tailwind
          'fonts.googleapis.com',
          'cdnjs.cloudflare.com',
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-eval'", // Required for development mode with Vite
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'http://localhost:3002', // For local development
        ],
        fontSrc: ["'self'", 'fonts.gstatic.com', 'data:'],
        connectSrc: [
          "'self'",
          'http://localhost:3002',
          'ws://localhost:3002', // WebSocket connections
        ],
        frameSrc: ["'none'"], // Prevent clickjacking
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : [],
      },
    },
    hsts:
      process.env.NODE_ENV === 'production'
        ? {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
          }
        : false,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
    frameguard: { action: 'deny' },
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? true : false,
  })
);
app.use(cookieParser());
app.use(xssClean());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(apiLimiter);

// Request ID and basic structured logging
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        reqId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
      })
    );
  });
  next();
});

// CSRF protection for state-changing operations (excluding login for now)
// Enable CSRF protection for all authentication endpoints (except login for form token)
app.use('/api/auth/logout', csrfProtection);
app.use('/api/auth/register', csrfProtection);
app.use('/api/auth/reset-password', csrfProtection);
app.use('/api/auth/change-password', csrfProtection);
app.use('/api/auth/mfa', csrfProtection);

// CSRF protection for residents endpoints (excluding GET requests)
app.use('/api/residents', (req, res, next) => {
  // Skip CSRF for GET requests and legacy archive route
  if (req.method === 'GET' || req.path.match(/^\/.*\/archive$/)) {
    return next();
  }
  csrfProtection(req, res, next);
});

// CSRF protection for blotter endpoints (excluding GET requests)
app.use('/api/blotter', (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  csrfProtection(req, res, next);
});

// Enable CSRF protection for certificates endpoints (excluding GET requests)
app.use('/api/certificates', (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  csrfProtection(req, res, next);
});

// CSRF protection for documents and uploads
app.use('/api/documents', csrfProtection);
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// CSRF protection for resident routes (excluding GET requests and login/register)
app.use('/api/resident-auth', (req, res, next) => {
  if (req.method === 'GET' || req.path.match(/^\/(login|register)$/)) {
    return next();
  }
  csrfProtection(req, res, next);
});

app.use('/api/resident-profile', (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  // Skip CSRF for beneficiary-status upload endpoint due to multipart/form-data complexity
  // The endpoint is still protected by JWT authentication
  if (req.path === '/beneficiary-status' || req.path === '/beneficiary-status/') {
    return next();
  }
  csrfProtection(req, res, next);
});

app.use('/api/certificate-requests', (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  csrfProtection(req, res, next);
});

app.use('/api/blotter-requests', (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  csrfProtection(req, res, next);
});

// Audit logging middleware (before routes)
app.use(auditMiddleware({ auditAll: false }));

// Database connection (standardized)
const db = require('./database');
app.locals.db = db;
const { startDocumentRetentionScheduler } = require('./jobs/documentRetention');
const { startVulnerabilityScoreScheduler } = require('./jobs/calculateVulnerabilityScores');

// Test database connection
async function initializeDatabase() {
  try {
    const connection = await db.getConnection();
    connection.release();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Mount routes
app.post('/api/auth/login', authLimiter, validateLogin, authController.login);
app.post('/api/auth/officer-login', authLimiter, validateLogin, authController.login); // Restored Officer Login
app.post('/api/auth/logout', authController.logout);

// CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Add auth/me endpoint for authentication check
app.get('/api/auth/me', verifyToken, authController.me);
app.post('/api/auth/mfa/request', verifyToken, authController.requestMfaOtp);
app.post('/api/auth/mfa/verify', verifyToken, authController.verifyMfaOtpCode);
app.put('/api/auth/profile', verifyToken, authController.updateProfile);
app.post('/api/auth/change-password', verifyToken, authController.changePassword);
app.post(
  '/api/auth/verify-email-for-residency',
  verifyToken,
  authController.verifyEmailForResidency
);

// Load and mount modular routes
app.use('/api/residents', require('./routes/residentRoutes')(db));
app.use('/api/blotter', require('./routes/blotterRoutes')(db));
app.use('/api/sitios', require('./routes/sitioRoutes')(db)); // Moved up to take precedence
app.use('/api/certificates', require('./routes/certificateRoutes')(db));
app.use('/api/certificate-requests', require('./routes/certificateRequestRoutes')(db));
app.use('/api/certificate-types', require('./routes/certificateTypeRoutes')(db)); // Add new route
app.use('/api/blotter-complaints', require('./routes/blotterComplaintRoutes')(db));
app.use('/api/blotter-requests', require('./routes/blotterRequestRoutes')(db));
app.use('/api/resident-profile', require('./routes/residentProfileRoutes')(db));
app.use('/api/case-management', require('./routes/caseManagementRoutes')(db));
app.use('/api/templates', require('./routes/templateRoutes')(db));
app.use('/api/ai-analytics', require('./routes/aiAnalyticsRoutes')(db));
app.use('/api/system-admin', require('./routes/systemAdminRoutes')(db));
app.use('/api/documents', require('./routes/documentRoutes')(db));
app.use('/api/ai', require('./routes/aiRoutes')(db));
app.use('/api/users', require('./routes/userRoutes')(db));
app.use('/api/admin', adminLimiter, require('./routes/adminRoutes')(db));
app.use('/api/notifications', require('./routes/notificationRoutes')(db));
app.use('/api/announcements', require('./routes/announcementRoutes')(db));

// Role-based routes
app.use('/api/clerk', require('./routes/clerkRoutes')(db));
app.use('/api/captain', require('./routes/captainRoutes')(db));
app.use('/api/secretary', require('./routes/secretaryRoutes')(db));
app.use('/api/officer', require('./routes/officerRoutes')(db));

// Resident authentication routes
app.use('/api/resident-auth', require('./routes/residentAuthRoutes')(db));

// Shared/legacy routes for backward compatibility
app.use('/api', require('./routes/sharedRoutes')(db));

// Mount comprehensive routes.js for additional endpoints
// app.use('/api', require('./routes'));

// Programs route
app.use('/api/programs', require('./routes/programRoutes')(db));
// Sitios route (Moved up)
// app.use('/api/sitios', require('./routes/sitioRoutes')(db));

// Legacy household route (to be moved to modular)
app.get(
  '/api/households',
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK, ROLES.BLOTTER_OFFICER]),
  householdController.getAll
);

app.get(
  '/api/households/:id',
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK]),
  householdController.getById
);

app.post(
  '/api/households',
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.SECRETARY, ROLES.CLERK]),
  householdController.create
);

app.put(
  '/api/households/:id',
  verifyToken,
  checkRole([ROLES.ADMIN, ROLES.SECRETARY, ROLES.CLERK]),
  householdController.update
);

app.delete(
  '/api/households/:id',
  verifyToken,
  checkRole([ROLES.ADMIN]),
  householdController.delete
);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Barangay Management API',
    timestamp: new Date().toISOString(),
    port: port,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, p) => {
    console.error('UNHANDLED REJECTION:', reason);
  });

  try {
    await initializeDatabase();

    try {
      startDocumentRetentionScheduler(app.locals.db);
    } catch (e) {
      console.error('Error starting Document Retention Scheduler:', e);
    }

    try {
      startVulnerabilityScoreScheduler(app.locals.db);
    } catch (e) {
      console.error('Error starting Vulnerability Score Scheduler:', e);
    }

    const {
      startBlotterRequestValidationReminderScheduler,
    } = require('./jobs/blotterRequestValidationReminders');

    try {
      startBlotterRequestValidationReminderScheduler(app.locals.db);
    } catch (e) {
      console.error('Error starting Blotter Validation Scheduler:', e);
    }

    // Initialize WebSocket service
    const wsService = new WebSocketService(server);
    global.wsService = wsService;

    // Helper function to create notifications
    const createNotification = async (
      userId,
      title,
      message,
      type = 'info',
      priority = 'normal',
      data = null
    ) => {
      try {
        const NotificationController = require('./controllers/notificationController');
        const notificationController = new NotificationController(app.locals.db);
        const notification = await notificationController.createNotification(
          userId,
          title,
          message,
          type,
          priority,
          data
        );

        // Send via WebSocket
        wsService.sendToUser(userId, {
          type: 'notification',
          data: notification,
        });

        return notification;
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    };

    // Helper function to create bulk notifications
    const createBulkNotification = async (
      userIds,
      title,
      message,
      type = 'info',
      priority = 'normal',
      data = null
    ) => {
      try {
        const NotificationController = require('./controllers/notificationController');
        const notificationController = new NotificationController(app.locals.db);
        return await notificationController.createBulkNotification(
          userIds,
          title,
          message,
          type,
          priority,
          data
        );
      } catch (error) {
        console.error('Error creating bulk notification:', error);
      }
    };

    // Make notification helpers globally available
    global.createNotification = createNotification;
    global.createBulkNotification = createBulkNotification;

    server.listen(port, () => {
      console.log(`🚀 ClearPass Server started on port ${port}`);
      console.log(`📊 Database: ${process.env.DB_NAME || 'barangay_management'}`);
      console.log(`🔌 WebSocket: ws://localhost:${port}/ws`);
      console.log(`❤️ Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    console.error('FATAL ERROR DURING STARTUP:', error);
    process.exit(1);
  }
}

module.exports = app;

if (require.main === module) {
  startServer().catch(console.error);
}
