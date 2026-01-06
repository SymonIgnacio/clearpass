const express = require('express');
const router = express.Router();
const { verifyToken, checkRole, authenticate } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const blotterController = require('../controllers/blotterController');

module.exports = (db) => {
  // GET all blotter records
  router.get('/', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk', 'blotter_officer']), asyncHandler(blotterController.getAll));
  
  // POST create blotter entry - ONLY Blotter Officer
  router.post('/', verifyToken, checkRole(['blotter_officer']), asyncHandler(async (req, res) => {
    const result = await blotterController.create(req, res);
    
    // Audit log
    if (req.app.locals.db) {
      await req.app.locals.db.execute(
        'INSERT INTO audit_log (user_id, user_role, action, resource, ip_address, result) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, 'blotter_officer', 'CREATE', 'blotter_case', req.ip, 'SUCCESS']
      );
    }
    
    return result;
  }));
  
  // PUT update blotter entry - ONLY Blotter Officer
  router.put('/:caseNumber', verifyToken, checkRole(['blotter_officer']), asyncHandler(blotterController.update));
  
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
