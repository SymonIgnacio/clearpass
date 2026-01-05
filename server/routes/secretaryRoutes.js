const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

module.exports = (db) => {
  // Secretary dashboard
  router.get('/dashboard', verifyToken, checkRole(['secretary']), asyncHandler(async (req, res) => {
    const [residents] = await db.execute('SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"');
    const [beneficiaries] = await db.execute('SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_4Ps = true OR Is_PWD = true OR Is_Senior = true');
    const [blotter] = await db.execute('SELECT COUNT(*) as total FROM blotter WHERE Status IN ("Pending", "Ongoing")');
    const [clearances] = await db.execute('SELECT COUNT(*) as total FROM certificates_log WHERE DATE(created_at) = CURDATE()');
    
    res.json({
      residents: residents[0].total,
      beneficiaries: beneficiaries[0].total,
      active_blotter: blotter[0].total,
      today_clearances: clearances[0].total
    });
  }));

  // Resident oversight
  router.get('/residents', verifyToken, checkRole(['secretary']), asyncHandler(async (req, res) => {
    const [residents] = await db.execute(`
      SELECT r.*, h.Household_Number, s.name as sitio_name,
             v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent, v.Vulnerability_Score
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      ORDER BY r.Last_Name
    `);
    res.json(residents);
  }));

  // Beneficiary validation
  router.get('/beneficiaries', verifyToken, checkRole(['secretary']), asyncHandler(async (req, res) => {
    const [beneficiaries] = await db.execute(`
      SELECT r.*, h.Household_Number, s.name as sitio_name,
             v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent, 
             v.Disability_Type, v.Vulnerability_Score
      FROM residents r
      JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE v.Is_4Ps = true OR v.Is_PWD = true OR v.Is_Senior = true 
         OR v.Is_Solo_Parent = true OR v.Is_Out_of_School_Youth = true
      ORDER BY v.Vulnerability_Score DESC, r.Last_Name
    `);
    res.json(beneficiaries);
  }));

  // Blotter oversight
  router.get('/blotters', verifyToken, checkRole(['secretary']), asyncHandler(async (req, res) => {
    const [blotterCases] = await db.execute(`
      SELECT b.*, 
             JSON_UNQUOTE(JSON_EXTRACT(b.Complainant_Details, '$.name')) as complainant_name,
             JSON_UNQUOTE(JSON_EXTRACT(b.Respondent_Details, '$.name')) as respondent_name
      FROM blotter b
      ORDER BY b.DateTime_Incident DESC
    `);
    res.json(blotterCases);
  }));

  // Clearance oversight
  router.get('/clearances', verifyToken, checkRole(['secretary']), asyncHandler(async (req, res) => {
    const [certs] = await db.execute(`
      SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
      FROM certificates_log c
      JOIN residents r ON c.resident_id = r.Resident_ID
      ORDER BY c.created_at DESC LIMIT 100
    `);
    res.json(certs);
  }));

  // Approve clearances (override capability)
  router.put('/clearances/:id/approve', verifyToken, checkRole(['secretary']), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approval_notes } = req.body;
    
    await db.execute(`
      UPDATE certificates_log 
      SET status = 'Approved', approval_notes = ?, approved_by = ?, approved_at = NOW()
      WHERE id = ?
    `, [approval_notes || 'Approved by Secretary', req.user.id, id]);
    
    res.json({ message: 'Certificate approved successfully' });
  }));

  return router;
};