const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const captainController = require('../controllers/captainController');

module.exports = (db) => {
  // Captain dashboard
  router.get('/dashboard', verifyToken, checkRole(['captain']), asyncHandler(async (req, res) => {
    const [residents] = await db.execute('SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"');
    const [blotter] = await db.execute('SELECT COUNT(*) as total FROM blotter WHERE Status IN ("Pending", "Ongoing")');
    const [certificates] = await db.execute('SELECT COUNT(*) as total FROM certificates_log');
    const [households] = await db.execute('SELECT COUNT(*) as total FROM households');
    
    res.json({
      residents: residents[0].total,
      active_blotter: blotter[0].total,
      certificates: certificates[0].total,
      households: households[0].total
    });
  }));

  // Residents overview (read-only)
  router.get('/residents', verifyToken, checkRole(['captain']), asyncHandler(async (req, res) => {
    const [residents] = await db.execute(`
      SELECT r.*, h.Household_Number, s.name as sitio_name,
             v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Residency_Status = 'Active'
      ORDER BY r.Last_Name
    `);
    res.json(residents);
  }));

  // Blotter monitoring (read-only)
  router.get('/blotters', verifyToken, checkRole(['captain']), asyncHandler(async (req, res) => {
    const [blotterCases] = await db.execute(`
      SELECT b.*, 
             JSON_UNQUOTE(JSON_EXTRACT(b.Complainant_Details, '$.name')) as complainant_name,
             JSON_UNQUOTE(JSON_EXTRACT(b.Respondent_Details, '$.name')) as respondent_name
      FROM blotter b
      ORDER BY b.DateTime_Incident DESC
    `);
    res.json(blotterCases);
  }));

  // Certificate trends (read-only)
  router.get('/clearances', verifyToken, checkRole(['captain']), asyncHandler(async (req, res) => {
    const [certs] = await db.execute(`
      SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
      FROM certificates_log c
      JOIN residents r ON c.resident_id = r.Resident_ID
      ORDER BY c.created_at DESC
    `);
    res.json(certs);
  }));

  // Analytics reports
  router.get('/reports', verifyToken, checkRole(['captain']), asyncHandler(async (req, res) => {
    const [monthlyStats] = await db.execute(`
      SELECT 
        MONTH(created_at) as month,
        YEAR(created_at) as year,
        certificate_type,
        COUNT(*) as count
      FROM certificates_log
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at), certificate_type
      ORDER BY year DESC, month DESC
    `);
    
    const [blotterStats] = await db.execute(`
      SELECT 
        Incident_Type,
        Status,
        COUNT(*) as count
      FROM blotter
      WHERE DateTime_Incident >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY Incident_Type, Status
    `);
    
    res.json({
      certificate_trends: monthlyStats,
      blotter_statistics: blotterStats
    });
  }));

  return router;
};