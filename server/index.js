const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xssClean = require('xss-clean');

try {
  validateServerEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const cookieParser = require('cookie-parser');

const csrfExemptPaths = new Set(['/api/auth/login', '/api/resident-auth/login', '/api/resident-auth/register']);
const csrfStateChangingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_COOKIE_NAME = 'csrfToken';
const csrfCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
});
const createCsrfToken = () => crypto.randomBytes(32).toString('hex');
const getRequestCsrfToken = req => req.get('X-CSRF-Token') || req.get('X-XSRF-TOKEN');
const tokensMatch = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string') {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};
const issueCsrfToken = (req, res, next) => {
  const token = createCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions());
  req.csrfToken = () => token;
  next();
};
const csrfForCookieAuth = (req, res, next) => {
  if (!csrfStateChangingMethods.has(req.method) || csrfExemptPaths.has(req.path) || !req.cookies?.authToken) {
    return next();
  }

  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const requestToken = getRequestCsrfToken(req);

  if (!tokensMatch(cookieToken, requestToken)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  return next();
};

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
const compressionMiddleware = require('./middleware/compression');
const { createCorsOptions } = require('./config/cors');
const { validateServerEnv } = require('./config/env');

const app = express();
const port = process.env.PORT || process.env.SERVER_PORT || 3002;
const http = require('http');
const server = http.createServer(app);
const WebSocketService = require('./services/websocketService');

// Rate limiting - DISABLED FOR DEVELOPMENT
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Increased limit for testing
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === 'production' ? 20 : 5000,
  message: { error: 'Too many admin requests' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5000, // Increased limit for testing
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply limits
app.use('/api/auth', authLimiter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

app.use(cors(createCorsOptions()));

// Security middleware
app.use(helmet());
app.use(compressionMiddleware);
app.use(cookieParser());
app.use(xssClean());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(apiLimiter);

app.use(csrfForCookieAuth);

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
app.post('/api/auth/logout', authController.logout);

// CSRF token endpoint
app.get('/api/csrf-token', issueCsrfToken, (req, res) => {
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
app.use('/api', require('./routes'));

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

// Handle React routing, return all requests to React app - DISABLED for Vercel/Netlify split
// if (process.env.NODE_ENV === 'production') {
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
//   });
// }

// Start server
async function startServer() {
  await initializeDatabase();

  startDocumentRetentionScheduler(app.locals.db);
  startVulnerabilityScoreScheduler(app.locals.db);

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
}

module.exports = app;

if (require.main === module) {
  startServer().catch(console.error);
}
