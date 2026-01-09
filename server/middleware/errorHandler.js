// Standard error response format for ClearPass
const createErrorResponse = (message, statusCode = 500, details = null) => {
  return {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    }
  };
};

const createSuccessResponse = (data = null, message = 'Operation successful') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

// Async handler wrapper to catch async errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle specific error types
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json(createErrorResponse('Duplicate entry', 409));
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json(createErrorResponse('Invalid reference', 400));
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json(createErrorResponse('Validation failed', 400, err.details));
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json(createErrorResponse(message, statusCode));
};

module.exports = {
  createErrorResponse,
  createSuccessResponse,
  errorHandler,
  asyncHandler
};