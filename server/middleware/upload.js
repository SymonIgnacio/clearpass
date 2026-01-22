const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage with enhanced security
const storage = multer.memoryStorage();

// Enhanced file filter with comprehensive security checks
const fileFilter = (req, file, cb) => {
  try {
    // Strict MIME type validation
    const allowedMimeTypes = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    };

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];

    // Get file extension
    const ext = path.extname(file.originalname).toLowerCase();

    // Validate MIME type and extension
    const allowedExtsForMime = allowedMimeTypes[file.mimetype];
    const isMimeAllowed = file.mimetype && allowedExtsForMime;
    const isExtAllowed = allowedExtensions.includes(ext);

    // Additional security: ensure MIME type matches extension
    const isExtensionValidForMime = isMimeAllowed && allowedExtsForMime.includes(ext);

    // Reject files with dangerous characters in filename
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(file.originalname)) {
      return cb(new Error('Filename contains invalid characters'));
    }

    // Reject double extensions (e.g., file.jpg.php)
    const parts = file.originalname.split('.');
    if (parts.length > 2) {
      return cb(new Error('Double extensions are not allowed'));
    }

    // File size validation (additional check)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size && file.size > maxSize) {
      return cb(new Error('File size exceeds 5MB limit'));
    }

    if (isMimeAllowed && isExtAllowed && isExtensionValidForMime) {
      return cb(null, true);
    } else {
      return cb(
        new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed`)
      );
    }
  } catch (error) {
    console.error('File filter error:', error);
    return cb(new Error('File validation failed'));
  }
};

// Sanitize filename
const sanitizeFilename = filename => {
  // Remove path traversal attempts
  const sanitized = filename.replace(/^\.+/, '').replace(/[\/\\]/g, '_');
  // Generate safe filename with timestamp and random string
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${name}_${timestamp}_${random}${ext}`;
};

// Enhanced multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5, // Maximum 5 files per request
    fields: 20, // Maximum 20 fields per request
    fieldNameSize: 100, // Maximum field name size
    fieldSize: 1024 * 1024, // Maximum field value size (1MB)
  },
  fileFilter: fileFilter,
  // Add filename sanitization
  rename: function (fieldname, filename) {
    return sanitizeFilename(filename);
  },
});

// Export with additional utilities
module.exports = {
  upload,
  sanitizeFilename,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
};
