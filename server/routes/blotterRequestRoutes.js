const express = require('express');
const BlotterRequestController = require('../controllers/blotterRequestController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadEvidence } = require('../middleware/imageUpload');

module.exports = db => {
  const router = express.Router();
  const controller = new BlotterRequestController(db);

  // Resident submission (multiple evidence files: images, PDFs, documents, videos)
  router.post(
    '/',
    verifyToken,
    checkRole([12]),
    uploadEvidence.array('images', 5),
    asyncHandler((req, res) => controller.submitRequest(req, res))
  );

  // Resident history
  router.get(
    '/my',
    verifyToken,
    checkRole([12]),
    asyncHandler((req, res) => controller.getMyRequests(req, res))
  );

  // Officer/Admin list and detail
  router.get(
    '/',
    verifyToken,
    checkRole(['blotter_officer', 'admin']),
    asyncHandler((req, res) => controller.listRequests(req, res))
  );
  router.get(
    '/:id',
    verifyToken,
    checkRole(['blotter_officer', 'admin']),
    asyncHandler((req, res) => controller.getRequestById(req, res))
  );

  // Start validation (assign, set due date)
  router.patch(
    '/:id/validate',
    verifyToken,
    checkRole(['blotter_officer', 'admin', 'secretary']),
    asyncHandler((req, res) => controller.validateRequest(req, res))
  );

  // Update investigation checklist and findings
  router.patch(
    '/:id/investigation',
    verifyToken,
    checkRole(['blotter_officer', 'admin']),
    asyncHandler((req, res) => controller.updateInvestigation(req, res))
  );

  // Log contact with complainant
  router.post(
    '/:id/contact-complainant',
    verifyToken,
    checkRole(['blotter_officer', 'admin']),
    asyncHandler((req, res) => controller.logContactComplainant(req, res))
  );

  // Add validation note with image evidence
  router.post(
    '/:id/add-note',
    verifyToken,
    checkRole(['blotter_officer', 'admin']),
    uploadEvidence.array('images', 5),
    asyncHandler((req, res) => controller.addValidationNote(req, res))
  );

  // Request info from resident
  router.post(
    '/:id/request-info',
    verifyToken,
    checkRole(['blotter_officer', 'admin']),
    asyncHandler((req, res) => controller.requestInfo(req, res))
  );

  // Resident respond with images
  router.post(
    '/:id/respond-info',
    verifyToken,
    checkRole([12]),
    uploadEvidence.array('images', 5),
    asyncHandler((req, res) => controller.respondInfo(req, res))
  );

  // Resident appeal rejected request
  router.post(
    '/:id/appeal',
    verifyToken,
    checkRole([12]),
    uploadEvidence.array('images', 5),
    asyncHandler((req, res) => controller.submitAppeal(req, res))
  );

  // Officer handle appeal (approve/deny)
  router.patch(
    '/:id/handle-appeal',
    verifyToken,
    checkRole(['blotter_officer', 'admin']),
    asyncHandler((req, res) => controller.handleAppeal(req, res))
  );

  // Bulk assign to officer
  router.post(
    '/bulk-assign',
    verifyToken,
    checkRole(['blotter_officer', 'admin']),
    asyncHandler((req, res) => controller.bulkAssign(req, res))
  );

  // Bulk request info from residents
  router.post(
    '/bulk-request-info',
    verifyToken,
    checkRole(['blotter_officer', 'admin']),
    asyncHandler((req, res) => controller.bulkRequestInfo(req, res))
  );

  // Approve/Reject
  router.patch(
    '/:id/status',
    verifyToken,
    checkRole([1, 6]), // Admin (1) and Blotter Officer (6)
    asyncHandler((req, res) => controller.setStatus(req, res))
  );

  return router;
};
