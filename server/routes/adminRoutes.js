const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const adminController = require('../controllers/adminController');

module.exports = (db) => {
  // GET user reports
  router.get('/reports/users', verifyToken, checkRole(['admin']), asyncHandler(adminController.getUsersReport));
  
  // GET blotter reports
  router.get('/reports/blotter', verifyToken, checkRole(['admin']), asyncHandler(adminController.getBlotterReport));
  
  // GET certificate reports
  router.get('/reports/certificates', verifyToken, checkRole(['admin']), asyncHandler(adminController.getCertificatesReport));
  
  // GET system statistics
  router.get('/stats', verifyToken, checkRole(['admin', 'captain']), asyncHandler(async (req, res) => {
    const [residents] = await db.execute('SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"');
    const [certificates] = await db.execute('SELECT COUNT(*) as total FROM certificates_log');
    const [blotter] = await db.execute('SELECT COUNT(*) as total FROM blotter');
    const [users] = await db.execute('SELECT COUNT(*) as total FROM users');
    
    res.json({
      residents: residents[0].total,
      certificates: certificates[0].total,
      blotter_cases: blotter[0].total,
      users: users[0].total,
      generated_at: new Date().toISOString()
    });
  }));

  return router;
};
