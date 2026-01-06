const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');

// XSS sanitization middleware
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
};

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Resident validation schemas
const validateResident = [
  body('first_name').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required (1-50 chars)'),
  body('last_name').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required (1-50 chars)'),
  body('birthdate').isISO8601().withMessage('Valid birthdate required (YYYY-MM-DD)'),
  body('household_id').notEmpty().withMessage('Household ID is required'),
  body('gender').optional().isIn(['Male', 'Female']).withMessage('Gender must be Male or Female'),
  body('mobile_number').optional().isMobilePhone().withMessage('Valid mobile number required'),
  handleValidationErrors
];

// Blotter validation schemas
const validateBlotter = [
  body('Incident_Type').trim().isLength({ min: 1, max: 100 }).withMessage('Incident type is required'),
  body('Narrative').trim().isLength({ min: 10, max: 1000 }).withMessage('Narrative required (10-1000 chars)'),
  body('Location_Sitio').trim().isLength({ min: 1, max: 50 }).withMessage('Location is required'),
  body('Complainant_Details').isObject().withMessage('Complainant details must be an object'),
  handleValidationErrors
];

// Certificate validation schemas
const validateCertificate = [
  body('resident_id').notEmpty().withMessage('Resident ID is required'),
  body('certificate_type').trim().isLength({ min: 1, max: 50 }).withMessage('Certificate type is required'),
  body('purpose').optional().trim().isLength({ max: 200 }).withMessage('Purpose max 200 chars'),
  body('fee_amount').optional().isNumeric().withMessage('Fee amount must be numeric'),
  handleValidationErrors
];

// Document request validation schemas
const validateDocumentRequest = [
  body('resident_id').notEmpty().withMessage('Resident ID is required'),
  body('document_type').trim().isLength({ min: 1, max: 50 }).withMessage('Document type is required'),
  body('purpose').optional().trim().isLength({ max: 200 }).withMessage('Purpose max 200 chars'),
  body('urgency').optional().isIn(['Normal', 'Urgent', 'Emergency']).withMessage('Invalid urgency level'),
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username required (3-50 chars)'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id').notEmpty().withMessage('ID parameter is required'),
  handleValidationErrors
];

// Search query validation
const validateSearch = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be 1-1000'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term max 100 chars'),
  handleValidationErrors
];

module.exports = {
  validateResident,
  validateBlotter,
  validateCertificate,
  validateDocumentRequest,
  validateLogin,
  validateId,
  validateSearch,
  handleValidationErrors,
  sanitizeInput
};