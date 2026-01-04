# Middleware Directory

This directory contains all Express middleware for request processing.

## Middleware Components

### authMiddleware.js
- **Purpose**: JWT authentication and role-based authorization
- **Functions**:
  - `verifyToken`: Validates JWT tokens from Authorization header
  - `checkRole`: Enforces role-based access control (RBAC)
- **Usage**: Applied to protected routes
- **Error Codes**: 401 (Unauthorized), 403 (Forbidden)

### errorHandler.js
- **Purpose**: Centralized error handling
- **Functions**:
  - `errorHandler`: Main error handler middleware
  - `asyncHandler`: Async error wrapper
  - `AppError`: Custom error class
- **Error Codes**: 8 standardized codes (VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, DUPLICATE_ENTRY, DATABASE_ERROR, CLEARPASS_DENIED, INTERNAL_ERROR)
- **Response Format**:
  ```json
  {
    "success": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable message",
      "stack": "..." // development only
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
  ```

### validation.js
- **Purpose**: Input validation and sanitization
- **Features**:
  - Express-validator middleware chains
  - XSS protection
  - Input sanitization
  - Custom validators
- **Usage**: Applied to POST/PUT endpoints

### logger.js
- **Purpose**: Winston logging configuration
- **Features**:
  - Structured logging
  - Error logs: `server/logs/error.log`
  - Combined logs: `server/logs/combined.log`
  - Console output in development

### compression.js
- **Purpose**: Response compression (gzip)
- **Features**: Reduces response size for better performance

### performanceMetrics.js
- **Purpose**: Request tracking and metrics
- **Features**: Response time tracking, endpoint usage statistics

## Middleware Pipeline

Request flow through middleware:

```
Request
  → Rate Limiter (5-100 req/15min)
  → CORS
  → Helmet (security headers)
  → Body Parser (JSON)
  → Auth Middleware (verifyToken)
  → Validation Middleware
  → Route Handler (Controller)
  → Error Handler
  → Response
```

## Usage Examples

### Authentication
```javascript
router.get('/protected',
  verifyToken,
  checkRole(['admin', 'captain']),
  controller.method
);
```

### Error Handling
```javascript
const { AppError, ERROR_CODES } = require('../middleware/errorHandler');

throw new AppError('Not found', 404, ERROR_CODES.NOT_FOUND);
```

### Async Wrapper
```javascript
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));
```

## Security Features

- JWT token verification
- Role-based access control
- Rate limiting
- XSS protection
- SQL injection prevention (parameterized queries)
- Security headers (Helmet)
- CORS configuration

## Recent Updates (2024)

- Enhanced error handler with 8 error codes
- Added AppError class for custom errors
- Standardized error response format
- Stack traces only in development mode
- Timestamp added to all error responses
