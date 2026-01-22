const multer = require('multer');

const storage = multer.memoryStorage();
const limits = { fileSize: 10 * 1024 * 1024 }; // 10MB per file

function evidenceFileFilter(req, file, cb) {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/quicktime',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error('Invalid file type. Allowed: Images, PDFs, Documents, Videos (Max 10MB)'));
}

const uploadImages = multer({
  storage,
  limits,
  fileFilter: evidenceFileFilter,
});

const uploadEvidence = multer({
  storage,
  limits,
  fileFilter: evidenceFileFilter,
});

module.exports = {
  uploadImages,
  uploadEvidence,
};
