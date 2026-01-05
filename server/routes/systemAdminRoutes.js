const express = require('express');
const SystemAdminController = require('../controllers/systemAdminController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

module.exports = (db) => {
  const router = express.Router();
  const controller = new SystemAdminController(db);

  // Backup & Restore (Admin only)
  router.post('/backup', verifyToken, checkRole([5]), (req, res) => controller.createBackup(req, res));

  // System Settings (Admin & Secretary)
  router.get('/settings', verifyToken, checkRole([3, 5]), (req, res) => controller.getSettings(req, res));
  router.put('/settings', verifyToken, checkRole([3, 5]), (req, res) => controller.updateSettings(req, res));
  router.post('/upload-seal', verifyToken, checkRole([3, 5]), upload.single('file'), (req, res) => controller.uploadSeal(req, res));
  router.get('/export-settings', verifyToken, checkRole([3, 5]), (req, res) => controller.exportSettings(req, res));
  router.post('/reset-settings', verifyToken, checkRole([3, 5]), (req, res) => controller.resetSettings(req, res));

  // Legacy settings endpoints
  router.get('/system-settings', verifyToken, checkRole([3, 5]), (req, res) => controller.getSystemSettings(req, res));
  router.put('/system-settings', verifyToken, checkRole([3, 5]), (req, res) => controller.updateSystemSettings(req, res));

  // Announcements Management (Captain, Secretary, Admin)
  router.post('/announcements', verifyToken, checkRole([2, 3, 5]), (req, res) => controller.createAnnouncement(req, res));
  router.get('/announcements', verifyToken, checkRole([2, 3, 5]), (req, res) => controller.getAnnouncements(req, res));

  // Public announcements for residents
  router.get('/announcements/public', verifyToken, checkRole([12]), (req, res) => controller.getResidentAnnouncements(req, res));

  return router;
};