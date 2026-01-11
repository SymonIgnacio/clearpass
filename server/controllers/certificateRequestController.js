class CertificateRequestController {
  constructor(db) {
    this.db = db;
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
      const { document_type, purpose, additional_data } = req.body;
      const resident_id = req.user.resident_id;

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
          request_data, resident_data
        ) VALUES (?, ?, ?, 'pending', ?, ?)
      `, [
        request_id,
        resident_id,
        document_type,
        JSON.stringify({ purpose, ...additional_data }),
        JSON.stringify(resident)
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
        SELECT dr.*, ct.fee, ct.validity_days
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
}

module.exports = CertificateRequestController;
