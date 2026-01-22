const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');
const validator = require('validator');

// Enhanced XSS sanitization options
const xssOptions = {
  whiteList: {
    a: ['href', 'title', 'target'],
    b: [],
    i: [],
    em: [],
    strong: [],
    p: [],
    br: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script'],
  onTagAttr: function (tag, name, value, isWhiteAttr) {
    if (tag === 'a' && name === 'href') {
      // Validate href attribute
      if (!validator.isURL(value, { protocols: ['http', 'https', 'mailto'] })) {
        return;
      }
    }
  },
};

// Enhanced XSS sanitization middleware
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Remove potentially dangerous characters before XSS filtering
        req.body[key] = req.body[key].replace(/[\x00-\x1F\x7F]/g, '').trim();
        req.body[key] = xss(req.body[key], xssOptions);
      }
    }
  }
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].replace(/[\x00-\x1F\x7F]/g, '').trim();
        req.query[key] = xss(req.query[key], xssOptions);
      }
    }
  }
  next();
};

// Custom validation helpers
const validateResidentId = value => {
  if (!value) return false;
  return /^RES-[a-zA-Z0-9\-]+$/.test(value);
};

const validateCaseNumber = value => {
  if (!value) return false;
  return /^BLOT-\d{4}-\d{2}-\d{4}$/.test(value);
};

const validateEmail = value => {
  if (!value) return true;
  return validator.isEmail(value);
};

const validatePhoneNumber = value => {
  if (!value) return true;
  return /^(\+63|09)\d{9,10}$/.test(value);
};

// Enhanced validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    // Log validation attempts for security monitoring
    console.warn(`Validation failed: ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      errors: errorMessages,
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
  }
  next();
};

// Enhanced resident validation schemas
const validateResident = [
  body('First_Name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be 1-100 characters')
    .matches(/^[a-zA-Z\s\-.']+$/)
    .withMessage('First name contains invalid characters')
    .customSanitizer(value => xss(value, xssOptions)),

  body('Last_Name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be 1-100 characters')
    .matches(/^[a-zA-Z\s\-.']+$/)
    .withMessage('Last name contains invalid characters')
    .customSanitizer(value => xss(value, xssOptions)),

  body('Middle_Name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Middle name cannot exceed 100 characters')
    .matches(/^[a-zA-Z\s\-.']*$/)
    .withMessage('Middle name contains invalid characters')
    .customSanitizer(value => xss(value, xssOptions)),

  body('Birthdate')
    .isISO8601()
    .withMessage('Invalid birthdate format')
    .custom(value => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 120) {
        throw new Error('Birthdate must be between 0 and 120 years ago');
      }
      return true;
    }),

  body('Gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),

  body('Civil_Status')
    .optional()
    .isIn(['Single', 'Married', 'Widowed', 'Separated', 'Divorced'])
    .withMessage('Invalid civil status'),

  body('Email').optional().custom(validateEmail).normalizeEmail(),

  body('Mobile_Number').optional().custom(validatePhoneNumber),

  body('Household_ID')
    .optional()
    .matches(/^HH-[a-zA-Z0-9\-]+$/)
    .withMessage('Invalid household ID format'),

  body('Relation_to_Head')
    .optional()
    .isIn(['Head', 'Spouse', 'Child', 'Relative', 'Boarder'])
    .withMessage('Invalid relation to household head'),

  handleValidationErrors,
];

// Enhanced blotter validation schemas
const validateBlotter = [
  body('Case_Number').optional().custom(validateCaseNumber),

  body('Complainant_Details')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Complainant details must be 10-2000 characters')
    .customSanitizer(value => xss(value, xssOptions)),

  body('Respondent_Details')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Respondent details cannot exceed 2000 characters')
    .customSanitizer(value => xss(value, xssOptions)),

  body('Incident_Type')
    .isIn([
      'Physical Injury',
      'Unjust Vexation',
      'Grave Threats',
      'Alarming and Scandal',
      'Theft (Petty)',
      'Malicious Mischief',
      'Estafa (Swindling)',
      'Trespassing',
      'Collection of Sum of Money',
      'Ejectment',
      'Boundary Dispute',
      'Family Dispute',
      'Curfew Violation',
      'Noise Barrage',
      'Illegal Parking',
      'Waste Management',
      'Stray Animals',
    ])
    .withMessage('Invalid incident type'),

  body('Narrative')
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Narrative must be 20-5000 characters')
    .customSanitizer(value => xss(value, xssOptions)),

  body('DateTime_Incident')
    .isISO8601()
    .withMessage('Invalid incident date-time format')
    .custom(value => {
      const incidentDate = new Date(value);
      const today = new Date();
      if (incidentDate > today) {
        throw new Error('Incident date cannot be in the future');
      }
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      if (incidentDate < oneYearAgo) {
        throw new Error('Incident date cannot be more than 1 year old');
      }
      return true;
    }),

  body('Location_Sitio')
    .isIn(['Batia Proper', 'Northville 5', 'St. Martha', 'AFP/PNP'])
    .withMessage('Invalid sitio location'),

  body('complainant_resident_id').optional().custom(validateResidentId),

  body('respondent_resident_id').optional().custom(validateResidentId),

  handleValidationErrors,
];

// Enhanced certificate validation schemas
const validateCertificate = [
  body('resident_id').custom(validateResidentId).withMessage('Invalid resident ID format'),

  body('certificate_type')
    .isIn([
      'Clearance',
      'Residency',
      'Indigency',
      'Business',
      'Good Moral',
      'Low Income',
      'Certification',
      'Oath',
    ])
    .withMessage('Invalid certificate type'),

  body('purpose')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Purpose must be 5-500 characters')
    .customSanitizer(value => xss(value, xssOptions)),

  body('date_issued')
    .isISO8601()
    .withMessage('Invalid issue date format')
    .custom(value => {
      const issueDate = new Date(value);
      const today = new Date();
      if (issueDate > today) {
        throw new Error('Issue date cannot be in the future');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['Paid', 'Released', 'Cancelled'])
    .withMessage('Invalid certificate status'),

  handleValidationErrors,
];

// Enhanced document request validation schemas
const validateDocumentRequest = [
  body('resident_id').custom(validateResidentId).withMessage('Invalid resident ID format'),

  body('document_type')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Document type is required (1-50 chars)')
    .matches(/^[a-zA-Z\s\-]+$/)
    .withMessage('Document type contains invalid characters')
    .customSanitizer(value => xss(value, xssOptions)),

  body('purpose')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Purpose max 200 chars')
    .customSanitizer(value => xss(value, xssOptions)),

  body('urgency')
    .optional()
    .isIn(['Normal', 'Urgent', 'Emergency'])
    .withMessage('Invalid urgency level'),

  handleValidationErrors,
];

// Enhanced login validation
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username required (3-50 chars)')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  handleValidationErrors,
];

// Parameter validation
const validateResidentIdParam = [
  param('id').custom(validateResidentId).withMessage('Invalid resident ID format'),
  handleValidationErrors,
];

const validateCaseNumberParam = [
  param('caseNumber').custom(validateCaseNumber).withMessage('Invalid case number format'),
  handleValidationErrors,
];

// Enhanced search query validation
const validateSearch = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be 1-100 characters')
    .customSanitizer(value => xss(value, xssOptions)),

  handleValidationErrors,
];

// General ID validation
const validateId = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('ID parameter is required')
    .customSanitizer(value => xss(value, xssOptions)),
  handleValidationErrors,
];

module.exports = {
  validateResident: validateResident,
  validateBlotter: validateBlotter,
  validateCertificate: validateCertificate,
  validateDocumentRequest: validateDocumentRequest,
  validateLogin: validateLogin,
  validateResidentIdParam: validateResidentIdParam,
  validateCaseNumberParam: validateCaseNumberParam,
  validateSearch: validateSearch,
  validateId: validateId,
  handleValidationErrors: handleValidationErrors,
  sanitizeInput: sanitizeInput,
  validateResidentId: validateResidentId,
  validateCaseNumber: validateCaseNumber,
  validateEmail: validateEmail,
  validatePhoneNumber: validatePhoneNumber,
};
