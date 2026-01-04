const express = require('express');
const router = express.Router();
const { verifyToken, checkRole, authenticate } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const blotterController = require('../controllers/blotterController');

module.exports = (db) => {
  // GET all blotter records
  router.get('/', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk', 'blotter_officer']), asyncHandler(blotterController.getAll));
  
  // POST create blotter entry
  router.post('/', verifyToken, checkRole(['admin', 'secretary', 'clerk', 'blotter_officer']), asyncHandler(blotterController.create));
  
  // PUT update blotter entry
  router.put('/:caseNumber', verifyToken, checkRole(['admin', 'secretary', 'clerk', 'blotter_officer']), asyncHandler(blotterController.update));
  
  // DELETE blotter entry
  router.delete('/:caseNumber', verifyToken, checkRole(['admin', 'secretary']), asyncHandler(blotterController.delete));
  
  // Legacy route for file-online
  router.post('/file-online', authenticate, asyncHandler(async (req, res) => {
    // Redirect to main create endpoint
    req.url = '/';
    req.method = 'POST';
    return blotterController.create(req, res);
  }));

  return router;
};
