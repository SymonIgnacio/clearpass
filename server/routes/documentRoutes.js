const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

module.exports = (db) => {
  // GET all document requests
  router.get('/requests', verifyToken, asyncHandler(async (req, res) => {
    const isResident = req.user.role_id === 12; // RESIDENT role
    
    let query, values;
    
    if (isResident) {
      query = `
        SELECT dr.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
        FROM document_requests dr
        JOIN residents r ON dr.resident_id = r.Resident_ID
        WHERE dr.resident_id = ?
        ORDER BY dr.created_at DESC
      `;
      values = [req.user.resident_id || req.user.id];
    } else {
      query = `
        SELECT dr.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
        FROM document_requests dr
        JOIN residents r ON dr.resident_id = r.Resident_ID
        ORDER BY dr.created_at DESC
      `;
      values = [];
    }
    
    const [rows] = await db.execute(query, values);
    res.json(rows);
  }));
  
  // POST create document request
  router.post('/requests', verifyToken, asyncHandler(async (req, res) => {
    const { resident_id, document_type, purpose, urgency, additional_info } = req.body;
    
    if (!resident_id || !document_type) {
      return res.status(400).json({ error: 'resident_id and document_type are required' });
    }
    
    const request_id = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    const [result] = await db.execute(`
      INSERT INTO document_requests (request_id, resident_id, document_type, purpose, urgency, additional_info, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW())
    `, [request_id, resident_id, document_type, purpose || '', urgency || 'Normal', additional_info || '']);
    
    res.status(201).json({
      id: result.insertId,
      request_id,
      message: 'Document request created successfully'
    });
  }));
  
  // PUT update document request status
  router.put('/requests/:id', verifyToken, checkRole(['admin', 'secretary', 'clerk']), asyncHandler(async (req, res) => {
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    
    await db.execute(`
      UPDATE document_requests 
      SET status = ?, notes = ?, updated_at = NOW()
      WHERE id = ? OR request_id = ?
    `, [status, notes || '', req.params.id, req.params.id]);
    
    res.json({ message: 'Document request updated successfully' });
  }));

  return router;
};