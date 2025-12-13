const knex = require('./database');

/**
 * Document Controller
 * Handles document request creation, approval, and generation
 * NOTE: Document generation is currently stubbed out - Python module integration needed
 */

class DocumentController {
  constructor() {
    // TODO: Integrate with Python document generator
    // this.generator = new ResidentDocumentGenerator();
  }

  /**
   * Get all supported document types
   */
  async getDocumentTypes(req, res) {
    try {
      const documentTypes = [
        {
          id: 'barangay_clearance',
          name: 'Barangay Clearance',
          description: 'Certificate of good standing and residency',
          required_fields: ['purpose'],
          user_fields: ['place_of_birth', 'purpose'],
          estimated_time: '2-3 days'
        },
        {
          id: 'bonafide_certificate',
          name: 'Bonafide Certificate',
          description: 'Certificate of residency and good standing',
          required_fields: ['purpose'],
          user_fields: ['place_of_birth', 'purpose'],
          estimated_time: '2-3 days'
        },
        {
          id: 'building_permit',
          name: 'Building Permit',
          description: 'Permit for construction/building activities',
          required_fields: [],
          user_fields: ['place_of_birth'],
          estimated_time: '5-7 days'
        },
        {
          id: 'business_closure',
          name: 'Business Closure Certificate',
          description: 'Certificate confirming business closure',
          required_fields: ['business_name', 'business_address', 'closure_date'],
          user_fields: ['business_name', 'business_address', 'closure_date'],
          estimated_time: '3-5 days'
        },
        {
          id: 'cohabitation_certificate',
          name: 'Cohabitation Certificate',
          description: 'Certificate of common-law relationship',
          required_fields: ['partner1_name', 'partner2_name', 'cohabitation_date', 'blotter_number', 'blotter_date', 'children_count'],
          user_fields: ['partner1_name', 'partner2_name', 'cohabitation_date', 'blotter_number', 'blotter_date', 'children_count'],
          estimated_time: '5-7 days'
        },
        {
          id: 'excavation_permit',
          name: 'Excavation Permit',
          description: 'Permit for excavation work',
          required_fields: [],
          user_fields: ['place_of_birth'],
          estimated_time: '3-5 days'
        },
        {
          id: 'fencing_permit',
          name: 'Fencing Permit',
          description: 'Permit for fence construction',
          required_fields: [],
          user_fields: ['place_of_birth'],
          estimated_time: '3-5 days'
        },
        {
          id: 'good_moral_certificate',
          name: 'Good Moral Certificate',
          description: 'Certificate of good moral character',
          required_fields: ['school_year', 'purpose'],
          user_fields: ['school_year', 'purpose'],
          estimated_time: '2-3 days'
        },
        {
          id: 'indigency_certificate',
          name: 'Indigency Certificate',
          description: 'Certificate of financial need',
          required_fields: ['purpose', 'specific_purpose'],
          user_fields: ['purpose', 'specific_purpose'],
          estimated_time: '2-3 days'
        },
        {
          id: 'late_registration',
          name: 'Late Registration Certificate',
          description: 'Certificate for late birth registration',
          required_fields: ['father_name', 'mother_name'],
          user_fields: ['father_name', 'mother_name', 'place_of_birth'],
          estimated_time: '3-5 days'
        },
        {
          id: 'ojt_certification',
          name: 'OJT Certification',
          description: 'On-the-Job Training certification',
          required_fields: [],
          user_fields: ['place_of_birth'],
          estimated_time: '2-3 days'
        },
        {
          id: 'low_income_housing',
          name: 'Low Income Housing Certificate',
          description: 'Certificate for low-income housing assistance',
          required_fields: ['monthly_income'],
          user_fields: ['monthly_income'],
          estimated_time: '2-3 days'
        },
        {
          id: 'medico_legal',
          name: 'Medico-Legal Certificate',
          description: 'Medical-legal documentation request',
          required_fields: ['requestor_name', 'blotter_reference'],
          user_fields: ['requestor_name', 'blotter_reference'],
          estimated_time: '5-7 days'
        }
      ];

      res.json({
        success: true,
        data: documentTypes
      });
    } catch (error) {
      console.error('Error fetching document types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document types'
      });
    }
  }

  /**
   * Create a new document request
   */
  async createDocumentRequest(req, res) {
    try {
      const { resident_id, document_type, request_data } = req.body;
      const user_id = req.user?.id || req.body.user_id; // Get from auth or request

      // Validate required fields
      if (!resident_id || !document_type) {
        return res.status(400).json({
          success: false,
          message: 'Resident ID and document type are required'
        });
      }

      // Verify resident exists
      const resident = await knex('residents')
        .select('Resident_ID', 'First_Name', 'Last_Name')
        .where('Resident_ID', resident_id)
        .first();

      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Resident not found'
        });
      }

      // Generate request ID
      const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Save to database (stubbed implementation)
      await knex('document_requests').insert({
        request_id: requestId,
        resident_id: resident_id,
        document_type: document_type,
        request_data: JSON.stringify(request_data || {}),
        status: 'pending',
        created_at: knex.fn.now()
      });

      // Log the action
      await this._logAuditAction(user_id, 'DOCUMENT_REQUEST_CREATED', requestId, {
        document_type,
        resident_id
      });

      res.status(201).json({
        success: true,
        message: 'Document request created successfully',
        data: {
          request_id: requestId,
          document_type: document_type,
          status: 'pending',
          created_at: new Date().toISOString(),
          estimated_time: this._getDocumentTypeInfo(document_type).estimated_time
        }
      });

    } catch (error) {
      console.error('Error creating document request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create document request'
      });
    }
  }

  /**
   * Get document requests for a resident or all requests (for officers)
   */
  async getDocumentRequests(req, res) {
    try {
      const { resident_id, status, page = 1, limit = 10 } = req.query;
      const userRole = req.user?.role || 'resident';

      let query = knex('document_requests')
        .select('*')
        .orderBy('created_at', 'desc');

      // Filter by resident if specified
      if (resident_id) {
        query.where('resident_id', resident_id);
      }

      // Filter by status if specified
      if (status) {
        query.where('status', status);
      }

      // Pagination
      const offset = (page - 1) * limit;
      query.limit(limit).offset(offset);

      const requests = await query;

      // Format requests for response (stubbed)
      const formattedRequests = requests.map(row => ({
        request_id: row.request_id,
        resident_id: row.resident_id,
        document_type: row.document_type,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        document_type_info: this._getDocumentTypeInfo(row.document_type)
      }));

      res.json({
        success: true,
        data: formattedRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching document requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document requests'
      });
    }
  }

  /**
   * Approve a document request (officer only)
   */
  async approveDocumentRequest(req, res) {
    try {
      const { request_id } = req.params;
      const { ctc_number, or_number, prepared_by, validity_days = 365 } = req.body;
      const approved_by = req.user?.id || req.body.approved_by;

      // Get the request
      const requestData = await knex('document_requests')
        .where('request_id', request_id)
        .first();

      if (!requestData) {
        return res.status(404).json({
          success: false,
          message: 'Document request not found'
        });
      }

      // Generate control number
      const controlNumber = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Calculate valid until date
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validity_days);

      // Update in database (stubbed implementation)
      await knex('document_requests')
        .where('request_id', request_id)
        .update({
          status: 'approved',
          control_number: controlNumber,
          approved_by: approved_by,
          approved_at: knex.fn.now(),
          valid_until: validUntil,
          updated_at: knex.fn.now()
        });

      // Log the approval
      await this._logAuditAction(approved_by, 'DOCUMENT_REQUEST_APPROVED', request_id, {
        document_type: requestData.document_type,
        resident_id: requestData.resident_id,
        control_number: controlNumber
      });

      res.json({
        success: true,
        message: 'Document request approved successfully',
        data: {
          request_id: request_id,
          status: 'approved',
          control_number: controlNumber,
          valid_until: validUntil.toISOString(),
          approved_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error approving document request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve document request'
      });
    }
  }

  /**
   * Generate and download the final PDF document
   */
  async downloadDocument(req, res) {
    try {
      const { request_id } = req.params;

      // Get the approved request
      const requestData = await knex('document_requests')
        .where('request_id', request_id)
        .where('status', 'approved')
        .first();

      if (!requestData) {
        return res.status(404).json({
          success: false,
          message: 'Approved document request not found'
        });
      }

      // TODO: Integrate with Python document generator for actual PDF generation
      // For now, return a stubbed response
      const stubbedPdfContent = `Document: ${requestData.document_type}\nControl Number: ${requestData.control_number}\nGenerated: ${new Date().toISOString()}`;

      // Update status to completed
      await knex('document_requests')
        .where('request_id', request_id)
        .update({
          status: 'completed',
          updated_at: knex.fn.now()
        });

      // Log the download
      const userId = req.user?.id || 'SYSTEM';
      await this._logAuditAction(userId, 'DOCUMENT_DOWNLOADED', request_id, {
        document_type: requestData.document_type,
        control_number: requestData.control_number
      });

      // Set response headers for PDF download (stubbed as plain text for now)
      const filename = `${requestData.document_type.replace('_', '_')}_${requestData.control_number}.txt`;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Send the stubbed content
      res.send(stubbedPdfContent);

    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate document'
      });
    }
  }

  /**
   * Get pending requests for officer approval
   */
  async getPendingRequests(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const requests = await knex('document_requests')
        .select(
          'document_requests.*',
          'residents.First_Name',
          'residents.Middle_Name',
          'residents.Last_Name',
          'residents.Mobile_Number'
        )
        .join('residents', 'document_requests.resident_id', 'residents.Resident_ID')
        .where('document_requests.status', 'pending')
        .orderBy('document_requests.created_at', 'asc')
        .limit(limit)
        .offset((page - 1) * limit);

      const formattedRequests = requests.map(row => ({
        request_id: row.request_id,
        resident_id: row.resident_id,
        resident_name: `${row.First_Name} ${row.Middle_Name || ''} ${row.Last_Name}`.trim(),
        mobile_number: row.Mobile_Number,
        document_type: row.document_type,
        document_type_info: this._getDocumentTypeInfo(row.document_type),
        created_at: row.created_at,
        request_data: JSON.parse(row.request_data || '{}')
      }));

      res.json({
        success: true,
        data: formattedRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching pending requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending requests'
      });
    }
  }

  /**
   * Validate QR code for document verification
   */
  async validateDocument(req, res) {
    try {
      const { qr_data } = req.body;

      if (!qr_data) {
        return res.status(400).json({
          success: false,
          message: 'QR data is required'
        });
      }

      // Find document by QR code
      const document = await knex('document_requests')
        .where('qr_code', qr_data)
        .where('status', 'completed')
        .first();

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or invalid'
        });
      }

      // Check if document is still valid
      const now = new Date();
      const validUntil = new Date(document.valid_until);

      const isValid = now <= validUntil;

      res.json({
        success: true,
        data: {
          control_number: document.control_number,
          document_type: document.document_type,
          resident_id: document.resident_id,
          issued_date: document.approved_at,
          valid_until: document.valid_until,
          approved_by: document.approved_by,
          is_valid: isValid,
          status: isValid ? 'VALID' : 'EXPIRED'
        }
      });

    } catch (error) {
      console.error('Error validating document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate document'
      });
    }
  }

  /**
   * Helper method to get document type information
   */
  _getDocumentTypeInfo(documentType) {
    const docTypes = {
      'barangay_clearance': { name: 'Barangay Clearance', estimated_time: '2-3 days' },
      'bonafide_certificate': { name: 'Bonafide Certificate', estimated_time: '2-3 days' },
      'building_permit': { name: 'Building Permit', estimated_time: '5-7 days' },
      'business_closure': { name: 'Business Closure Certificate', estimated_time: '3-5 days' },
      'cohabitation_certificate': { name: 'Cohabitation Certificate', estimated_time: '5-7 days' },
      'excavation_permit': { name: 'Excavation Permit', estimated_time: '3-5 days' },
      'fencing_permit': { name: 'Fencing Permit', estimated_time: '3-5 days' },
      'good_moral_certificate': { name: 'Good Moral Certificate', estimated_time: '2-3 days' },
      'indigency_certificate': { name: 'Indigency Certificate', estimated_time: '2-3 days' },
      'late_registration': { name: 'Late Registration Certificate', estimated_time: '3-5 days' },
      'ojt_certification': { name: 'OJT Certification', estimated_time: '2-3 days' },
      'low_income_housing': { name: 'Low Income Housing Certificate', estimated_time: '2-3 days' },
      'medico_legal': { name: 'Medico-Legal Certificate', estimated_time: '5-7 days' }
    };

    return docTypes[documentType] || { name: documentType, estimated_time: 'TBD' };
  }

  /**
   * Helper method to log audit actions
   */
  async _logAuditAction(userId, action, entityId, details) {
    try {
      await knex('audit_log').insert({
        user_id: userId,
        action: action,
        entity_type: 'document_request',
        entity_id: entityId,
        details: JSON.stringify(details),
        ip_address: 'SYSTEM', // Would be req.ip in real implementation
        created_at: knex.fn.now()
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
      // Don't fail the main operation if audit logging fails
    }
  }
}

module.exports = new DocumentController();
