const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES } = require('../config/roles');
const DocumentController = require('../controllers/documentController');
const { sendRequestStatusEmail } = require('../utils/emailService');

module.exports = (db) => {
  // GET all document requests
  router.get('/requests', verifyToken, asyncHandler(async (req, res) => {
    const isResident = req.user.role === ROLES.RESIDENT;
    
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
  router.post('/requests', verifyToken, checkRole([ROLES.RESIDENT]), asyncHandler(async (req, res) => {
    const { document_type, purpose, urgency, additional_info, additional_data } = req.body;

    if (!document_type) {
      return res.status(400).json({ error: 'document_type is required' });
    }

    const residentId = req.user.resident_id || req.user.id;

    const [residents] = await db.execute(
      'SELECT * FROM residents WHERE Resident_ID = ?',
      [residentId]
    );

    if (residents.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    const request_id = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const requestData = {
      purpose: purpose || '',
      urgency: urgency || 'normal',
      additional_info: additional_info || '',
      ...(additional_data && typeof additional_data === 'object' ? additional_data : {})
    };

    await db.execute(
      `
      INSERT INTO document_requests (request_id, resident_id, document_type, status, request_data, resident_data)
      VALUES (?, ?, ?, 'pending', ?, ?)
      `,
      [request_id, residentId, document_type, JSON.stringify(requestData), JSON.stringify(residents[0])]
    );

    res.status(201).json({
      request_id,
      message: 'Document request created successfully'
    });
  }));

  // GET download generated document
  router.get('/requests/:request_id/download', verifyToken, (req, res) => DocumentController.downloadDocument(req, res));
  
  // PUT update document request status
  router.put('/requests/:id', verifyToken, checkRole(['admin', 'secretary', 'clerk']), asyncHandler(async (req, res) => {
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const normalizedStatus = String(status).toLowerCase();
    const approvalData = {
      notes: notes || '',
      updated_by: String(req.user.id),
      updated_at: new Date().toISOString()
    };

    if (normalizedStatus === 'approved' || normalizedStatus === 'rejected' || normalizedStatus === 'completed') {
      await db.execute(
        `
        UPDATE document_requests 
        SET status = ?, approval_data = ?, approved_at = NOW(), approved_by = ?, updated_at = NOW()
        WHERE request_id = ?
        `,
        [normalizedStatus, JSON.stringify(approvalData), String(req.user.id), req.params.id]
      );
    } else {
      await db.execute(
        `
        UPDATE document_requests 
        SET status = ?, approval_data = ?, updated_at = NOW()
        WHERE request_id = ?
        `,
        [normalizedStatus, JSON.stringify(approvalData), req.params.id]
      );
    }

    // Fetch details for email
    const [rows] = await db.execute(`
      SELECT dr.document_type, r.Email, r.First_Name, r.Last_Name 
      FROM document_requests dr
      JOIN residents r ON dr.resident_id = r.Resident_ID
      WHERE dr.request_id = ?
    `, [req.params.id]);

    if (rows.length > 0) {
       const { document_type, Email, First_Name, Last_Name } = rows[0];
       if (Email) {
         await sendRequestStatusEmail({
           to: Email,
           residentName: `${First_Name} ${Last_Name}`,
           requestType: document_type,
           status: normalizedStatus,
           remarks: notes
         });
       }
    }
    
    res.json({ message: 'Document request updated successfully' });
  }));

  return router;
};
