const { body, validationResult } = require('express-validator');
const xss = require('xss');

// Custom sanitization middleware for XSS protection
const sanitizeInput = (value) => {
  if (typeof value === 'string') {
    // Remove potential XSS attacks
    return xss(value.trim());
  }
  return value;
};

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      })),
      code: 400,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  }
  next();
};

// Validation chains for different endpoints

// Authentication validation
const validateLogin = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .customSanitizer(sanitizeInput),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .customSanitizer(sanitizeInput),

  handleValidationErrors
];

const validateRegister = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .customSanitizer(sanitizeInput),

  body('full_name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .customSanitizer(sanitizeInput),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .customSanitizer(sanitizeInput),

  body('contact_number')
    .optional()
    .matches(/^(\+63|63|0)[0-9]{10}$/)
    .withMessage('Please provide a valid Philippine mobile number')
    .customSanitizer(sanitizeInput),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
    .customSanitizer(sanitizeInput),

  body('role')
    .isInt({ min: 1, max: 6 })
    .withMessage('Role must be a valid integer between 1 and 6'),

  handleValidationErrors
];

// Blotter validation
const validateBlotter = [
  body('Case_Number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Case number must not exceed 50 characters')
    .customSanitizer(sanitizeInput),

  body('Incident_Type')
    .notEmpty()
    .withMessage('Incident type is required')
    .isLength({ max: 100 })
    .withMessage('Incident type must not exceed 100 characters')
    .customSanitizer(sanitizeInput),

  body('Complainant_Details')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Complainant details must not exceed 1000 characters')
    .customSanitizer(sanitizeInput),

  body('Respondent_Details')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Respondent details must not exceed 1000 characters')
    .customSanitizer(sanitizeInput),

  body('Narrative')
    .notEmpty()
    .withMessage('Incident narrative is required')
    .isLength({ max: 2000 })
    .withMessage('Narrative must not exceed 2000 characters')
    .customSanitizer(sanitizeInput),

  body('Location_Sitio')
    .notEmpty()
    .withMessage('Location/Sitio is required')
    .isLength({ max: 100 })
    .withMessage('Location/Sitio must not exceed 100 characters')
    .customSanitizer(sanitizeInput),

  body('DateTime_Incident')
    .optional()
    .isISO8601()
    .withMessage('Invalid date/time format'),

  body('respondent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Respondent ID must be a valid positive integer'),

  handleValidationErrors
];

// Resident validation
const validateResident = [
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .customSanitizer(sanitizeInput),

  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .customSanitizer(sanitizeInput),

  body('middle_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Middle name must not exceed 50 characters')
    .customSanitizer(sanitizeInput),

  body('suffix')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Suffix must not exceed 10 characters')
    .customSanitizer(sanitizeInput),

  body('birthdate')
    .notEmpty()
    .withMessage('Birthdate is required')
    .isISO8601()
    .withMessage('Please provide a valid birthdate'),

  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),

  body('civil_status')
    .optional()
    .isIn(['Single', 'Married', 'Widowed', 'Divorced', 'Separated'])
    .withMessage('Civil status must be a valid option'),

  body('occupation')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Occupation must not exceed 100 characters')
    .customSanitizer(sanitizeInput),

  body('mobile_number')
    .optional()
    .matches(/^(\+63|63|0)[0-9]{10}$/)
    .withMessage('Please provide a valid Philippine mobile number')
    .customSanitizer(sanitizeInput),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .customSanitizer(sanitizeInput),

  body('household_id')
    .notEmpty()
    .withMessage('Household ID is required')
    .matches(/^H-\d{10}-[A-Z0-9]{8}$/)
    .withMessage('Invalid household ID format'),

  body('relation_to_head')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Relation to head must not exceed 50 characters')
    .customSanitizer(sanitizeInput),

  body('income_estimate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Income estimate must be a positive number'),

  handleValidationErrors
];

// Certificate validation
const validateCertificateRequest = [
  body('certificate_type_id')
    .notEmpty()
    .withMessage('Certificate type is required')
    .isInt({ min: 1 })
    .withMessage('Certificate type ID must be a valid positive integer'),

  body('purpose')
    .notEmpty()
    .withMessage('Purpose is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Purpose must be between 10 and 500 characters')
    .customSanitizer(sanitizeInput),

  body('resident_id')
    .notEmpty()
    .withMessage('Resident ID is required')
    .matches(/^RES-\d{6}-[A-Z0-9]{8}$/)
    .withMessage('Invalid resident ID format'),

  handleValidationErrors
];

// Document request validation
const validateDocumentRequest = [
  body('document_type')
    .notEmpty()
    .withMessage('Document type is required')
    .isLength({ max: 100 })
    .withMessage('Document type must not exceed 100 characters')
    .customSanitizer(sanitizeInput),

  body('purpose')
    .notEmpty()
    .withMessage('Purpose is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Purpose must be between 10 and 500 characters')
    .customSanitizer(sanitizeInput),

  body('urgency')
    .optional()
    .isIn(['normal', 'urgent', 'emergency'])
    .withMessage('Urgency must be normal, urgent, or emergency'),

  handleValidationErrors
];

// Community program validation
const validateCommunityProgram = [
  body('program_name')
    .notEmpty()
    .withMessage('Program name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Program name must be between 3 and 200 characters')
    .customSanitizer(sanitizeInput),

  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
    .customSanitizer(sanitizeInput),

  body('program_date')
    .notEmpty()
    .withMessage('Program date is required')
    .isISO8601()
    .withMessage('Please provide a valid program date'),

  body('sitio_id')
    .notEmpty()
    .withMessage('Sitio ID is required')
    .isInt({ min: 1 })
    .withMessage('Sitio ID must be a valid positive integer'),

  body('target_beneficiaries')
    .optional()
    .isArray()
    .withMessage('Target beneficiaries must be an array'),

  body('budget_allocated')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget allocated must be a positive number'),

  handleValidationErrors
];

// Household validation
const validateHousehold = [
  body('Household_Number')
    .notEmpty()
    .withMessage('Household number is required')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Household number can only contain letters, numbers, and hyphens')
    .customSanitizer(sanitizeInput),

  body('Sitio_ID')
    .notEmpty()
    .withMessage('Sitio ID is required')
    .isInt({ min: 1 })
    .withMessage('Sitio ID must be a valid positive integer'),

  body('Street_Address')
    .notEmpty()
    .withMessage('Street address is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters')
    .customSanitizer(sanitizeInput),

  body('Household_Type')
    .optional()
    .isIn(['Nuclear', 'Extended', 'Single-Parent', 'Multi-Generational'])
    .withMessage('Household type must be a valid option'),

  handleValidationErrors
];

// AI Chatbot validation
const validateChatbotMessage = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters')
    .customSanitizer(sanitizeInput),

  body('session_id')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Session ID must not exceed 100 characters')
    .customSanitizer(sanitizeInput),

  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be a valid object'),

  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateRegister,
  validateBlotter,
  validateResident,
  validateCertificateRequest,
  validateDocumentRequest,
  validateCommunityProgram,
  validateHousehold,
  validateChatbotMessage,
  handleValidationErrors,
  sanitizeInput
};
