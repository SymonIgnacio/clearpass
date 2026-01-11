const express = require('express');
const CertificateRequestController = require('../controllers/certificateRequestController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

module.exports = (db) => {
  const router = express.Router();
  const controller = new CertificateRequestController(db);

  // Get available certificate types
  router.get('/types', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) => controller.getCertificateTypes(req, res));

  // Submit new certificate request
  router.post('/submit', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) => controller.submitRequest(req, res));

  // Get my requests
  router.get('/my-requests', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) => controller.getMyRequests(req, res));

  // Cancel request
  router.put('/:request_id/cancel', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) => controller.cancelRequest(req, res));

  return router;
};
