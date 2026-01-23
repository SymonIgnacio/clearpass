// Standard error response format for ClearPass
const createErrorResponse = (message, statusCode = 500, details = null) => {
  return {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    },
  };
};

const createSuccessResponse = (data = null, message = 'Operation successful') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

// Async handler wrapper to catch async errors
const asyncHandler = fn => {
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

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json(createErrorResponse('File too large. Max 5MB', 400));
  }
  if (typeof err.message === 'string' && err.message.includes('Only images and PDFs are allowed')) {
    return res
      .status(400)
      .json(createErrorResponse('Invalid file type. Only images/PDFs allowed', 400));
  }
  if (typeof err.message === 'string' && err.message.includes('Only image files are allowed')) {
    return res.status(400).json(createErrorResponse('Invalid file type. Only images allowed', 400));
  }

  // CSRF Error
  if (err.code === 'EBADCSRFTOKEN') {
    return res
      .status(403)
      .json(createErrorResponse('Invalid CSRF token', 403, { code: 'EBADCSRFTOKEN' }));
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
  asyncHandler,
};
