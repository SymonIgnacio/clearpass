const express = require('express');
const multer = require('multer');
const CertificateRequestController = require('../controllers/certificateRequestController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = db => {
  const router = express.Router();
  const controller = new CertificateRequestController(db);

  // Get available certificate types
  router.get('/types', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) =>
    controller.getCertificateTypes(req, res)
  );

  // Get available templates (Dynamic)
  router.get('/templates', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) =>
    controller.getAvailableTemplates(req, res)
  );

  // Submit new certificate request
  router.post(
    '/submit',
    verifyToken,
    checkRole([ROLES.RESIDENT, ROLES.ADMIN]),
    upload.fields([
      { name: 'front_id', maxCount: 1 },
      { name: 'back_id', maxCount: 1 },
    ]),
    (req, res) => controller.submitRequest(req, res)
  );

  // Get my requests
  router.get('/my-requests', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) =>
    controller.getMyRequests(req, res)
  );

  // Cancel request
  router.put('/:request_id/cancel', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) =>
    controller.cancelRequest(req, res)
  );

  // --- STAFF ROUTES ---

  // Get all requests (Staff)
  router.get(
    '/admin/all',
    verifyToken,
    checkRole([ROLES.ADMIN, ROLES.SECRETARY, ROLES.CLERK]),
    (req, res) => controller.getAllRequests(req, res)
  );

  // Get request attachment (Staff)
  router.get(
    '/:request_id/attachment/:type',
    verifyToken,
    checkRole([ROLES.ADMIN, ROLES.SECRETARY, ROLES.CLERK]),
    (req, res) => controller.getRequestAttachment(req, res)
  );

  // Update request status (Staff)
  router.put(
    '/:request_id/status',
    verifyToken,
    checkRole([ROLES.ADMIN, ROLES.SECRETARY, ROLES.CLERK]),
    (req, res) => controller.updateRequestStatus(req, res)
  );

  // Update request details (Staff)
  router.put(
    '/:request_id/details',
    verifyToken,
    checkRole([ROLES.ADMIN, ROLES.SECRETARY, ROLES.CLERK]),
    (req, res) => controller.updateRequestDetails(req, res)
  );

  return router;
};
