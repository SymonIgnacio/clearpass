const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const clerkController = require('../controllers/clerkController');

module.exports = (db) => {
  // Clerk dashboard
  router.get('/dashboard', verifyToken, checkRole(['clerk']), asyncHandler(async (req, res) => {
    const [pendingRequests] = await db.execute('SELECT COUNT(*) as total FROM document_requests WHERE status = "pending"');
    const [todayCerts] = await db.execute('SELECT COUNT(*) as total FROM certificates_log WHERE DATE(created_at) = CURDATE()');
    const [pendingBlotter] = await db.execute('SELECT COUNT(*) as total FROM blotter WHERE Status = "Pending"');
    
    res.json({
      pending_requests: pendingRequests[0].total,
      today_certificates: todayCerts[0].total,
      pending_blotter: pendingBlotter[0].total
    });
  }));

  // Clearance management
  router.get('/clearances', verifyToken, checkRole(['clerk']), asyncHandler(async (req, res) => {
    const [certs] = await db.execute(`
      SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
      FROM certificates_log c
      JOIN residents r ON c.resident_id = r.Resident_ID
      WHERE c.certificate_type IN ('Barangay Clearance', 'Good Moral')
      ORDER BY c.created_at DESC LIMIT 50
    `);
    res.json(certs);
  }));

  // Document processing
  router.get('/documents', verifyToken, checkRole(['clerk']), asyncHandler(async (req, res) => {
    const [requests] = await db.execute(`
      SELECT dr.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
      FROM document_requests dr
      JOIN residents r ON dr.resident_id = r.Resident_ID
      ORDER BY dr.created_at DESC LIMIT 100
    `);
    res.json(requests);
  }));

  // Resident verification
  router.get('/residents', verifyToken, checkRole(['clerk']), asyncHandler(async (req, res) => {
    const [residents] = await db.execute(`
      SELECT r.*, h.Household_Number, s.name as sitio_name
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE r.Residency_Status = 'Active'
      ORDER BY r.Last_Name
    `);
    res.json(residents);
  }));

  return router;
};