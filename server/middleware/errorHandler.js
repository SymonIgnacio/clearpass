const { logger } = require('../monitoring');

/**
 * Centralized error handling middleware
 * Provides consistent error responses and logging across the application
 */
const errorHandler = (error, req, res, next) => {
  // Default error properties
  let statusCode = error.status || error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || statusCode;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation failed';
    code = 400;
  } else if (error.name === 'CastError') {
    // Mongoose cast error (invalid ID)
    statusCode = 400;
    message = 'Invalid data format';
    code = 400;
  } else if (error.code === 'ER_DUP_ENTRY') {
    // MySQL duplicate entry error
    statusCode = 409;
    message = 'Resource already exists';
    code = 409;
  } else if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === 'ER_ROW_IS_REFERENCED') {
    // MySQL foreign key constraint error
    statusCode = 400;
    message = 'Invalid reference - related resource not found';
    code = 400;
  } else if (error.code === 'ECONNREFUSED') {
    // Database connection error
    statusCode = 503;
    message = 'Service temporarily unavailable';
    code = 503;
  } else if (error.name === 'JsonWebTokenError') {
    // JWT error
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 401;
  } else if (error.name === 'TokenExpiredError') {
    // JWT expired
    statusCode = 401;
    message = 'Authentication token expired';
    code = 401;
  } else if (error.type === 'entity.parse.failed') {
    // Express body parser error
    statusCode = 400;
    message = 'Invalid request body format';
    code = 400;
  }

  // Log the error with appropriate level
  const logData = {
    message: error.message,
    stack: error.stack,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  };

  if (statusCode >= 500) {
    // Server errors - log as error
    logger.error('Unhandled server error', logData);
  } else if (statusCode >= 400 && statusCode < 500) {
    // Client errors - log as warning
    logger.warn('Client error', logData);
  } else {
    // Other errors - log as info
    logger.info('Request error', logData);
  }

  // In development, include stack trace and error details
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const errorResponse = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  // Add additional details in development mode
  if (isDevelopment) {
    errorResponse.error = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };

    // Include additional error details for specific types
    if (error.errors) {
      errorResponse.details = error.errors;
    }
  }

  // Ensure we don't leak sensitive information in production
  if (!isDevelopment) {
    // Remove any potentially sensitive data from error messages
    errorResponse.message = sanitizeErrorMessage(message);
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Sanitize error messages to prevent information leakage
 */
const sanitizeErrorMessage = (message) => {
  // Remove file paths, database details, etc.
  return message
    .replace(/\/[a-zA-Z0-9_/-]+\//g, '/[PATH]/') // File paths
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]') // IP addresses
    .replace(/password|token|key/gi, '[REDACTED]') // Sensitive keywords
    .replace(/at\s+\w+\s+\([^)]+\)/g, '[STACK]'); // Stack trace locations
};

/**
 * Handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  error.code = 404;

  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  next(error);
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create a custom error with additional properties
 */
const createError = (message, statusCode = 500, code = null) => {
  const error = new Error(message);
  error.status = statusCode;
  error.code = code || statusCode;
  return error;
};

/**
 * Handle database errors specifically
 */
const handleDatabaseError = (error, operation = 'database operation') => {
  logger.error(`Database error during ${operation}`, {
    error: error.message,
    code: error.code,
    sqlState: error.sqlState,
    errno: error.errno
  });

  // Convert database errors to appropriate HTTP errors
  if (error.code === 'ER_DUP_ENTRY') {
    return createError('Resource already exists', 409, 409);
  } else if (error.code === 'ER_NO_REFERENCED_ROW') {
    return createError('Referenced resource not found', 400, 400);
  } else if (error.code === 'ECONNREFUSED') {
    return createError('Database connection failed', 503, 503);
  }

  return createError('Database operation failed', 500, 500);
};

/**
 * Handle authentication errors
 */
const handleAuthError = (message = 'Authentication failed') => {
  return createError(message, 401, 401);
};

/**
 * Handle authorization errors
 */
const handleAuthorizationError = (message = 'Access denied') => {
  return createError(message, 403, 403);
};

/**
 * Handle validation errors
 */
const handleValidationError = (errors) => {
  const error = createError('Validation failed', 400, 400);
  error.details = errors;
  return error;
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError,
  handleDatabaseError,
  handleAuthError,
  handleAuthorizationError,
  handleValidationError,
  sanitizeErrorMessage
};
