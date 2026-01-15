const express = require('express');
const router = express.Router();
const { verifyToken, checkRole, enforceReadOnly } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const certificateController = require('../controllers/certificateController');

module.exports = (db) => {
  // GET all certificates
  router.get('/', verifyToken, asyncHandler(certificateController.getAll));
  
  // GET specific certificate
  router.get('/:id', verifyToken, asyncHandler(async (req, res) => {
    const [rows] = await db.execute(`
      SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
      FROM certificates_log c
      JOIN residents r ON c.resident_id = r.Resident_ID
      WHERE c.control_no = ? OR c.id = ?
    `, [req.params.id, req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    res.json(rows[0]);
  }));
  
  // POST generate certificate
  router.post('/', verifyToken, enforceReadOnly, checkRole(['admin', 'secretary', 'clerk']), asyncHandler(certificateController.create));

  return router;
};
