const express = require('express');
const SystemAdminController = require('../controllers/systemAdminController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ROLES } = require('../config/roles');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const assetsDir = path.join(__dirname, '../uploads/system-assets');
ensureDir(assetsDir);

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, assetsDir),
    filename: (req, file, cb) => {
      const safeType = String(req.body?.type || 'asset')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '');
      const ext = path.extname(file.originalname || '').toLowerCase();
      const rand = Math.random().toString(36).slice(2, 10);
      cb(null, `${safeType}-${Date.now()}-${rand}${ext}`);
    }
  }),
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

  router.post('/backup', verifyToken, checkRole([ROLES.ADMIN]), (req, res) => controller.createBackup(req, res));

  router.get('/settings', verifyToken, checkRole([ROLES.ADMIN, ROLES.SECRETARY]), (req, res) => controller.getSettings(req, res));
  router.put('/settings', verifyToken, checkRole([ROLES.ADMIN, ROLES.SECRETARY]), (req, res) => controller.updateSettings(req, res));
  router.post('/upload-seal', verifyToken, checkRole([ROLES.ADMIN, ROLES.SECRETARY]), upload.single('file'), (req, res) => controller.uploadSeal(req, res));
  router.get('/assets/:type/latest', verifyToken, checkRole([ROLES.ADMIN, ROLES.SECRETARY]), (req, res) => controller.getLatestAsset(req, res));
  router.get('/export-settings', verifyToken, checkRole([ROLES.ADMIN, ROLES.SECRETARY]), (req, res) => controller.exportSettings(req, res));
  router.post('/reset-settings', verifyToken, checkRole([ROLES.ADMIN, ROLES.SECRETARY]), (req, res) => controller.resetSettings(req, res));

  router.get('/system-settings', verifyToken, checkRole([ROLES.ADMIN, ROLES.SECRETARY]), (req, res) => controller.getSystemSettings(req, res));
  router.put('/system-settings', verifyToken, checkRole([ROLES.ADMIN, ROLES.SECRETARY]), (req, res) => controller.updateSystemSettings(req, res));

  router.post('/announcements', verifyToken, checkRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY]), (req, res) => controller.createAnnouncement(req, res));
  router.get('/announcements', verifyToken, checkRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY]), (req, res) => controller.getAnnouncements(req, res));

  router.get('/announcements/public', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) => controller.getResidentAnnouncements(req, res));

  return router;
};
