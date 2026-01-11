const express = require('express');
const router = express.Router();
const { verifyToken, checkRole, enforceReadOnly } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateResident, validateId, validateSearch, sanitizeInput } = require('../middleware/validation');
const residentController = require('../controllers/residentController');

module.exports = (db) => {
  // GET all residents
  router.get('/', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk']), validateSearch, asyncHandler(residentController.getAll));
  
  // GET current user's resident data
  router.get('/me', verifyToken, asyncHandler(async (req, res) => {
    const [rows] = await db.execute(`
      SELECT r.*, h.Household_Number, h.Street_Address, s.name as sitio_name
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE r.Resident_ID = ?
    `, [req.user.resident_id || req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Resident profile not found' });
    }
    
    res.json(rows[0]);
  }));
  
  // GET resident by ID
  router.get('/:id', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk']), validateId, asyncHandler(residentController.getById));
  
  // POST create resident with documents
  router.post('/', verifyToken, enforceReadOnly, residentController.uploadMiddleware, sanitizeInput, checkRole(['admin', 'secretary', 'clerk']), validateResident, asyncHandler(residentController.create));
  
  // POST open registration (no auth required)
  router.post('/open-register', residentController.uploadMiddleware, sanitizeInput, asyncHandler(residentController.openRegister));
  
  // POST check duplicate
  router.post('/check-duplicate', verifyToken, enforceReadOnly, checkRole(['admin', 'secretary', 'clerk']), asyncHandler(residentController.checkDuplicate));
  
  // PUT update resident
  router.put('/:id', verifyToken, enforceReadOnly, residentController.uploadMiddleware, checkRole(['admin', 'secretary', 'clerk']), validateId, asyncHandler(residentController.update));
  
  // DELETE (archive) resident
  router.delete('/:id', verifyToken, enforceReadOnly, checkRole(['admin', 'secretary']), validateId, asyncHandler(residentController.archive));
  
  // POST generate QR code
  router.post('/:id/qr', verifyToken, checkRole(['admin', 'secretary', 'clerk']), asyncHandler(residentController.generateQR));
  
  // GET household members
  router.get('/household/:id/members', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk']), asyncHandler(residentController.getHouseholdMembers));
  
  // POST file upload for verification
  router.post('/verification/upload', verifyToken, residentController.uploadMiddleware, asyncHandler(residentController.uploadVerificationDocs));

  router.get('/:id/documents', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk', 'resident']), validateId, asyncHandler(residentController.listDocuments));
  router.get('/:id/documents/:docId/download', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk', 'resident']), validateId, asyncHandler(residentController.downloadDocument));

  return router;
};
