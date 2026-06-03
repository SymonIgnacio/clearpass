const fs = require('fs');
const path = require('path');

const FILE_TYPES = {
  pdf: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    matches: buffer => buffer.subarray(0, 5).equals(Buffer.from('%PDF-')),
  },
  jpeg: {
    extensions: ['.jpg', '.jpeg'],
    mimeTypes: ['image/jpeg'],
    matches: buffer => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  png: {
    extensions: ['.png'],
    mimeTypes: ['image/png'],
    matches: buffer => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  gif: {
    extensions: ['.gif'],
    mimeTypes: ['image/gif'],
    matches: buffer => ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii')),
  },
};

const getFileHeader = file => {
  if (Buffer.isBuffer(file.buffer)) {
    return file.buffer.subarray(0, 16);
  }

  if (file.path && fs.existsSync(file.path)) {
    const descriptor = fs.openSync(file.path, 'r');
    try {
      const header = Buffer.alloc(16);
      const bytesRead = fs.readSync(descriptor, header, 0, header.length, 0);
      return header.subarray(0, bytesRead);
    } finally {
      fs.closeSync(descriptor);
    }
  }

  return Buffer.alloc(0);
};

const detectFileType = file => {
  const header = getFileHeader(file);
  return Object.entries(FILE_TYPES).find(([, config]) => config.matches(header))?.[0] || null;
};

const hasUnsafeFilename = filename => {
  const value = String(filename || '');
  return !value || value.includes('\0') || value.includes('/') || value.includes('\\') || path.basename(value) !== value;
};

const getFileSize = file => {
  if (typeof file.size === 'number') {
    return file.size;
  }

  if (Buffer.isBuffer(file.buffer)) {
    return file.buffer.length;
  }

  if (file.path && fs.existsSync(file.path)) {
    return fs.statSync(file.path).size;
  }

  return null;
};

const validateUploadedFile = (file, allowedTypes = Object.keys(FILE_TYPES), options = {}) => {
  if (!file) {
    return { valid: true };
  }

  if (hasUnsafeFilename(file.originalname)) {
    return { valid: false, error: 'Uploaded filename must not include path segments' };
  }

  const fileSize = getFileSize(file);
  if (options.maxSizeBytes && fileSize !== null && fileSize > options.maxSizeBytes) {
    return { valid: false, error: 'Uploaded file exceeds the allowed size' };
  }

  const detectedType = detectFileType(file);
  if (!detectedType || !allowedTypes.includes(detectedType)) {
    return { valid: false, error: 'Uploaded file content is not an allowed file type' };
  }

  const config = FILE_TYPES[detectedType];
  const extension = path.extname(file.originalname || '').toLowerCase();
  const mimeType = String(file.mimetype || '').toLowerCase();

  if (!config.extensions.includes(extension)) {
    return { valid: false, error: 'Uploaded file extension does not match its content' };
  }

  if (!config.mimeTypes.includes(mimeType)) {
    return { valid: false, error: 'Uploaded file MIME type does not match its content' };
  }

  return { valid: true, detectedType };
};

const collectUploadedFiles = req => {
  if (req.file) {
    return [req.file];
  }

  if (Array.isArray(req.files)) {
    return req.files;
  }

  if (req.files && typeof req.files === 'object') {
    return Object.values(req.files).flat();
  }

  return [];
};

const removeDiskFile = file => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};

const validateUploadedFiles = (allowedTypes = Object.keys(FILE_TYPES), options = {}) => (req, res, next) => {
  const files = collectUploadedFiles(req);

  for (const file of files) {
    const result = validateUploadedFile(file, allowedTypes, options);
    if (!result.valid) {
      files.forEach(removeDiskFile);
      return res.status(400).json({ error: result.error });
    }
  }

  return next();
};

module.exports = {
  FILE_TYPES,
  collectUploadedFiles,
  detectFileType,
  hasUnsafeFilename,
  validateUploadedFile,
  validateUploadedFiles,
};
