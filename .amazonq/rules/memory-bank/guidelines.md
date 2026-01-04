# Development Guidelines

## Code Quality Standards

### Formatting & Structure
- **Indentation**: 2 spaces for JavaScript/JSX, 4 spaces for Python
- **Line Length**: Soft limit of 100-120 characters
- **Semicolons**: Required in JavaScript (enforced by ESLint)
- **Quotes**: Single quotes for JavaScript strings, double quotes for JSX attributes
- **Trailing Commas**: Used in multi-line arrays and objects for cleaner diffs

### Naming Conventions
- **Variables/Functions**: camelCase (`getUserById`, `isActive`, `totalCount`)
- **React Components**: PascalCase (`DocumentsDashboard`, `CertificateTypeModal`)
- **Constants**: UPPER_SNAKE_CASE (`ROLES`, `API_BASE_URL`, `MAX_FILE_SIZE`)
- **Database Tables**: snake_case (`residents`, `document_requests`, `blotter_entries`)
- **Database Columns**: Snake_Case with capitals (`Resident_ID`, `First_Name`, `Date_of_Birth`)
- **API Endpoints**: kebab-case with resource plurals (`/api/residents`, `/api/certificate-types`)
- **File Names**: 
  - Controllers: camelCase with suffix (`documentController.js`, `authController.js`)
  - React Components: PascalCase (`DocumentsDashboard.jsx`, `ResidentSettings.jsx`)
  - Utilities: camelCase (`api.js`, `validation.js`)

### Documentation Standards
- **JSDoc Comments**: Used for complex functions and class methods
- **Inline Comments**: Explain "why" not "what" - used sparingly for complex logic
- **README Files**: Present in major directories (`server/controllers/README.md`)
- **API Documentation**: Swagger/OpenAPI specs maintained in `server/swagger.js`
- **TODO Comments**: Include context and priority (`// TODO: Implement proper CSRF handling`)

## Architectural Patterns

### Backend Architecture (MVC Pattern)
```
Request → Router → Middleware Chain → Controller → Database → Response
```

**Middleware Chain Order**:
1. CORS configuration
2. Helmet security headers
3. XSS protection (xss-clean)
4. Body parsing (express.json)
5. Request logging
6. Rate limiting
7. Authentication (verifyToken)
8. Role-based access control (checkRole)
9. Input validation (express-validator)
10. Controller handler
11. Error handler (global)

**Controller Pattern**:
```javascript
class DocumentController {
  async getDocumentTypes(req, res) {
    try {
      // Business logic here
      const documentTypes = [...];
      res.json({ success: true, data: documentTypes });
    } catch (error) {
      console.error('Error fetching document types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document types'
      });
    }
  }
}
module.exports = new DocumentController();
```

**Route Organization**:
- Modular routes in `server/routes/` directory
- Routes mounted under `/api/*` prefix
- Route files export factory functions accepting `db` parameter
- Example: `server/routes/adminRoutes.js`, `server/routes/residentRoutes.js`

### Frontend Architecture (Component-Based)

**Component Structure**:
```jsx
// Imports
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { apiRequest } from '../utils/api';

// Component
const ComponentName = ({ user, prop2 }) => {
  // State declarations
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Effects
  useEffect(() => {
    loadData();
  }, []);

  // Event handlers
  const handleAction = async () => {
    try {
      // Implementation
    } catch (error) {
      console.error('Error:', error);
      alert('Operation failed');
    }
  };

  // Render
  return (
    <Box>
      {/* JSX content */}
    </Box>
  );
};

export default ComponentName;
```

**State Management**:
- React Context API for global state (authentication, user data)
- Local component state with useState for UI state
- useEffect for side effects and data fetching
- No Redux or external state management libraries

**API Communication**:
```javascript
// Centralized API utility (client/src/utils/api.js)
const apiRequest = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${baseURL}/api/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers
    }
  });
  
  return response;
};
```

### Database Patterns

**Query Builder (Knex.js)**:
```javascript
// Parameterized queries for SQL injection prevention
const [residents] = await db.execute(
  'SELECT * FROM residents WHERE Resident_ID = ?',
  [residentId]
);

// Transaction handling
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  // Multiple operations
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

**Migration Pattern**:
- Sequential timestamped migrations in `server/migrations/`
- Naming: `YYYYMMDDHHMMSS_description.js`
- Always include both `up` and `down` methods
- Use Knex schema builder for database-agnostic migrations

## Security Practices

### Authentication & Authorization
- **JWT Tokens**: 24-hour expiration, stored in localStorage
- **Password Hashing**: bcrypt with salt rounds (10+)
- **Token Verification**: Middleware validates JWT on protected routes
- **Role-Based Access**: Hierarchical role checking (Super Admin > Captain > Secretary > Clerk > Officer > Resident)

**Authentication Middleware Pattern**:
```javascript
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
```

### Input Validation & Sanitization
- **express-validator**: Validation chains for all input endpoints
- **XSS Protection**: xss-clean middleware + custom sanitization
- **SQL Injection Prevention**: Parameterized queries exclusively
- **File Upload Validation**: Whitelist MIME types, size limits (10MB)

**Validation Pattern**:
```javascript
const validateResident = [
  body('first_name')
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .customSanitizer(sanitizeInput),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail(),
  
  handleValidationErrors
];
```

### Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **Sensitive Operations**: 10 requests per 15 minutes per IP
- **express-rate-limit v7** syntax with `limit` property

### Security Headers
- **Helmet.js**: Comprehensive security headers
- **CORS**: Whitelist-based origin validation
- **CSP**: Content Security Policy for XSS prevention
- **HSTS**: HTTP Strict Transport Security enabled

## Error Handling

### Backend Error Pattern
```javascript
// Controller-level error handling
try {
  // Business logic
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Error description:', error);
  res.status(500).json({
    success: false,
    message: 'User-friendly error message',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});
```

### Frontend Error Pattern
```javascript
// API call error handling
try {
  const response = await apiRequest('endpoint', { method: 'POST', body: data });
  const result = await response.json();
  
  if (response.ok) {
    alert('Success message');
    // Update state
  } else {
    alert(`Error: ${result.error || 'Operation failed'}`);
  }
} catch (error) {
  console.error('Network error:', error);
  alert('Network error occurred');
}
```

## Testing Practices

### Backend Testing (Jest + Supertest)
- Unit tests for controllers in `server/__tests__/`
- Integration tests for API endpoints
- Mock database connections for isolated testing
- Test file naming: `*.test.js`

### Python Testing (pytest)
- Integration tests in `tests/` directory
- Mock external dependencies (OCR, database)
- Fixtures for reusable test data
- Test file naming: `test_*.py`

**Python Test Pattern**:
```python
@pytest.fixture
def mock_database_connection():
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    return mock_conn, mock_cursor

def test_feature_with_mocks(mock_database_connection):
    mock_conn, mock_cursor = mock_database_connection
    # Test implementation
    assert result == expected
```

## Common Code Idioms

### Async/Await Pattern (JavaScript)
```javascript
// Always use try-catch with async/await
const loadData = async () => {
  setLoading(true);
  try {
    const response = await apiRequest('endpoint');
    const data = await response.json();
    setData(data);
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    setLoading(false);
  }
};
```

### Environment Configuration
```javascript
// Server-side (Node.js)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clearpass'
};

// Client-side (Vite)
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### Conditional Rendering (React)
```jsx
// Loading state
{loading && <CircularProgress />}

// Conditional content
{user?.role === 'admin' && (
  <Button onClick={handleAdminAction}>Admin Action</Button>
)}

// Ternary for alternatives
{isActive ? <ActiveComponent /> : <InactiveComponent />}

// Array mapping
{items.map((item) => (
  <ListItem key={item.id}>{item.name}</ListItem>
))}
```

### Database Transaction Pattern
```javascript
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  
  // Multiple related operations
  const [result1] = await connection.execute(query1, params1);
  const [result2] = await connection.execute(query2, params2);
  
  await connection.commit();
  return result1.insertId;
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

## API Design Patterns

### RESTful Endpoint Structure
- **GET** `/api/resource` - List all resources
- **GET** `/api/resource/:id` - Get single resource
- **POST** `/api/resource` - Create new resource
- **PUT** `/api/resource/:id` - Update entire resource
- **PATCH** `/api/resource/:id` - Partial update
- **DELETE** `/api/resource/:id` - Delete resource

### Response Format Standards
```javascript
// Success response
{
  success: true,
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 100
  }
}

// Error response
{
  success: false,
  message: 'User-friendly error message',
  error: 'Technical error details',
  code: 400,
  timestamp: '2024-01-15T10:00:00Z'
}
```

### Pagination Pattern
```javascript
const { page = 1, limit = 20 } = req.query;
const offset = (page - 1) * limit;

const [rows] = await db.execute(
  'SELECT * FROM table LIMIT ? OFFSET ?',
  [parseInt(limit), offset]
);

res.json({
  success: true,
  data: rows,
  pagination: { page: parseInt(page), limit: parseInt(limit) }
});
```

## File Organization Best Practices

### Backend Structure
```
server/
├── controllers/      # Business logic handlers
├── routes/          # API route definitions
├── middleware/      # Request processing middleware
├── config/          # Configuration constants
├── migrations/      # Database schema migrations
├── seeds/           # Database seed data
├── utils/           # Utility functions
├── __tests__/       # Unit and integration tests
└── index.js         # Main application entry point
```

### Frontend Structure
```
client/src/
├── components/      # Reusable UI components
├── pages/          # Route-level page components
├── contexts/       # React Context providers
├── utils/          # Helper functions and API client
├── __tests__/      # Component tests
├── App.jsx         # Root application component
└── main.jsx        # Application entry point
```

## Performance Optimization

### Database Optimization
- **Indexes**: Created on frequently queried columns (foreign keys, search fields)
- **Connection Pooling**: MySQL2 connection pool with 10 connections
- **Query Optimization**: Use EXPLAIN to analyze slow queries
- **Pagination**: Always paginate large result sets

### Frontend Optimization
- **Code Splitting**: Vite automatic code splitting by route
- **Lazy Loading**: React.lazy() for heavy components
- **Memoization**: useMemo and useCallback for expensive computations
- **Asset Optimization**: Image compression, minification in production build

## Logging Standards

### Backend Logging (Winston)
```javascript
logger.info('User logged in', { userId: user.id, timestamp: new Date() });
logger.error('Database error', { error: error.message, stack: error.stack });
logger.warn('Rate limit exceeded', { ip: req.ip });
```

### Console Logging Conventions
- **Emoji Prefixes**: 🔧 (config), ✅ (success), ❌ (error), 📊 (data), 🚀 (startup)
- **Structured Logs**: Include context (timestamps, user IDs, request IDs)
- **Production**: Minimal console.log, use Winston for file logging

## Deployment Considerations

### Environment Variables
- **Required**: DB_HOST, DB_USER, DB_NAME, JWT_SECRET
- **Optional**: DB_PASSWORD (empty for XAMPP default)
- **Client**: VITE_API_URL for API endpoint configuration
- **Validation**: Startup validation checks for required variables

### Build Process
```bash
# Install dependencies
npm run install:all

# Development
npm run dev:all  # Concurrent client, server, AI service

# Production
npm run build    # Build client static files
npm start        # Start production server
```

### Database Migrations
```bash
cd server
npx knex migrate:latest    # Run pending migrations
npx knex migrate:rollback  # Rollback last migration
npx knex seed:run          # Run seed data
```

## Code Review Checklist

- [ ] No hardcoded credentials or secrets
- [ ] Input validation on all user inputs
- [ ] Parameterized queries (no string concatenation)
- [ ] Error handling with try-catch blocks
- [ ] Consistent naming conventions followed
- [ ] Comments explain complex logic
- [ ] No console.log in production code paths
- [ ] Authentication/authorization checks on protected routes
- [ ] Rate limiting applied to sensitive endpoints
- [ ] Response format follows API standards
- [ ] Database transactions for multi-step operations
- [ ] File uploads validated (type, size)
- [ ] CORS configuration reviewed
- [ ] Environment variables used for configuration
- [ ] Tests written for new features
