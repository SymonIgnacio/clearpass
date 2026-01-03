const validator = require('validator');

// Validation middleware for common input patterns
const validate = {
  // Email validation
  email: (req, res, next) => {
    const { email } = req.body;
    if (email && !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    next();
  },

  // Mobile number validation (Philippine format)
  mobileNumber: (req, res, next) => {
    const { mobile_number, Mobile_Number, contact_number } = req.body;
    const mobile = mobile_number || Mobile_Number || contact_number;
    
    if (mobile && !validator.isMobilePhone(mobile, 'en-PH')) {
      return res.status(400).json({ error: 'Invalid Philippine mobile number format' });
    }
    next();
  },

  // Required fields validation
  required: (fields) => (req, res, next) => {
    const missing = fields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        fields: missing 
      });
    }
    next();
  },

  // Sanitize all string inputs
  sanitize: (req, res, next) => {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = validator.escape(req.body[key].trim());
        }
      });
    }
    next();
  },

  // ID parameter validation
  id: (req, res, next) => {
    const { id } = req.params;
    if (!validator.isAlphanumeric(id.replace(/-/g, ''))) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    next();
  }
};

module.exports = validate;
