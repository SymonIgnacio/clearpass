const express = require('express');
const router = express.Router();
const { verifyToken, checkRole, authenticate } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const blotterController = require('../controllers/blotterController');
const { logAuditEvent, logAuditToDatabase, AUDIT_EVENTS } = require('../middleware/auditLogger');

module.exports = (db) => {
  // GET all blotter records
  router.get('/', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk', 'blotter_officer']), asyncHandler(blotterController.getAll));
  
  // POST create blotter entry - ONLY Blotter Officer
  router.post('/', verifyToken, checkRole(['blotter_officer']), asyncHandler(async (req, res) => {
    const result = await blotterController.create(req, res);
    
    const auditDetails = {
      user_id: req.user?.id || null,
      user_role: req.user?.role || null,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      resource: req.originalUrl,
      action: req.method,
      result: res.statusCode >= 400 ? 'FAILED' : 'SUCCESS',
      additional_details: { entity: 'blotter_case' },
      session_id: req.sessionID
    };
    const eventType = AUDIT_EVENTS.BLOTTER_CREATED;
    logAuditEvent(eventType, auditDetails);
    const auditDb = req.app?.locals?.db || db;
    if (auditDb && typeof auditDb.execute === 'function') {
      await logAuditToDatabase(auditDb, eventType, auditDetails);
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
