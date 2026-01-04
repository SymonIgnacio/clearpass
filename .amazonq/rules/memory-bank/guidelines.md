# Development Guidelines

## Code Quality Standards

### Code Formatting
- **Indentation**: 2 spaces for JavaScript/JSX, Python follows PEP 8 (4 spaces)
- **Line Length**: Maximum 120 characters per line
- **Semicolons**: Required in JavaScript (enforced by ESLint)
- **Quotes**: Single quotes for JavaScript strings, double quotes for JSX attributes
- **Trailing Commas**: Used in multi-line arrays and objects for cleaner diffs

### Structural Conventions
- **File Organization**: Controllers, middleware, routes, and utilities in separate directories
- **Module Exports**: Use `module.exports` for CommonJS, class-based controllers export singleton instances
- **Imports**: Group by type (external packages, internal modules, relative imports)
- **Naming Files**: camelCase for JavaScript files, PascalCase for React components

### Textual Standards
- **Variable Naming**: camelCase for variables and functions (e.g., `getUserById`, `residentData`)
- **Class Naming**: PascalCase for classes and React components (e.g., `DocumentController`, `ErrorBoundary`)
- **Constants**: UPPER_SNAKE_CASE for constants (e.g., `ROLES`, `JWT_SECRET`)
- **Database Fields**: Snake_case for MySQL columns (e.g., `Resident_ID`, `First_Name`)
- **Comments**: Use JSDoc-style comments for functions, inline comments for complex logic

### Code Practices
- **Error Handling**: Always use try-catch blocks in async functions
- **Logging**: Use Winston logger for all server-side logging (never console.log in production)
- **Validation**: Server-side validation required for all inputs using express-validator
- **Security**: XSS sanitization, CSRF protection, rate limiting on all endpoints
- **Database Transactions**: Use transactions for multi-step database operations

## Semantic Patterns Overview

### Controller Pattern (Backend)
Controllers are class-based singletons that handle business logic:

```javascript
class DocumentController {
  async createDocumentRequest(req, res) {
    try {
      const { resident_id, document_type, request_data } = req.body;
      
      // Validation
      if (!resident_id || !document_type) {
        return res.status(400).json({
          success: false,
          message: 'Required fields missing'
        });
      }
      
      // Business logic
      const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Database operation
      await knex('document_requests').insert({
        request_id: requestId,
        resident_id,
        document_type,
        status: 'pending'
      });
      
      // Response
      res.status(201).json({
        success: true,
        data: { request_id: requestId }
      });
    } catch (error) {
      logger.error('Error creating document request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create document request'
      });
    }
  }
}

module.exports = new DocumentController();
```

**Frequency**: Used in all 11 controller files

### Middleware Chain Pattern
Express middleware for authentication, validation, and error handling:

```javascript
// Authentication middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Usage in routes
app.get('/api/residents', verifyToken, checkRole(['admin', 'clerk']), residentController.getAll);
```

**Frequency**: Used in 8 middleware files, applied to 50+ routes

### Validation Chain Pattern
Input validation using express-validator:

```javascript
const validateResident = [
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .customSanitizer(sanitizeInput),
  
  body('birthdate')
    .notEmpty()
    .isISO8601()
    .withMessage('Please provide a valid birthdate'),
  
  handleValidationErrors
];

// Usage
app.post('/api/residents', validateResident, residentController.create);
```

**Frequency**: 10 validation chains defined, used across all POST/PUT routes

### React Component Pattern (Frontend)
Functional components with hooks:

```javascript
import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <CircularProgress />;
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Component content */}
    </Box>
  );
};

export default Dashboard;
```

**Frequency**: Used in all 20+ React page components

### Lazy Loading Pattern
Code splitting for performance:

```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Residents = lazy(() => import('./pages/Residents'));

// Usage with fallback
<Suspense fallback={<LoadingFallback />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

**Frequency**: Applied to all 15+ page-level components

### Database Query Pattern
Knex.js query builder with error handling:

```javascript
// Select with joins
const residents = await knex('residents')
  .select('residents.*', 'households.Street_Address', 'sitios.name as sitio_name')
  .leftJoin('households', 'residents.Household_ID', 'households.Household_ID')
  .leftJoin('sitios', 'households.Sitio_ID', 'sitios.id')
  .where('residents.Resident_ID', resident_id)
  .first();

// Transaction pattern
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  
  // Multiple operations
  await connection.execute('INSERT INTO ...', values);
  await connection.execute('UPDATE ...', values);
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

**Frequency**: Used in all database operations across 11 controllers

### Response Format Pattern
Consistent API response structure:

```javascript
// Success response
res.status(200).json({
  success: true,
  data: resultData,
  message: 'Operation successful'
});

// Error response
res.status(400).json({
  success: false,
  message: 'Validation failed',
  errors: validationErrors
});

// Paginated response
res.json({
  success: true,
  data: items,
  pagination: {
    page: parseInt(page),
    limit: parseInt(limit),
    total: totalCount
  }
});
```

**Frequency**: Used in 100% of API endpoints

### Environment Configuration Pattern
Environment variables with validation:

```javascript
// Validation on startup
function validateEnvironmentVariables() {
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
  
  const missingVars = requiredVars.filter(varName =>
    process.env[varName] === undefined || process.env[varName] === null
  );
  
  if (missingVars.length > 0) {
    logger.error('Missing required environment variables', { missingVars });
    process.exit(1);
  }
}

// Usage
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME
};
```

**Frequency**: Used in server initialization and all configuration files

## Internal API Usage Patterns

### Authentication Flow
```javascript
// 1. Login endpoint
app.post('/api/auth/login', authController.login);

// 2. Controller validates credentials
const user = await knex('users')
  .where('username', username)
  .first();

const isValid = await bcrypt.compare(password, user.password_hash);

// 3. Generate JWT token
const token = jwt.sign(
  { id: user.id, username: user.username, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// 4. Return token to client
res.json({ token, user: { id, username, role } });

// 5. Client stores token and includes in requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### CRUD Operations Pattern
```javascript
// GET all with filtering
app.get('/api/residents', verifyToken, async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  
  let query = knex('residents').select('*');
  
  if (search) {
    query.where('First_Name', 'like', `%${search}%`)
         .orWhere('Last_Name', 'like', `%${search}%`);
  }
  
  const residents = await query
    .limit(limit)
    .offset((page - 1) * limit);
  
  res.json({ success: true, data: residents });
});

// POST create
app.post('/api/residents', verifyToken, validateResident, async (req, res) => {
  const [id] = await knex('residents').insert(req.body);
  res.status(201).json({ success: true, id });
});

// PUT update
app.put('/api/residents/:id', verifyToken, async (req, res) => {
  await knex('residents').where('Resident_ID', req.params.id).update(req.body);
  res.json({ success: true, message: 'Updated successfully' });
});

// DELETE
app.delete('/api/residents/:id', verifyToken, async (req, res) => {
  await knex('residents').where('Resident_ID', req.params.id).del();
  res.json({ success: true, message: 'Deleted successfully' });
});
```

### File Upload Pattern
```javascript
// Multer configuration for BLOB storage
const uploadBlob = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Usage in route
app.post('/api/documents/upload', 
  verifyToken, 
  uploadBlob.single('file'), 
  async (req, res) => {
    const fileBuffer = req.file.buffer;
    
    await knex('documents').insert({
      filename: req.file.originalname,
      file_data: fileBuffer,
      mimetype: req.file.mimetype
    });
    
    res.json({ success: true });
  }
);
```

### Rate Limiting Pattern
```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

// Strict limiter for sensitive operations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', { ip: req.ip });
    res.status(options.statusCode).send(options.message);
  }
});

// Apply to routes
app.use('/api/auth', authLimiter);
app.use('/api/', apiLimiter);
```

## Frequently Used Code Idioms

### Async/Await Error Handling
```javascript
// Always wrap async operations in try-catch
async function fetchData() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    logger.error('Operation failed', { error });
    throw error;
  }
}
```

### Conditional Chaining
```javascript
// Safe property access
const userName = req.user?.username || 'Anonymous';
const token = req.headers.authorization?.split(' ')[1];
```

### Array Destructuring
```javascript
// Database query results
const [rows] = await db.execute('SELECT * FROM users');
const [insertResult] = await db.execute('INSERT INTO ...', values);
```

### Template Literals
```javascript
// String interpolation
const message = `User ${username} logged in at ${timestamp}`;
const query = `SELECT * FROM residents WHERE name LIKE '%${search}%'`;
```

### Object Destructuring
```javascript
// Extract properties from request
const { username, password, email } = req.body;
const { id } = req.params;
const { page = 1, limit = 10 } = req.query;
```

### Spread Operator
```javascript
// Merge objects
const updatedUser = { ...existingUser, ...req.body };

// Copy arrays
const newArray = [...existingArray, newItem];
```

### Arrow Functions
```javascript
// Concise function syntax
const calculateAge = (birthdate) => {
  const birth = new Date(birthdate);
  return new Date().getFullYear() - birth.getFullYear();
};

// Array methods
const activeUsers = users.filter(user => user.status === 'active');
const userNames = users.map(user => user.username);
```

## Popular Annotations

### JSDoc Comments
```javascript
/**
 * Create a new document request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async createDocumentRequest(req, res) {
  // Implementation
}
```

### TODO Comments
```javascript
// TODO: Integrate with Python document generator
// TODO: Add email notification on approval
// FIXME: Handle edge case for duplicate entries
// NOTE: This is a temporary workaround
```

### Route Documentation
```javascript
// ==========================================
// AUTHENTICATION & ACCOUNT HIERARCHY MODULE
// ==========================================

// Public authentication routes (no middleware needed)
app.post('/api/auth/login', authController.login);
```

### Python Docstrings
```python
def extract_fields(self, text):
    """
    Extract fields using regex patterns
    
    Args:
        text (str): OCR extracted text
        
    Returns:
        dict: Extracted field values
    """
    # Implementation
```

## Testing Patterns

### Unit Test Structure
```python
def test_ocr_to_db_workflow_complete_pipeline(tmp_path, mock_ocr_text):
    """Test complete OCR → field extraction → database save workflow"""
    # Arrange
    ocr_engine = MockOCREngine()
    field_extractor = MockFieldExtractor()
    db_manager = MockDatabaseManager()
    
    # Act
    extracted_text = ocr_engine.extract_text(image_path)
    extracted_fields = field_extractor.extract_fields(extracted_text)
    record_id = db_manager.save_extracted_fields(extracted_fields)
    
    # Assert
    assert record_id > 0
    assert saved_record['status'] == 'processed'
```

### Mock Pattern
```python
@patch('PIL.Image.open')
@patch('pytesseract.image_to_string')
def test_with_mocks(mock_tesseract, mock_image_open):
    mock_tesseract.return_value = "BARANGAY CLEARANCE"
    mock_image = MagicMock()
    mock_image_open.return_value = mock_image
    
    # Test implementation
```

## Security Best Practices

### Input Sanitization
```javascript
const sanitizeInput = (value) => {
  if (typeof value === 'string') {
    return xss(value.trim());
  }
  return value;
};
```

### Password Hashing
```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, user.password_hash);
```

### SQL Injection Prevention
```javascript
// Always use parameterized queries
const [users] = await db.execute(
  'SELECT * FROM users WHERE username = ?',
  [username]
);

// Never concatenate user input
// BAD: `SELECT * FROM users WHERE username = '${username}'`
```

### CORS Configuration
```javascript
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
```

## Performance Optimization

### Database Indexing
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_residents_name ON residents(First_Name, Last_Name);
CREATE INDEX idx_blotter_status ON blotter(status);
```

### Query Optimization
```javascript
// Use select() to limit returned columns
const users = await knex('users')
  .select('id', 'username', 'email')
  .where('status', 'active');

// Use pagination
const residents = await knex('residents')
  .limit(limit)
  .offset((page - 1) * limit);
```

### React Optimization
```javascript
// Memoization
const MemoizedComponent = React.memo(ExpensiveComponent);

// Lazy loading
const Dashboard = lazy(() => import('./pages/Dashboard'));

// useCallback for event handlers
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

## Deployment Considerations

### Environment-Specific Configuration
```javascript
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigins = isProduction 
  ? [process.env.CLIENT_URL]
  : ['http://localhost:5173', 'http://localhost:3000'];
```

### Logging Levels
```javascript
// Development: verbose logging
logger.info('Request received', { method, url });

// Production: error logging only
if (process.env.NODE_ENV === 'production') {
  logger.level = 'error';
}
```

### Health Checks
```javascript
app.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabaseConnection();
  const statusCode = dbHealthy ? 200 : 503;
  
  res.status(statusCode).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString()
  });
});
```
