const { sendRequestStatusEmail } = require('../utils/emailService');
const { logAuditToDatabase, AUDIT_EVENTS } = require('../middleware/auditLogger');

class CertificateRequestController {
  constructor(db) {
    this.db = db;
    this.getCertificateTypes = this.getCertificateTypes.bind(this);
    this.getAvailableTemplates = this.getAvailableTemplates.bind(this);
    this.submitRequest = this.submitRequest.bind(this);
    this.getMyRequests = this.getMyRequests.bind(this);
    this.cancelRequest = this.cancelRequest.bind(this);
    this.getAllRequests = this.getAllRequests.bind(this);
    this.getRequestAttachment = this.getRequestAttachment.bind(this);
    this.updateRequestStatus = this.updateRequestStatus.bind(this);
    this.updateRequestDetails = this.updateRequestDetails.bind(this);
  }

  async getAvailableTemplates(req, res) {
    try {
      const db = (req.app && req.app.locals && req.app.locals.db) || this.db;

      // Fetch DB Templates
      const [templates] = await db.execute(
        'SELECT id, template_name, display_name, document_type, required_fields, is_custom FROM document_templates WHERE is_active = 1'
      );

      // Fetch Certificate Types (for validity)
      const [types] = await db.execute(
        'SELECT id, name, description, validity_days FROM certificate_types WHERE is_active = 1'
      );

      // Merge: For each template, try to find a matching type to get desc
      const merged = templates.map(t => {
        // Try to match document_type (e.g. barangay_clearance) with type name (Barangay Clearance)
        // Normalize type name: Barangay Clearance -> barangay_clearance
        const matchingType = types.find(type => {
          const normalizedTypeName = type.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          return normalizedTypeName === t.document_type || type.name === t.document_type;
        });

        let parsedRequiredFields = [];
        try {
          parsedRequiredFields =
            typeof t.required_fields === 'string'
              ? JSON.parse(t.required_fields)
              : t.required_fields;
        } catch (e) {
          parsedRequiredFields = [];
        }

        return {
          id: t.id, // Template ID
          template_name: t.template_name,
          display_name: t.display_name || t.template_name,
          document_type: t.document_type,
          required_fields: parsedRequiredFields || [],
          is_custom: t.is_custom,
          // Certificate Type Info
          description: matchingType ? matchingType.description : 'Custom Certificate',
          validity_days: matchingType ? matchingType.validity_days : 365,
          type_id: matchingType ? matchingType.id : null,
        };
      });

      res.json({ success: true, data: merged });
    } catch (error) {
      console.error('Error fetching available templates:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch templates' });
    }
  }

  async getCertificateTypes(req, res) {
    try {
      const db = (req.app && req.app.locals && req.app.locals.db) || this.db;
      const [types] = await db.execute(
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
      const db = (req.app && req.app.locals && req.app.locals.db) || this.db;
      // Handle file uploads first
      if (!req.files || !req.files.front_id || !req.files.back_id) {
        return res
          .status(400)
          .json({ success: false, message: 'Both Front and Back ID photos are required' });
      }

      const { document_type, purpose, additional_data } = req.body;
      const resident_id = req.user.resident_id;
      const frontIdFile = req.files.front_id[0];
      const backIdFile = req.files.back_id[0];

      if (!resident_id) {
        return res.status(400).json({ success: false, message: 'Resident ID not found' });
      }

      // Get resident data
      const [residents] = await db.execute('SELECT * FROM residents WHERE Resident_ID = ?', [
        resident_id,
      ]);

      if (residents.length === 0) {
        return res.status(404).json({ success: false, message: 'Resident not found' });
      }

      const resident = residents[0];
      const request_id = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      await db.execute(
        `
        INSERT INTO document_requests (
          request_id, resident_id, document_type, status, 
          request_data, resident_data,
          attachment_front_id, attachment_back_id,
          attachment_front_mime, attachment_back_mime
        ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
      `,
        [
          request_id,
          resident_id,
          document_type,
          JSON.stringify({ purpose, ...JSON.parse(additional_data || '{}') }),
          JSON.stringify(resident),
          frontIdFile.buffer,
          backIdFile.buffer,
          frontIdFile.mimetype,
          backIdFile.mimetype,
        ]
      );

      // Create notification for staff
      if (global.createBulkNotification) {
        const [staff] = await db.execute(
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
        message: 'Certificate request submitted successfully',
      });
    } catch (error) {
      console.error('Error submitting certificate request:', error);
      res.status(500).json({ success: false, message: 'Failed to submit request' });
    }
  }

  async getMyRequests(req, res) {
    try {
      const db = (req.app && req.app.locals && req.app.locals.db) || this.db;
      const resident_id = req.user.resident_id;
      const { page = 1, limit = 10 } = req.query; // Get pagination params

      // Fetch Certificate Requests
      let requests = [];
      if (resident_id) {
        const [certRequests] = await db.execute(
          `
          SELECT 
              request_id, document_type as certificate_type, status, created_at, 
              'certificate' as type, remarks, request_data
          FROM document_requests 
          WHERE resident_id = ?
          ORDER BY created_at DESC
          `,
          [resident_id]
        );
        // Parse request_data to extract purpose
        requests = certRequests.map(req => {
          let purpose = 'N/A';
          try {
            const data = JSON.parse(req.request_data || '{}');
            purpose = data.purpose || 'N/A';
          } catch (e) { }
          return {
            ...req,
            purpose
          };
        });
      }

      // Fetch Residency Verification Applications (For Guests & Residents)
      // We link via email because Guest users might not have resident_id yet
      // Or we use the user's email from the session
      const userEmail = req.user.email;

      // Find applications linked to this user's email
      const [apps] = await db.execute(
        `
        SELECT 
            application_id as request_id, 
            'Residency Verification' as certificate_type, 
            status, 
            created_at, 
            'application' as type,
            rejection_reason as remarks
        FROM resident_applications 
        WHERE email = ?
        ORDER BY created_at DESC
        `,
        [userEmail]
      );

      const formattedApps = apps.map(app => ({
        ...app,
        purpose: 'Account Verification'
      }));

      // Merge and Sort
      const allRequests = [...requests, ...formattedApps].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      // Pagination Logic
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedRequests = allRequests.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: allRequests.length,
        },
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch requests' });
    }
  }

  async cancelRequest(req, res) {
    try {
      const db = (req.app && req.app.locals && req.app.locals.db) || this.db;
      const { request_id } = req.params;
      const resident_id = req.user.resident_id;

      const [result] = await db.execute(
        'UPDATE document_requests SET status = "rejected" WHERE request_id = ? AND resident_id = ? AND status = "pending"',
        [request_id, resident_id]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: 'Request not found or cannot be cancelled' });
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
      const db = (req.app && req.app.locals && req.app.locals.db) || this.db;
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

      const [requests] = await db.execute(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM document_requests';
      const countParams = [];
      if (status !== 'all') {
        countQuery += ' WHERE status = ?';
        countParams.push(status);
      }

      const [countResult] = await db.execute(countQuery, countParams);

      res.json({
        success: true,
        data: requests.map(req => ({
          ...req,
          resident_name:
            `${req.First_Name} ${req.Middle_Name || ''} ${req.Last_Name} ${req.Suffix || ''}`.trim(),
          request_data:
            typeof req.request_data === 'string' ? JSON.parse(req.request_data) : req.request_data,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
        },
      });
    } catch (error) {
      console.error('Error fetching all requests:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch requests' });
    }
  }

  async getRequestAttachment(req, res) {
    try {
      const db = (req.app && req.app.locals && req.app.locals.db) || this.db;
      const { request_id, type } = req.params; // type: 'front' or 'back'

      if (!['front', 'back'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid attachment type' });
      }

      const column = type === 'front' ? 'attachment_front_id' : 'attachment_back_id';
      const mimeColumn = type === 'front' ? 'attachment_front_mime' : 'attachment_back_mime';

      const [rows] = await db.execute(
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

  async updateRequestDetails(req, res) {
    try {
      const db = (req.app && req.app.locals && req.app.locals.db) || this.db;
      const { request_id } = req.params;
      const { request_data } = req.body;

      if (!request_data) {
        return res.status(400).json({ success: false, message: 'Request data is required' });
      }

      // First check if request exists and is pending
      const [rows] = await db.execute('SELECT status FROM document_requests WHERE request_id = ?', [
        request_id,
      ]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      // Allow editing even if approved (user requested "editable"), but typically only pending should be.
      // Assuming Admin power allows editing anytime before completion.

      const [result] = await db.execute(
        'UPDATE document_requests SET request_data = ? WHERE request_id = ?',
        [JSON.stringify(request_data), request_id]
      );

      // Audit Log
      try {
        await logAuditToDatabase(db, AUDIT_EVENTS.DATA_UPDATE, {
          user_id: req.user?.id || null,
          user_role: req.user?.role || null,
          resource: `request/${request_id}`,
          action: 'UPDATE_DETAILS',
          result: 'SUCCESS',
          additional_details: { updated_fields: Object.keys(request_data) },
        });
      } catch (e) {
        console.warn('Audit log failed', e);
      }

      res.json({ success: true, message: 'Request details updated successfully' });
    } catch (error) {
      console.error('Error updating request details:', error);
      res.status(500).json({ success: false, message: 'Failed to update request details' });
    }
  }

  async updateRequestStatus(req, res) {
    try {
      const db = (req.app && req.app.locals && req.app.locals.db) || this.db;
      const { request_id } = req.params;
      const { status, remarks } = req.body; // status: 'approved', 'rejected'

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      const [result] = await db.execute(
        'UPDATE document_requests SET status = ?, remarks = ? WHERE request_id = ?',
        [status, remarks || '', request_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      // Notify resident
      const [rows] = await db.execute(
        `
        SELECT dr.document_type, r.Email, r.First_Name, r.Last_Name, u.id as user_id
        FROM document_requests dr
        JOIN residents r ON dr.resident_id = r.Resident_ID
        LEFT JOIN users u ON r.Resident_ID = u.resident_id
        WHERE dr.request_id = ?
      `,
        [request_id]
      );

      if (rows.length > 0) {
        const { document_type, Email, First_Name, Last_Name, user_id } = rows[0];

        // Audit Log
        try {
          const auditDetails = {
            user_id: req.user?.id || null,
            user_role: req.user?.role || null,
            resource: `request/${request_id}`,
            action: 'UPDATE_STATUS',
            result: 'SUCCESS',
            additional_details: { status, remarks, document_type },
          };
          // Map status to appropriate audit event
          const eventType =
            status === 'approved'
              ? AUDIT_EVENTS.CERTIFICATE_RELEASED
              : AUDIT_EVENTS.CERTIFICATE_REJECTED; // Using closest available events

          // Assuming logAuditToDatabase handles the insert
          await logAuditToDatabase(db, eventType, auditDetails);
        } catch (auditErr) {
          console.warn('Failed to log audit for certificate update', auditErr);
        }

        if (global.createNotification && user_id) {
          await global.createNotification(
            user_id, // Send to the specific user ID linked to the resident
            'Certificate Request Update',
            `Your request for ${document_type} has been ${status}. ${remarks ? `Remarks: ${remarks}` : ''}`,
            status === 'approved' ? 'success' : 'error',
            'high',
            { request_id }
          );
        } else if (global.createNotification) {
          // Fallback if no user_id found (e.g. resident account deleted), log warning
          console.warn(
            `Could not send notification for request ${request_id}: No linked user account found.`
          );
        }

        if (Email) {
          await sendRequestStatusEmail({
            to: Email,
            residentName: `${First_Name} ${Last_Name}`,
            requestType: document_type,
            status,
            remarks,
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
