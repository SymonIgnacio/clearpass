const { sendRequestStatusEmail } = require('../utils/emailService');

class CertificateRequestController {
  constructor(db) {
    this.db = db;
    this.getCertificateTypes = this.getCertificateTypes.bind(this);
    this.submitRequest = this.submitRequest.bind(this);
    this.getMyRequests = this.getMyRequests.bind(this);
    this.cancelRequest = this.cancelRequest.bind(this);
    this.getAllRequests = this.getAllRequests.bind(this);
    this.getRequestAttachment = this.getRequestAttachment.bind(this);
    this.updateRequestStatus = this.updateRequestStatus.bind(this);
  }

  async getCertificateTypes(req, res) {
    try {
      const [types] = await this.db.execute(
        'SELECT * FROM certificate_types WHERE is_active = 1 ORDER BY name'
      );
      res.json({ success: true, data: types });
    } catch (error) {
      console.error('Error fetching certificate types:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch certificate types' });
    }
  }

  async submitRequest(req, res) {
    try {
      // Handle file uploads first
      if (!req.files || !req.files.front_id || !req.files.back_id) {
        return res.status(400).json({ success: false, message: 'Both Front and Back ID photos are required' });
      }

      const { document_type, purpose, additional_data } = req.body;
      const resident_id = req.user.resident_id;
      const frontIdFile = req.files.front_id[0];
      const backIdFile = req.files.back_id[0];

      if (!resident_id) {
        return res.status(400).json({ success: false, message: 'Resident ID not found' });
      }

      // Get resident data
      const [residents] = await this.db.execute(
        'SELECT * FROM residents WHERE Resident_ID = ?',
        [resident_id]
      );

      if (residents.length === 0) {
        return res.status(404).json({ success: false, message: 'Resident not found' });
      }

      const resident = residents[0];
      const request_id = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      await this.db.execute(`
        INSERT INTO document_requests (
          request_id, resident_id, document_type, status, 
          request_data, resident_data,
          attachment_front_id, attachment_back_id,
          attachment_front_mime, attachment_back_mime
        ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
      `, [
        request_id,
        resident_id,
        document_type,
        JSON.stringify({ purpose, ...JSON.parse(additional_data || '{}') }),
        JSON.stringify(resident),
        frontIdFile.buffer,
        backIdFile.buffer,
        frontIdFile.mimetype,
        backIdFile.mimetype
      ]);

      // Create notification for staff
      if (global.createBulkNotification) {
        const [staff] = await this.db.execute(
          'SELECT id FROM users WHERE role IN (2, 3, 4) AND is_active = 1'
        );
        const staffIds = staff.map(s => s.id);
        
        await global.createBulkNotification(
          staffIds,
          'New Certificate Request',
          `${resident.First_Name} ${resident.Last_Name} requested ${document_type}`,
          'info',
          'normal',
          { request_id, document_type }
        );
      }

      res.status(201).json({
        success: true,
        data: { request_id },
        message: 'Certificate request submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting certificate request:', error);
      res.status(500).json({ success: false, message: 'Failed to submit request' });
    }
  }

  async getMyRequests(req, res) {
    try {
      const resident_id = req.user.resident_id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const [requests] = await this.db.execute(`
        SELECT dr.id, dr.request_id, dr.document_type, dr.status, dr.created_at, ct.fee, ct.validity_days
        FROM document_requests dr
        LEFT JOIN certificate_types ct ON dr.document_type = ct.name
        WHERE dr.resident_id = ?
        ORDER BY dr.created_at DESC
        LIMIT ? OFFSET ?
      `, [resident_id, parseInt(limit), offset]);

      const [countResult] = await this.db.execute(
        'SELECT COUNT(*) as total FROM document_requests WHERE resident_id = ?',
        [resident_id]
      );

      res.json({
        success: true,
        data: requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total
        }
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch requests' });
    }
  }

  async cancelRequest(req, res) {
    try {
      const { request_id } = req.params;
      const resident_id = req.user.resident_id;

      const [result] = await this.db.execute(
        'UPDATE document_requests SET status = "rejected" WHERE request_id = ? AND resident_id = ? AND status = "pending"',
        [request_id, resident_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Request not found or cannot be cancelled' });
      }

      res.json({ success: true, message: 'Request cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling request:', error);
      res.status(500).json({ success: false, message: 'Failed to cancel request' });
    }
  }

  // --- STAFF/ADMIN METHODS ---

  async getAllRequests(req, res) {
    try {
      const { page = 1, limit = 10, status = 'pending' } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT dr.request_id, dr.document_type, dr.status, dr.created_at, 
               dr.request_data, dr.resident_data,
               r.First_Name, r.Last_Name, r.Middle_Name, r.Suffix
        FROM document_requests dr
        LEFT JOIN residents r ON dr.resident_id = r.Resident_ID
      `;
      
      const params = [];
      
      if (status !== 'all') {
        query += ' WHERE dr.status = ?';
        params.push(status);
      }

      query += ' ORDER BY dr.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [requests] = await this.db.execute(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM document_requests';
      const countParams = [];
      if (status !== 'all') {
        countQuery += ' WHERE status = ?';
        countParams.push(status);
      }
      
      const [countResult] = await this.db.execute(countQuery, countParams);

      res.json({
        success: true,
        data: requests.map(req => ({
          ...req,
          resident_name: `${req.First_Name} ${req.Middle_Name || ''} ${req.Last_Name} ${req.Suffix || ''}`.trim(),
          request_data: typeof req.request_data === 'string' ? JSON.parse(req.request_data) : req.request_data
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total
        }
      });
    } catch (error) {
      console.error('Error fetching all requests:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch requests' });
    }
  }

  async getRequestAttachment(req, res) {
    try {
      const { request_id, type } = req.params; // type: 'front' or 'back'
      
      if (!['front', 'back'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid attachment type' });
      }

      const column = type === 'front' ? 'attachment_front_id' : 'attachment_back_id';
      const mimeColumn = type === 'front' ? 'attachment_front_mime' : 'attachment_back_mime';

      const [rows] = await this.db.execute(
        `SELECT ${column} as data, ${mimeColumn} as mime FROM document_requests WHERE request_id = ?`,
        [request_id]
      );

      if (rows.length === 0 || !rows[0].data) {
        return res.status(404).json({ success: false, message: 'Attachment not found' });
      }

      res.setHeader('Content-Type', rows[0].mime || 'image/jpeg');
      res.send(rows[0].data);
    } catch (error) {
      console.error('Error fetching attachment:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch attachment' });
    }
  }

  async updateRequestStatus(req, res) {
    try {
      const { request_id } = req.params;
      const { status, remarks } = req.body; // status: 'approved', 'rejected'

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      const [result] = await this.db.execute(
        'UPDATE document_requests SET status = ?, remarks = ? WHERE request_id = ?',
        [status, remarks || '', request_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      // Notify resident
      const [rows] = await this.db.execute(`
        SELECT dr.document_type, r.Email, r.First_Name, r.Last_Name 
        FROM document_requests dr
        JOIN residents r ON dr.resident_id = r.Resident_ID
        WHERE dr.request_id = ?
      `, [request_id]);

      if (rows.length > 0) {
        const { document_type, Email, First_Name, Last_Name } = rows[0];

        if (global.createNotification) {
          await global.createNotification(
            null, // system notification
            'Certificate Request Update',
            `Your request for ${document_type} has been ${status}. ${remarks ? `Remarks: ${remarks}` : ''}`,
            status === 'approved' ? 'success' : 'error',
            'high',
            { request_id }
          );
        }

        if (Email) {
          await sendRequestStatusEmail({
            to: Email,
            residentName: `${First_Name} ${Last_Name}`,
            requestType: document_type,
            status,
            remarks
          });
        }
      }

      res.json({ success: true, message: `Request ${status} successfully` });
    } catch (error) {
      console.error('Error updating request status:', error);
      res.status(500).json({ success: false, message: 'Failed to update request status' });
    }
  }
}

module.exports = CertificateRequestController;
