const express = require('express');
const CaseManagementController = require('../controllers/caseManagementController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

module.exports = (db) => {
  const router = express.Router();
  const controller = new CaseManagementController(db);

  // Get all cases for officer
  router.get('/cases', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.getCasesByOfficer(req, res));

  // Create new case
  router.post('/create', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.createCase(req, res));

  // Get case details
  router.get('/case/:case_id', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.getCaseDetails(req, res));

  // Update case status
  router.put('/case/:case_id/status', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.updateCaseStatus(req, res));

  // Add case note
  router.post('/case/:case_id/note', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.addCaseNote(req, res));

  // Generate QR code for hearing
  router.post('/case/:case_id/qr', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.generateQRCode(req, res));
  router.post('/generate-qr', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.generateQRCode(req, res));

  // Hearing and attendance management
  router.get('/hearings', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.getHearings(req, res));
  router.get('/attendance/:hearing_id', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.getAttendance(req, res));
  router.post('/mark-attendance', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.markAttendance(req, res));
  router.get('/attendance-report/:hearing_id', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.exportAttendanceReport(req, res));

  // Reports
  router.post('/reports', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.generateReport(req, res));
  router.post('/export-report', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.exportReport(req, res));

  return router;
};
