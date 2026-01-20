const knex = require('knex')(require('../knexfile')[process.env.NODE_ENV || 'development']);
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { PDFDocument: PDFLibDocument } = require('pdf-lib');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

/**
 * Document Controller
 * Handles document request creation, approval, and generation
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
          estimated_time: '2-3 days',
        },
        {
          id: 'bonafide_certificate',
          name: 'Bonafide Certificate',
          description: 'Certificate of residency and good standing',
          required_fields: ['purpose'],
          user_fields: ['place_of_birth', 'purpose'],
          estimated_time: '2-3 days',
        },
        {
          id: 'building_permit',
          name: 'Building Permit',
          description: 'Permit for construction/building activities',
          required_fields: [],
          user_fields: ['place_of_birth'],
          estimated_time: '5-7 days',
        },
        {
          id: 'business_closure',
          name: 'Business Closure Certificate',
          description: 'Certificate confirming business closure',
          required_fields: ['business_name', 'business_address', 'closure_date'],
          user_fields: ['business_name', 'business_address', 'closure_date'],
          estimated_time: '3-5 days',
        },
        {
          id: 'cohabitation_certificate',
          name: 'Cohabitation Certificate',
          description: 'Certificate of common-law relationship',
          required_fields: [
            'partner1_name',
            'partner2_name',
            'cohabitation_date',
            'blotter_number',
            'blotter_date',
            'children_count',
          ],
          user_fields: [
            'partner1_name',
            'partner2_name',
            'cohabitation_date',
            'blotter_number',
            'blotter_date',
            'children_count',
          ],
          estimated_time: '5-7 days',
        },
        {
          id: 'excavation_permit',
          name: 'Excavation Permit',
          description: 'Permit for excavation work',
          required_fields: [],
          user_fields: ['place_of_birth'],
          estimated_time: '3-5 days',
        },
        {
          id: 'fencing_permit',
          name: 'Fencing Permit',
          description: 'Permit for fence construction',
          required_fields: [],
          user_fields: ['place_of_birth'],
          estimated_time: '3-5 days',
        },
        {
          id: 'good_moral_certificate',
          name: 'Good Moral Certificate',
          description: 'Certificate of good moral character',
          required_fields: ['school_year', 'purpose'],
          user_fields: ['school_year', 'purpose'],
          estimated_time: '2-3 days',
        },
        {
          id: 'indigency_certificate',
          name: 'Indigency Certificate',
          description: 'Certificate of financial need',
          required_fields: ['purpose', 'specific_purpose'],
          user_fields: ['purpose', 'specific_purpose'],
          estimated_time: '2-3 days',
        },
        {
          id: 'late_registration',
          name: 'Late Registration Certificate',
          description: 'Certificate for late birth registration',
          required_fields: ['father_name', 'mother_name'],
          user_fields: ['father_name', 'mother_name', 'place_of_birth'],
          estimated_time: '3-5 days',
        },
        {
          id: 'ojt_certification',
          name: 'OJT Certification',
          description: 'On-the-Job Training certification',
          required_fields: [],
          user_fields: ['place_of_birth'],
          estimated_time: '2-3 days',
        },
        {
          id: 'low_income_housing',
          name: 'Low Income Housing Certificate',
          description: 'Certificate for low-income housing assistance',
          required_fields: ['monthly_income'],
          user_fields: ['monthly_income'],
          estimated_time: '2-3 days',
        },
        {
          id: 'medico_legal',
          name: 'Medico-Legal Certificate',
          description: 'Medical-legal documentation request',
          required_fields: ['requestor_name', 'blotter_reference'],
          user_fields: ['requestor_name', 'blotter_reference'],
          estimated_time: '5-7 days',
        },
      ];

      res.json({
        success: true,
        data: documentTypes,
      });
    } catch (error) {
      console.error('Error fetching document types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document types',
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

      // CRITICAL: Enforce Verification Gate - Check account status
      if (req.user?.account_status !== 'Verified') {
        return res.status(403).json({
          success: false,
          message: 'Account is not verified. Please upload a valid ID first.',
        });
      }

      // BUSINESS LOGIC FIX: Blotter Block - Check for active/pending blotter cases BEFORE proceeding
      const blotterResult = await knex('blotter')
        .count('* as total')
        .where('respondent_id', resident_id)
        .whereIn('Status', ['Active', 'Pending', 'Ongoing']);

      const total = blotterResult[0] ? blotterResult[0].total || 0 : 0;

      if (total > 0) {
        return res.status(403).json({
          success: false,
          message: 'Certificate request blocked. Resident has active or pending blotter cases.',
          clearpass_status: 'BLOCKED',
          reason: 'Active blotter record found',
        });
      }

      // Validate required fields
      if (!resident_id || !document_type) {
        return res.status(400).json({
          success: false,
          message: 'Resident ID and document type are required',
        });
      }

      // Verify resident exists
      const resident = await knex('residents')
        .select('*')
        .where('Resident_ID', resident_id)
        .first();

      if (!resident) {
        return res.status(404).json({
          success: false,
          message: 'Resident not found',
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
        resident_data: JSON.stringify({
          First_Name: resident.First_Name,
          Last_Name: resident.Last_Name,
          Middle_Name: resident.Middle_Name,
          Civil_Status: resident.Civil_Status,
          Nationality: resident.Nationality,
          Gender: resident.Gender,
        }),
        status: 'pending',
        created_at: knex.fn.now(),
      });

      // Log the action
      await this._logAuditAction(user_id, 'DOCUMENT_REQUEST_CREATED', requestId, {
        document_type,
        resident_id,
      });

      res.status(201).json({
        success: true,
        message: 'Document request created successfully',
        data: {
          request_id: requestId,
          document_type: document_type,
          status: 'pending',
          created_at: new Date().toISOString(),
          estimated_time: this._getDocumentTypeInfo(document_type).estimated_time,
        },
      });
    } catch (error) {
      console.error('Error creating document request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create document request',
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

      let query = knex('document_requests').select('*').orderBy('created_at', 'desc');

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
        document_type_info: this._getDocumentTypeInfo(row.document_type),
      }));

      res.json({
        success: true,
        data: formattedRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Error fetching document requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document requests',
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
      const requestData = await knex('document_requests').where('request_id', request_id).first();

      if (!requestData) {
        return res.status(404).json({
          success: false,
          message: 'Document request not found',
        });
      }

      // Parse existing request data
      let currentRequestDetails = {};
      try {
        currentRequestDetails = JSON.parse(requestData.request_data || '{}');
      } catch (e) {
        currentRequestDetails = {};
      }

      // Merge new approval details
      const updatedRequestDetails = {
        ...currentRequestDetails,
        ctc_number,
        or_number,
        prepared_by_officer: prepared_by,
      };

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
          request_data: JSON.stringify(updatedRequestDetails),
          updated_at: knex.fn.now(),
        });

      // UNIFY: Sync with certificates_log to ensure completeness of records
      try {
        const resident = await knex('residents')
          .select('residents.*', 'households.Street_Address', 'sitios.name as sitio_name')
          .leftJoin('households', 'residents.Household_ID', 'households.Household_ID')
          .leftJoin('sitios', 'households.Sitio_ID', 'sitios.id')
          .where('Resident_ID', requestData.resident_id)
          .first();

        if (resident) {
          const residentName =
            `${resident.First_Name} ${resident.Middle_Name || ''} ${resident.Last_Name}`.trim();
          const address = `${resident.Street_Address || ''}, ${resident.sitio_name || ''}`.trim();

          // Check if already exists to avoid duplicates
          const exists = await knex('certificates_log').where('control_no', controlNumber).first();

          if (!exists) {
            await knex('certificates_log').insert({
              control_no: controlNumber,
              resident_id: requestData.resident_id,
              certificate_type: this._getDocumentTitle(requestData.document_type), // Use Title Case
              purpose: updatedRequestDetails.purpose || 'Official Request',
              date_issued: new Date(),
              signatory_captain: 'HON. JUAN DELA CRUZ', // Ideally fetch from settings
              signatory_secretary: 'MARIA SANTOS', // Ideally fetch from settings
              qr_validation_string: `QR-${controlNumber}`,
              status: 'Released',
              // fee_amount removed
              created_at: knex.fn.now(),
              resident_name: residentName,
              address: address,
              is_manual: 0,
            });
          }
        }
      } catch (logError) {
        console.error('Error syncing to certificates_log:', logError);
        // Do not fail the main request, just log the error
      }

      // Log the approval
      await this._logAuditAction(approved_by, 'DOCUMENT_REQUEST_APPROVED', request_id, {
        document_type: requestData.document_type,
        resident_id: requestData.resident_id,
        control_number: controlNumber,
      });

      res.json({
        success: true,
        message: 'Document request approved successfully',
        data: {
          request_id: request_id,
          status: 'approved',
          control_number: controlNumber,
          valid_until: validUntil.toISOString(),
          approved_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error approving document request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve document request',
      });
    }
  }

  /**
   * Generate and download the final PDF document
   */
  async downloadDocument(req, res) {
    try {
      const { request_id } = req.params;

      // Get the approved request with resident data
      const requestData = await knex('document_requests')
        .select(
          'document_requests.*',
          'residents.First_Name',
          'residents.Middle_Name',
          'residents.Last_Name',
          'households.Street_Address as Address',
          'residents.Birthdate as Date_of_Birth',
          'residents.Civil_Status',
          'residents.Gender'
        )
        .join('residents', 'document_requests.resident_id', 'residents.Resident_ID')
        .join('households', 'residents.Household_ID', 'households.Household_ID')
        .where('document_requests.request_id', request_id)
        .where('document_requests.status', 'approved')
        .first();

      if (!requestData) {
        return res.status(404).json({
          success: false,
          message: 'Approved document request not found',
        });
      }

      // Parse request data
      const requestDetails = JSON.parse(requestData.request_data || '{}');

      // Check for custom template
      let template = await knex('document_templates')
        .where('document_type', requestData.document_type)
        .where('is_active', true)
        .first();

      // If not found, try normalized key (Title Case -> snake_case)
      if (!template) {
        const normalizedType = requestData.document_type.toLowerCase().replace(/ /g, '_');
        template = await knex('document_templates')
          .where('document_type', normalizedType)
          .where('is_active', true)
          .first();
      }

      // FALLBACK: Check local file system
      if (!template) {
        template = this._findLocalTemplate(requestData.document_type);
      }

      if (template && template.file_data) {
        // Use dynamic template generation
        await this._generateFromTemplate(res, template, requestData, requestDetails);
      } else {
        // Fallback to legacy programmatic generation
        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
        });

        // Set response headers for PDF download
        const filename = `${requestData.document_type.replace(/_/g, '_')}_${requestData.control_number}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe the PDF to the response
        doc.pipe(res);

        // Generate PDF content based on document type
        await this._generatePDFContent(doc, requestData, requestDetails);

        // Finalize the PDF
        doc.end();
      }

      // Update status to completed after successful generation
      await knex('document_requests').where('request_id', request_id).update({
        status: 'completed',
        updated_at: knex.fn.now(),
      });

      // Log the download
      const userId = req.user?.id || 'SYSTEM';
      await this._logAuditAction(userId, 'DOCUMENT_DOWNLOADED', request_id, {
        document_type: requestData.document_type,
        control_number: requestData.control_number,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to generate document',
        });
      }
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
        request_data: JSON.parse(row.request_data || '{}'),
      }));

      res.json({
        success: true,
        data: formattedRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending requests',
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
          message: 'QR data is required',
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
          message: 'Document not found or invalid',
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
          status: isValid ? 'VALID' : 'EXPIRED',
        },
      });
    } catch (error) {
      console.error('Error validating document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate document',
      });
    }
  }

  /**
   * Verify QR code for documents and IDs
   */
  async verifyQRCode(req, res) {
    try {
      const { qr_code_data } = req.body;

      if (!qr_code_data) {
        return res.status(400).json({
          error: 'QR code data is required',
          message: 'Please provide the QR code data to verify',
        });
      }

      // First, check certificates_log table for QR validation strings
      const certificate = await knex('certificates_log')
        .select(
          'certificates_log.*',
          'residents.First_Name',
          'residents.Last_Name',
          'residents.Mobile_Number',
          'households.Street_Address',
          'sitios.name as sitio_name'
        )
        .leftJoin('residents', 'certificates_log.resident_id', 'residents.Resident_ID')
        .leftJoin('households', 'residents.Household_ID', 'households.Household_ID')
        .leftJoin('sitios', 'households.Sitio_ID', 'sitios.id')
        .where('certificates_log.qr_validation_string', qr_code_data)
        .where('certificates_log.status', 'Released')
        .first();

      if (certificate) {
        // Found a certificate
        const residentName =
          `${certificate.First_Name || 'Unknown'} ${certificate.Last_Name || ''}`.trim();
        const address = certificate.Street_Address || 'Not specified';
        const sitio = certificate.sitio_name || 'Not specified';

        return res.json({
          status: 'VALID',
          type: 'certificate',
          message: 'Certificate verified successfully',
          certificate: {
            number: certificate.control_no,
            type: certificate.certificate_type,
            resident_name: residentName,
            address: address,
            sitio: sitio,
            issued_date: certificate.date_issued,
            signatory_captain: certificate.signatory_captain || 'Captain Juan Dela Cruz',
            signatory_secretary: certificate.signatory_secretary || 'Secretary Maria Santos',
          },
        });
      }

      // If not found in certificates, check residents table for ID QR codes
      const resident = await knex('residents')
        .select('residents.*', 'households.Street_Address', 'sitios.name as sitio_name')
        .leftJoin('households', 'residents.Household_ID', 'households.Household_ID')
        .leftJoin('sitios', 'households.Sitio_ID', 'sitios.id')
        .where('residents.qr_identity_hash', qr_code_data)
        .first();

      if (resident) {
        // Found a resident ID
        const age = resident.Birthdate
          ? new Date().getFullYear() - new Date(resident.Birthdate).getFullYear()
          : 'N/A';

        return res.json({
          status: 'VALID',
          type: 'barangay_id',
          message: 'Barangay ID verified successfully',
          resident: {
            name: `${resident.First_Name} ${resident.Middle_Name || ''} ${resident.Last_Name}`.trim(),
            age: age,
            address: resident.Street_Address || 'Not specified',
            sitio: resident.sitio_name || 'Not specified',
            contact: resident.Mobile_Number || 'Not specified',
          },
        });
      }

      // QR code not found in any table
      return res.json({
        status: 'INVALID',
        message: 'QR code not found or invalid. This document may be counterfeit or expired.',
      });
    } catch (error) {
      console.error('QR verification error:', error);
      return res.status(500).json({
        status: 'ERROR',
        message: 'Verification service temporarily unavailable. Please try again later.',
      });
    }
  }

  /**
   * Helper method to get document type information
   */
  _getDocumentTypeInfo(documentType) {
    const docTypes = {
      barangay_clearance: { name: 'Barangay Clearance', estimated_time: '2-3 days' },
      bonafide_certificate: { name: 'Bonafide Certificate', estimated_time: '2-3 days' },
      building_permit: { name: 'Building Permit', estimated_time: '5-7 days' },
      business_closure: { name: 'Business Closure Certificate', estimated_time: '3-5 days' },
      cohabitation_certificate: { name: 'Cohabitation Certificate', estimated_time: '5-7 days' },
      excavation_permit: { name: 'Excavation Permit', estimated_time: '3-5 days' },
      fencing_permit: { name: 'Fencing Permit', estimated_time: '3-5 days' },
      good_moral_certificate: { name: 'Good Moral Certificate', estimated_time: '2-3 days' },
      indigency_certificate: { name: 'Indigency Certificate', estimated_time: '2-3 days' },
      late_registration: { name: 'Late Registration Certificate', estimated_time: '3-5 days' },
      ojt_certification: { name: 'OJT Certification', estimated_time: '2-3 days' },
      low_income_housing: { name: 'Low Income Housing Certificate', estimated_time: '2-3 days' },
      medico_legal: { name: 'Medico-Legal Certificate', estimated_time: '5-7 days' },
    };

    return docTypes[documentType] || { name: documentType, estimated_time: 'TBD' };
  }

  /**
   * Generate PDF content based on document type
   */
  async _generatePDFContent(doc, requestData, requestDetails) {
    const { document_type, control_number, approved_at, valid_until } = requestData;
    const residentName =
      `${requestData.First_Name} ${requestData.Middle_Name || ''} ${requestData.Last_Name}`.trim();

    // Document title and styling
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Header - Barangay Information
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('REPUBLIC OF THE PHILIPPINES', 0, 50, { align: 'center', width: pageWidth });
    doc.text('PROVINCE OF BULACAN', 0, 70, { align: 'center', width: pageWidth });
    doc.text('MUNICIPALITY OF BOCAUE', 0, 90, { align: 'center', width: pageWidth });
    doc.text('BARANGAY BATIA', 0, 110, { align: 'center', width: pageWidth });

    // Document title based on type
    const docTitle = this._getDocumentTitle(document_type);
    doc.moveDown(2);
    doc.fontSize(18).font('Helvetica-Bold');
    doc.text(docTitle, 0, 140, { align: 'center', width: pageWidth });
    doc.moveDown(1);

    // Control Number
    doc.fontSize(12).font('Helvetica');
    doc.text(`Control No: ${control_number}`, 50, 180);

    // Main content based on document type
    let yPosition = 220;

    switch (document_type) {
      case 'barangay_clearance':
        yPosition = await this._generateClearanceContent(
          doc,
          requestData,
          requestDetails,
          yPosition
        );
        break;
      case 'indigency_certificate':
        yPosition = await this._generateIndigencyContent(
          doc,
          requestData,
          requestDetails,
          yPosition
        );
        break;
      case 'good_moral_certificate':
        yPosition = await this._generateGoodMoralContent(
          doc,
          requestData,
          requestDetails,
          yPosition
        );
        break;
      case 'bonafide_certificate':
        yPosition = await this._generateBonafideContent(
          doc,
          requestData,
          requestDetails,
          yPosition
        );
        break;
      default:
        yPosition = await this._generateGenericContent(doc, requestData, requestDetails, yPosition);
    }

    // Footer - Validity and Signatures
    yPosition += 40;
    doc.fontSize(10).font('Helvetica');

    // Validity period
    if (valid_until) {
      const validDate = new Date(valid_until).toLocaleDateString('en-PH');
      doc.text(`This document is valid until: ${validDate}`, 50, yPosition);
      yPosition += 20;
    }

    // Issue date
    const issueDate = new Date(approved_at || new Date()).toLocaleDateString('en-PH');
    doc.text(`Issued on: ${issueDate}`, 50, yPosition);
    yPosition += 30;

    // Signatures section
    const signatureY = yPosition;
    const leftX = 80;
    const rightX = pageWidth - 200;

    // Left signature
    doc.text('Prepared by:', leftX, signatureY);
    doc.text('Barangay Secretary', leftX, signatureY + 40);
    doc
      .moveTo(leftX, signatureY + 60)
      .lineTo(leftX + 120, signatureY + 60)
      .stroke();

    // Right signature
    doc.text('Approved by:', rightX, signatureY);
    doc.text('Punong Barangay', rightX, signatureY + 40);
    doc
      .moveTo(rightX, signatureY + 60)
      .lineTo(rightX + 120, signatureY + 60)
      .stroke();

    // QR Code placeholder (for future implementation)
    doc.text('QR Code for Verification', pageWidth - 150, pageHeight - 100);
    doc.rect(pageWidth - 120, pageHeight - 90, 60, 60).stroke();
  }

  /**
   * Generate clearance certificate content
   */
  async _generateClearanceContent(doc, requestData, requestDetails, yPosition) {
    const residentName =
      `${requestData.First_Name} ${requestData.Middle_Name || ''} ${requestData.Last_Name}`.trim();

    doc.fontSize(12).font('Helvetica');
    doc.text('TO WHOM IT MAY CONCERN:', 50, yPosition);
    yPosition += 30;

    doc.text('This is to certify that:', 50, yPosition);
    yPosition += 20;

    doc.font('Helvetica-Bold');
    doc.text(residentName.toUpperCase(), 80, yPosition);
    yPosition += 20;

    doc.font('Helvetica');
    doc.text(`${requestData.Address || 'Address not specified'}`, 80, yPosition);
    yPosition += 20;

    const age = requestData.Date_of_Birth
      ? new Date().getFullYear() - new Date(requestData.Date_of_Birth).getFullYear()
      : 'N/A';
    doc.text(`Age: ${age}`, 80, yPosition);
    yPosition += 20;

    doc.text(`Civil Status: ${requestData.Civil_Status || 'Not specified'}`, 80, yPosition);
    yPosition += 30;

    doc.text(
      'is a bonafide resident of Barangay Batia, Bocaue, Bulacan and is known to be a person of good moral',
      50,
      yPosition
    );
    yPosition += 20;
    doc.text('character and has no derogatory record on file.', 50, yPosition);
    yPosition += 30;

    if (requestDetails.purpose) {
      doc.text(`Purpose: ${requestDetails.purpose}`, 50, yPosition);
      yPosition += 30;
    }

    doc.text(
      'This certification is issued upon request of the above-named person for whatever legal purpose',
      50,
      yPosition
    );
    yPosition += 20;
    doc.text('it may serve.', 50, yPosition);
    yPosition += 30;

    return yPosition;
  }

  /**
   * Generate indigency certificate content
   */
  async _generateIndigencyContent(doc, requestData, requestDetails, yPosition) {
    const residentName =
      `${requestData.First_Name} ${requestData.Middle_Name || ''} ${requestData.Last_Name}`.trim();

    doc.fontSize(12).font('Helvetica');
    doc.text('TO WHOM IT MAY CONCERN:', 50, yPosition);
    yPosition += 30;

    doc.text('This is to certify that:', 50, yPosition);
    yPosition += 20;

    doc.font('Helvetica-Bold');
    doc.text(residentName.toUpperCase(), 80, yPosition);
    yPosition += 20;

    doc.font('Helvetica');
    doc.text(`${requestData.Address || 'Address not specified'}`, 80, yPosition);
    yPosition += 20;

    doc.text(`Civil Status: ${requestData.Civil_Status || 'Not specified'}`, 80, yPosition);
    yPosition += 30;

    doc.text(
      'is a resident of Barangay Batia, Bocaue, Bulacan and belongs to the indigent sector of our',
      50,
      yPosition
    );
    yPosition += 20;
    doc.text(
      'community. This certification is issued to attest to his/her indigency status.',
      50,
      yPosition
    );
    yPosition += 30;

    if (requestDetails.purpose || requestDetails.specific_purpose) {
      const purpose = requestDetails.specific_purpose || requestDetails.purpose;
      doc.text(`Purpose: ${purpose}`, 50, yPosition);
      yPosition += 30;
    }

    if (requestDetails.monthly_income) {
      doc.text(`Monthly Income: ₱${requestDetails.monthly_income}`, 50, yPosition);
      yPosition += 30;
    }

    return yPosition;
  }

  /**
   * Generate good moral certificate content
   */
  async _generateGoodMoralContent(doc, requestData, requestDetails, yPosition) {
    const residentName =
      `${requestData.First_Name} ${requestData.Middle_Name || ''} ${requestData.Last_Name}`.trim();

    doc.fontSize(12).font('Helvetica');
    doc.text('TO WHOM IT MAY CONCERN:', 50, yPosition);
    yPosition += 30;

    doc.text('This is to certify that:', 50, yPosition);
    yPosition += 20;

    doc.font('Helvetica-Bold');
    doc.text(residentName.toUpperCase(), 80, yPosition);
    yPosition += 20;

    doc.font('Helvetica');
    doc.text(`${requestData.Address || 'Address not specified'}`, 80, yPosition);
    yPosition += 20;

    doc.text(`Civil Status: ${requestData.Civil_Status || 'Not specified'}`, 80, yPosition);
    yPosition += 30;

    doc.text(
      'is a resident of Barangay Batia, Bocaue, Bulacan and is known to be a person of good moral',
      50,
      yPosition
    );
    yPosition += 20;
    doc.text(
      'character and has no derogatory record or complaint filed against him/her in this barangay.',
      50,
      yPosition
    );
    yPosition += 30;

    if (requestDetails.purpose) {
      doc.text(`Purpose: ${requestDetails.purpose}`, 50, yPosition);
      yPosition += 20;
    }

    if (requestDetails.school_year) {
      doc.text(`School Year: ${requestDetails.school_year}`, 50, yPosition);
      yPosition += 30;
    }

    return yPosition;
  }

  /**
   * Generate bonafide certificate content
   */
  async _generateBonafideContent(doc, requestData, requestDetails, yPosition) {
    const residentName =
      `${requestData.First_Name} ${requestData.Middle_Name || ''} ${requestData.Last_Name}`.trim();

    doc.fontSize(12).font('Helvetica');
    doc.text('TO WHOM IT MAY CONCERN:', 50, yPosition);
    yPosition += 30;

    doc.text('This is to certify that:', 50, yPosition);
    yPosition += 20;

    doc.font('Helvetica-Bold');
    doc.text(residentName.toUpperCase(), 80, yPosition);
    yPosition += 20;

    doc.font('Helvetica');
    doc.text(`${requestData.Address || 'Address not specified'}`, 80, yPosition);
    yPosition += 20;

    doc.text(`Civil Status: ${requestData.Civil_Status || 'Not specified'}`, 80, yPosition);
    yPosition += 30;

    doc.text(
      'is a bonafide resident of Barangay Batia, Bocaue, Bulacan and has been residing in this',
      50,
      yPosition
    );
    yPosition += 20;
    doc.text('barangay for a considerable length of time.', 50, yPosition);
    yPosition += 30;

    if (requestDetails.purpose) {
      doc.text(`Purpose: ${requestDetails.purpose}`, 50, yPosition);
      yPosition += 30;
    }

    doc.text(
      'This certification is issued upon the request of the above-named person for whatever legal',
      50,
      yPosition
    );
    yPosition += 20;
    doc.text('purpose it may serve.', 50, yPosition);
    yPosition += 30;

    return yPosition;
  }

  /**
   * Generate generic certificate content for other document types
   */
  async _generateGenericContent(doc, requestData, requestDetails, yPosition) {
    const residentName =
      `${requestData.First_Name} ${requestData.Middle_Name || ''} ${requestData.Last_Name}`.trim();
    const docTypeInfo = this._getDocumentTypeInfo(requestData.document_type);

    doc.fontSize(12).font('Helvetica');
    doc.text('TO WHOM IT MAY CONCERN:', 50, yPosition);
    yPosition += 30;

    doc.text('This is to certify that:', 50, yPosition);
    yPosition += 20;

    doc.font('Helvetica-Bold');
    doc.text(residentName.toUpperCase(), 80, yPosition);
    yPosition += 20;

    doc.font('Helvetica');
    doc.text(`${requestData.Address || 'Address not specified'}`, 80, yPosition);
    yPosition += 20;

    doc.text(`Civil Status: ${requestData.Civil_Status || 'Not specified'}`, 80, yPosition);
    yPosition += 30;

    // Add document-specific content
    const content = this._getDocumentSpecificContent(requestData.document_type, requestDetails);
    doc.text(content, 50, yPosition, { width: doc.page.width - 100 });
    yPosition += content.split('\n').length * 20 + 20;

    return yPosition;
  }

  /**
   * Get document title based on type
   */
  _getDocumentTitle(documentType) {
    const titles = {
      barangay_clearance: 'BARANGAY CLEARANCE',
      bonafide_certificate: 'CERTIFICATE OF RESIDENCY',
      indigency_certificate: 'CERTIFICATE OF INDIGENCY',
      good_moral_certificate: 'CERTIFICATE OF GOOD MORAL CHARACTER',
      building_permit: 'BUILDING PERMIT',
      business_closure: 'CERTIFICATE OF BUSINESS CLOSURE',
      cohabitation_certificate: 'CERTIFICATE OF COHABITATION',
      excavation_permit: 'EXCAVATION PERMIT',
      fencing_permit: 'FENCING PERMIT',
      late_registration: 'CERTIFICATE OF LATE REGISTRATION',
      ojt_certification: 'OJT CERTIFICATION',
      low_income_housing: 'CERTIFICATE FOR LOW INCOME HOUSING',
      medico_legal: 'MEDICO-LEGAL CERTIFICATE',
    };
    return titles[documentType] || 'CERTIFICATE';
  }

  /**
   * Get document-specific content for generic certificates
   */
  _getDocumentSpecificContent(documentType, requestDetails) {
    const contents = {
      building_permit:
        'is hereby granted permission to conduct building construction activities in Barangay Batia, Bocaue, Bulacan, subject to compliance with all applicable building codes and regulations.',
      business_closure: `has officially closed their business operations located at ${requestDetails.business_address || 'address not specified'}. The business closure was recorded on ${requestDetails.closure_date || 'date not specified'}.`,
      cohabitation_certificate: `is cohabiting with ${requestDetails.partner1_name || 'Partner 1'} and ${requestDetails.partner2_name || 'Partner 2'} as common-law partners since ${requestDetails.cohabitation_date || 'date not specified'}. They have ${requestDetails.children_count || 0} children. Reference: Blotter ${requestDetails.blotter_number || 'N/A'} dated ${requestDetails.blotter_date || 'N/A'}.`,
      excavation_permit:
        'is hereby granted permission to conduct excavation work in Barangay Batia, Bocaue, Bulacan, subject to compliance with all safety regulations.',
      fencing_permit:
        'is hereby granted permission to construct fencing in Barangay Batia, Bocaue, Bulacan, subject to compliance with all zoning regulations.',
      late_registration: `was born to ${requestDetails.father_name || 'Father'} and ${requestDetails.mother_name || 'Mother'} in ${requestDetails.place_of_birth || requestDetails.place_of_birth || 'place not specified'}. This certificate is issued for late birth registration purposes.`,
      ojt_certification:
        'has completed the required On-the-Job Training hours and is certified to have gained the necessary work experience.',
      low_income_housing: `qualifies for low-income housing assistance with a monthly income of ₱${requestDetails.monthly_income || 'not specified'}.`,
      medico_legal: `requires medico-legal documentation. Requestor: ${requestDetails.requestor_name || 'Not specified'}. Blotter Reference: ${requestDetails.blotter_reference || 'Not specified'}.`,
    };
    return (
      contents[documentType] || 'This certificate is issued for the purposes stated in the request.'
    );
  }

  /**
   * THEMIS CLEARPASS: Check if resident has active blotter cases
   */
  async checkClearPassBlock(resident_id) {
    try {
      const [count] = await knex('blotter')
        .count('* as total')
        .where('respondent_id', resident_id)
        .whereIn('Status', ['Active', 'Pending']);

      return count[0].total > 0;
    } catch (error) {
      console.error('Error checking ClearPass block:', error);
      // Fail-safe: return true (block) if database error
      return true;
    }
  }

  /**
   * Helper method to log audit actions
   */
  async _logAuditAction(userId, action, entityId, details) {
    try {
      const eventType =
        action === 'CREATE'
          ? 'DOCUMENT_REQUEST_CREATED'
          : action === 'VIEW'
            ? 'DOCUMENT_REQUEST_VIEWED'
            : 'DOCUMENT_REQUEST_UPDATED';
      await knex('audit_logs').insert({
        event_type: eventType,
        user_id: String(userId),
        user_role: null,
        ip_address: 'SYSTEM',
        user_agent: null,
        resource: 'document_request',
        action: action,
        result: 'SUCCESS',
        details: details ? JSON.stringify(details) : null,
        session_id: null,
        created_at: knex.fn.now(),
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
      // Don't fail the main operation if audit logging fails
    }
  }

  /**
   * Generate document from uploaded template (PDF or DOCX)
   */
  async _generateFromTemplate(res, template, requestData, requestDetails) {
    const fileBuffer = template.file_data;
    const isPDF =
      template.file_encoding === 'application/pdf' ||
      template.template_name.toLowerCase().endsWith('.pdf');
    const isDOCX =
      template.file_encoding ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      template.file_encoding === 'application/msword' ||
      template.template_name.toLowerCase().endsWith('.docx');

    // Merge data for templating
    const mergedData = this._mergeData(requestData, requestDetails);

    if (isPDF) {
      const pdfBytes = await this._fillPDFTemplate(fileBuffer, mergedData);

      const filename = `${requestData.document_type}_${requestData.control_number}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(pdfBytes));
    } else if (isDOCX) {
      const docxBuffer = this._fillDOCXTemplate(fileBuffer, mergedData);

      const filename = `${requestData.document_type}_${requestData.control_number}.docx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(docxBuffer);
    } else {
      throw new Error('Unsupported template format');
    }
  }

  /**
   * Fill PDF Form fields using pdf-lib
   */
  async _fillPDFTemplate(buffer, data) {
    const pdfDoc = await PDFLibDocument.load(buffer);
    const form = pdfDoc.getForm();

    // Iterate over data keys and try to find matching form fields
    for (const [key, value] of Object.entries(data)) {
      try {
        const field = form.getField(key);
        if (field) {
          // Handle different field types if necessary, but setText is common
          // Check if it's a checkbox
          if (field.constructor.name === 'PDFCheckBox') {
            if (value === true || value === 'true' || value === 'yes') {
              field.check();
            }
          } else {
            field.setText(String(value || ''));
          }
        }
      } catch (err) {
        // Field not found, ignore
      }
    }

    // Flatten the form to prevent editing
    form.flatten();

    return await pdfDoc.save();
  }

  /**
   * Fill DOCX placeholders using docxtemplater
   */
  _fillDOCXTemplate(buffer, data) {
    const zip = new PizZip(buffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(data);

    return doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });
  }

  /**
   * Helper to find local template file
   */
  _findLocalTemplate(documentType) {
    try {
      const templateDir = path.join(__dirname, '../../Certificate Templates');
      // Mapping of document_type to filename
      // Note: Most files are .doc and incompatible. Only .docx files work.
      const fileMapping = {
        barangay_clearance: '1 bgy clearance.docx',
        // Add more mappings here if files are converted to .docx
        // 'bonafide_certificate': '1 bonafide blank.docx',
      };

      const filename = fileMapping[documentType];
      if (filename) {
        const filePath = path.join(templateDir, filename);
        if (fs.existsSync(filePath)) {
          console.log(`Using local template: ${filePath}`);
          return {
            file_data: fs.readFileSync(filePath),
            template_name: filename,
            file_encoding:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          };
        }
      }
    } catch (err) {
      console.error('Error finding local template:', err);
    }
    return null;
  }

  /**
   * Merge resident and request data into a flat object
   */
  _mergeData(requestData, requestDetails) {
    const residentName =
      `${requestData.First_Name} ${requestData.Middle_Name || ''} ${requestData.Last_Name}`.trim();
    const age = requestData.Date_of_Birth
      ? new Date().getFullYear() - new Date(requestData.Date_of_Birth).getFullYear()
      : 'N/A';

    // Base data
    const data = {
      control_number: requestData.control_number,
      document_type: this._getDocumentTitle(requestData.document_type),
      date_issued: new Date(requestData.approved_at || new Date()).toLocaleDateString('en-PH'),
      valid_until: requestData.valid_until
        ? new Date(requestData.valid_until).toLocaleDateString('en-PH')
        : 'N/A',

      // Resident Data
      resident_name: residentName,
      first_name: requestData.First_Name,
      last_name: requestData.Last_Name,
      middle_name: requestData.Middle_Name || '',
      address: requestData.Address || '',
      age: String(age),
      civil_status: requestData.Civil_Status || '',
      gender: requestData.Gender || '',
      place_of_birth: requestData.Place_of_Birth || '',
      date_of_birth: requestData.Date_of_Birth
        ? new Date(requestData.Date_of_Birth).toLocaleDateString('en-PH')
        : '',

      // Officials (Hardcoded for now, ideally from settings)
      captain_name: 'HON. JUAN DELA CRUZ',
      secretary_name: 'MARIA SANTOS',
      barangay_name: 'BARANGAY BATIA',
      municipality_name: 'MUNICIPALITY OF BOCAUE',
      province_name: 'PROVINCE OF BULACAN',

      // New mappings for template compatibility
      issued_on: new Date(requestData.approved_at || new Date()).toLocaleDateString('en-PH'),
      ctc_no: requestDetails.ctc_number || '',
      or_no: requestDetails.or_number || '',
      prepared_by: requestDetails.prepared_by_officer || 'MARIA SANTOS',
      issued_at: 'Barangay Batia, Bocaue, Bulacan',

      // Request Details (User input overrides base data if same key)
      ...requestDetails,
    };

    return data;
  }
}

module.exports = new DocumentController();
