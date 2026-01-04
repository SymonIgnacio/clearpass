require('dotenv').config();

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
const { errorHandler } = require('./middleware/errorHandler');
const { validateLogin } = require('./middleware/validation');

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, try again later' },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // 20 requests per window
  message: { error: 'Too many admin requests' },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { error: 'Too many requests' },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

// CORS configuration
const corsOrigins = process.env.NODE_ENV === 'production'
  ? ['https://glistening-lamington-a9e2b7.netlify.app']
  : ['http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production' && origin && origin.includes('netlify.app')) {
      return callback(null, true);
    }
    
    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security middleware
app.use(helmet());
app.use(xssClean());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(apiLimiter);

// Database connection (standardized)
const db = require('./database');
app.locals.db = db;

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

// Load and mount modular routes
app.use('/api/residents', require('./routes/residentRoutes')(db));
app.use('/api/blotter', require('./routes/blotterRoutes')(db));
app.use('/api/certificates', require('./routes/certificateRoutes')(db));
app.use('/api/documents', require('./routes/documentRoutes')(db));
app.use('/api/ai', require('./routes/aiRoutes')(db));
app.use('/api/users', require('./routes/userRoutes')(db));
app.use('/api/admin', adminLimiter, require('./routes/adminRoutes')(db));
app.use('/api/notifications', require('./routes/notificationRoutes')(db));
app.use('/api/announcements', require('./routes/announcementRoutes')(db));

// Legacy household route (to be moved to modular)
app.get('/api/households', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), householdController.getAll);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Barangay Management API',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  await initializeDatabase();
  
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    console.log(`Database: ${process.env.DB_NAME || 'barangay_management'}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });
}

startServer().catch(console.error);