const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
// const db = require('../database');
const { ROLES } = require('../config/roles');
const uploadMiddleware = require('../middleware/upload').any();
const {
  isEncryptionEnabled,
  encryptFileToEncryptedPath,
  resolveAndValidateUploadedDocumentPath,
  sendStoredDocument,
} = require('../utils/documentStorage');
const { logAuditEvent, logAuditToDatabase, AUDIT_EVENTS } = require('../middleware/auditLogger');
const ResidentService = require('../services/residentService');

const calculateAge = birthdate => {
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

exports.getAll = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const residentService = new ResidentService(db);
    const result = await residentService.getAll(req.query || {});
    res.json(result);
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
};

exports.getById = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const residentService = new ResidentService(db);
    const resident = await residentService.getById(req.params.id);

    if (!resident) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    res.json(resident);
  } catch (error) {
    console.error('Error fetching resident:', error);
    res.status(500).json({ error: 'Failed to fetch resident' });
  }
};

exports.checkDuplicate = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const { first_name, last_name, birthdate } = req.body || {};
    const residentService = new ResidentService(db);
    const duplicates = await residentService.checkDuplicate({ first_name, last_name, birthdate });

    res.json({
      is_duplicate: duplicates.length > 0,
      duplicates: duplicates,
      message:
        duplicates.length > 0
          ? 'Possible duplicate found. Please verify if this is the same person.'
          : 'No duplicates found. Safe to proceed.',
    });
  } catch (error) {
    if (error.message === 'First name, last name, and birthdate are required') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error checking duplicates:', error);
    res.status(500).json({ error: 'Failed to check for duplicates' });
  }
};

exports.create = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const { first_name, last_name, birthdate, household_id, email, gender } = req.body || {};

    if (!first_name || !last_name || !birthdate || !household_id || !email || !gender) {
      return res.status(400).json({
        error: 'Required fields: first_name, last_name, birthdate, household_id, email, gender',
      });
    }

    const residentService = new ResidentService(db);
    const result = await residentService.create(req.body, req.files);

    res.status(201).json({
      ...result,
      message: 'Resident created successfully',
    });
  } catch (error) {
    console.error('Error creating resident:', error);

    let errorMessage = 'Failed to create resident';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Duplicate entry found (possibly email or ID).';
    } else if (error.message.includes('Email address is already registered')) {
      return res.status(409).json({ error: error.message });
    } else if (error.message.includes('Invalid household_id')) {
      return res.status(400).json({ error: error.message });
    } else if (process.env.NODE_ENV === 'development') {
      errorMessage = error.message;
    }

    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
    });
  }
};

exports.update = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const residentService = new ResidentService(db);
    await residentService.update(req.params.id, req.body, req.files);
    res.json({ message: 'Resident updated successfully' });
  } catch (error) {
    console.error('Error updating resident:', error);
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update resident' });
  }
};

exports.archive = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const residentService = new ResidentService(db);
    await residentService.archive(req.params.id, req.body);
    res.json({ message: 'Resident archived successfully', status: 'Transferred Out' });
  } catch (error) {
    console.error('Error archiving resident:', error);
    res.status(500).json({ error: 'Failed to archive resident' });
  }
};

exports.toggleStatus = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const residentId = req.params.id;
    const { status, is_active } = req.body; // status for residents table, is_active for users table

    if (status) {
      await connection.execute(
        `
            UPDATE residents SET Residency_Status = ?, updated_at = NOW() WHERE Resident_ID = ?
        `,
        [status, residentId]
      );
    }

    if (is_active !== undefined) {
      // Find linked user
      await connection.execute(
        `
            UPDATE users SET is_active = ?, updated_at = NOW() WHERE resident_id = ?
        `,
        [is_active, residentId]
      );
    }

    await connection.commit();
    res.json({ message: 'Resident status updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating resident status:', error);
    res.status(500).json({ error: 'Failed to update resident status' });
  } finally {
    connection.release();
  }
};

/**
 * Generate QR code for a resident
 * POST /api/residents/:id/generate-qr
 *
 * @param {string} id - Resident ID
 * @returns {Object} - JSON with qr_code string and message
 */
exports.generateQR = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const residentId = req.params.id;
  console.log(`[QR Generation] Request received for resident: ${residentId}`);

  try {
    const qrString = `BARANGAY-ID-${residentId}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const [result] = await db.execute(
      'UPDATE residents SET QR_Hash_String = ? WHERE Resident_ID = ?',
      [qrString, residentId]
    );

    if (result.affectedRows === 0) {
      console.warn(`[QR Generation] Resident not found: ${residentId}`);
      return res.status(404).json({ error: 'Resident not found' });
    }

    console.log(`[QR Generation] Success for resident: ${residentId}`);
    res.json({ qr_code: qrString, message: 'QR code generated successfully' });
  } catch (error) {
    console.error(`[QR Generation] Error for resident ${residentId}:`, error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

exports.getHouseholdMembers = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const [members] = await db.execute(
      `
      SELECT r.*, v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent,
        v.Is_Out_of_School_Youth, v.Vulnerability_Score
      FROM residents r
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Household_ID = ?
      ORDER BY CASE r.Relation_to_Head WHEN 'Head' THEN 1 WHEN 'Spouse' THEN 2 ELSE 3 END, r.Birthdate
    `,
      [req.params.id]
    );

    const [household] = await db.execute(
      `
      SELECT h.*, s.name as sitio_name
      FROM households h
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE h.Household_ID = ?
    `,
      [req.params.id]
    );

    if (household.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json({ household: household[0], members: members });
  } catch (error) {
    console.error('Error fetching household members:', error);
    res.status(500).json({ error: 'Failed to fetch household members' });
  }
};

exports.openRegister = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      first_name,
      middle_name,
      last_name,
      suffix,
      birthdate,
      birth_place,
      gender,
      civil_status,
      occupation,
      income_estimate,
      email,
      mobile_number,
      street_address,
      sitio,
      voter_status,
      is_4ps,
      is_pwd,
      is_solo_parent,
      is_out_of_school_youth,
      disability_type,
    } = req.body || {};

    if (!first_name || !last_name || !birthdate || !email || !street_address || !sitio) {
      return res.status(400).json({
        error: 'Required fields: first_name, last_name, birthdate, email, street_address, sitio',
      });
    }

    if (!req.body.government_id_uploaded) {
      // return res.status(400).json({ error: 'Government ID confirmation is required' });
      // Relaxed check if files are present in req.files
    }

    // Check for existing email
    const [existingUser] = await connection.execute('SELECT email FROM users WHERE email = ?', [
      email.trim(),
    ]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email address already registered' });
    }

    const applicationId = `APP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create pending registration record
    await connection.execute(
      `
      INSERT INTO resident_applications (
        application_id, first_name, middle_name, last_name, suffix, birthdate, birth_place, gender,
        civil_status, occupation, income_estimate, email, mobile_number, street_address,
        sitio, voter_status, is_4ps, is_pwd, is_solo_parent, is_out_of_school_youth,
        disability_type, status, temp_password, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())
    `,
      [
        applicationId,
        first_name.trim(),
        middle_name?.trim(),
        last_name.trim(),
        suffix?.trim(),
        birthdate,
        birth_place?.trim() || null,
        gender,
        civil_status || 'Single',
        occupation?.trim(),
        income_estimate || 0,
        email.trim(),
        mobile_number?.trim(),
        street_address.trim(),
        sitio.trim(),
        voter_status || 'Non-Registered',
        is_4ps || false,
        is_pwd || false,
        is_solo_parent || false,
        is_out_of_school_youth || false,
        disability_type?.trim(),
        hashedPassword,
      ]
    );

    // Handle document uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Extract document type from fieldname (e.g., "document_valid_id" -> "valid_id")
        const docType = file.fieldname.replace('document_', '');

        let storedPath = file.path;
        let encryptionMeta = {
          encryption_alg: null,
          encryption_version: null,
          encryption_iv: null,
          encryption_tag: null,
        };
        if (isEncryptionEnabled()) {
          const encrypted = await encryptFileToEncryptedPath(file.path);
          storedPath = encrypted.outputPath;
          encryptionMeta = encrypted;
        }

        await connection.execute(
          `
          INSERT INTO application_documents (
            application_id, document_type, file_path, file_name, verification_status, created_at,
            encryption_alg, encryption_version, encryption_iv, encryption_tag
          ) VALUES (?, ?, ?, ?, 'pending', NOW(), ?, ?, ?, ?)
        `,
          [
            applicationId,
            docType,
            storedPath,
            file.originalname,
            encryptionMeta.encryption_alg,
            encryptionMeta.encryption_version,
            encryptionMeta.encryption_iv,
            encryptionMeta.encryption_tag,
          ]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      application_id: applicationId,
      message:
        'Registration application submitted successfully. You will receive an email notification once verified.',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error processing open registration:', error);
    res.status(500).json({ error: 'Failed to process registration application' });
  } finally {
    connection.release();
  }
};

exports.uploadVerificationDocs = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let targetTable = 'resident_documents';
    let targetIdColumn = 'resident_id';
    let targetId = req.user.resident_id;

    // If no resident_id, check for application
    if (!targetId) {
      const [apps] = await connection.execute(
        'SELECT application_id FROM resident_applications WHERE email = ? ORDER BY created_at DESC LIMIT 1',
        [req.user.email]
      );

      if (apps.length > 0) {
        targetTable = 'application_documents';
        targetIdColumn = 'application_id';
        targetId = apps[0].application_id;
      } else {
        // Fallback or Error?
        // If neither resident nor applicant, we can't attach documents.
        // But we used req.user.id before. Let's see if we should fallback to that?
        // No, req.user.id is Int, resident_id is UUID.
        return res
          .status(400)
          .json({ error: 'No active resident profile or pending application found.' });
      }
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    for (const file of req.files) {
      const docType = file.fieldname.replace('document_', '');
      let storedPath = file.path;
      let encryptionMeta = {
        encryption_alg: null,
        encryption_version: null,
        encryption_iv: null,
        encryption_tag: null,
      };
      if (isEncryptionEnabled()) {
        const encrypted = await encryptFileToEncryptedPath(file.path);
        storedPath = encrypted.outputPath;
        encryptionMeta = encrypted;
      }

      await connection.execute(
        `
            INSERT INTO ${targetTable} (
            ${targetIdColumn}, document_type, file_path, file_name, verification_status, created_at,
            encryption_alg, encryption_version, encryption_iv, encryption_tag
            ) VALUES (?, ?, ?, ?, 'pending', NOW(), ?, ?, ?, ?)
        `,
        [
          targetId,
          docType,
          storedPath,
          file.originalname,
          encryptionMeta.encryption_alg,
          encryptionMeta.encryption_version,
          encryptionMeta.encryption_iv,
          encryptionMeta.encryption_tag,
        ]
      );

      // CLEARPASS: If this is a vulnerability-related document, mark the vulnerability status as pending
      // This ensures the resident appears in the Secretary's Beneficiary Validation list
      const vulnerabilityDocs = [
        '4ps',
        '4ps_id',
        'pwd',
        'pwd_id',
        'solo_parent',
        'solo_parent_id',
        'osy',
        'osy_id',
        'senior',
        'senior_id',
      ];
      if (targetTable === 'resident_documents' && vulnerabilityDocs.includes(docType)) {
        await connection.execute(
          `UPDATE vulnerabilities SET validation_status = 'pending', updated_at = NOW() WHERE Resident_ID = ?`,
          [targetId]
        );
      }
    }

    await connection.commit();
    res.json({ message: 'Documents uploaded successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error uploading documents:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  } finally {
    connection.release();
  }
};

exports.listDocuments = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    let targetTable = 'resident_documents';
    let targetIdColumn = 'resident_id';
    let targetId = req.params.id || req.user.resident_id;

    // Check permissions
    // If user is a resident/guest, they can only see their own docs
    if (req.user.role === ROLES.RESIDENT || req.user.role === ROLES.GUEST || req.user.role === 13) {
      // If resident_id is null, it means they are a guest (pending applicant)
      if (!req.user.resident_id) {
        const [apps] = await db.execute(
          'SELECT application_id FROM resident_applications WHERE email = ? ORDER BY created_at DESC LIMIT 1',
          [req.user.email]
        );

        if (apps.length > 0) {
          targetTable = 'application_documents';
          targetIdColumn = 'application_id';
          targetId = apps[0].application_id;
        } else {
          // No application found
          return res.json([]);
        }
      } else {
        // Normal resident
        targetId = req.user.resident_id;
      }
    }

    const [rows] = await db.execute(
      `
      SELECT id, ${targetIdColumn} as resident_id, document_type, file_name, verification_status, verification_notes, created_at, updated_at
      FROM ${targetTable}
      WHERE ${targetIdColumn} = ?
      ORDER BY created_at DESC
      `,
      [targetId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching resident documents:', error);
    res.status(500).json({ error: 'Failed to fetch resident documents' });
  }
};

exports.downloadDocument = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const residentId = String(req.params.id || '');
    const docId = Number.parseInt(req.params.docId, 10);
    if (!Number.isFinite(docId)) {
      return res.status(400).json({ error: 'Invalid document id' });
    }

    const effectiveResidentId = String(req.user.resident_id || req.user.id || '');
    if (req.user.role === ROLES.RESIDENT && residentId !== effectiveResidentId) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    const [rows] = await db.execute(
      `
      SELECT resident_id, file_path, file_name, encryption_alg, encryption_iv, encryption_tag
      FROM resident_documents
      WHERE id = ? AND resident_id = ?
      LIMIT 1
      `,
      [docId, residentId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const absolutePath = resolveAndValidateUploadedDocumentPath(rows[0].file_path);
    if (!absolutePath) {
      return res.status(400).json({ error: 'Invalid document path' });
    }

    const auditDetails = {
      user_id: req.user?.id || null,
      user_role: req.user?.role || null,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      resource: req.originalUrl,
      action: req.method,
      result: 'SUCCESS',
      additional_details: {
        resident_id: residentId,
        document_id: docId,
      },
      session_id: req.sessionID,
    };

    res.once('finish', () => {
      if (res.statusCode >= 400) return;
      const eventType = AUDIT_EVENTS.RESIDENT_DOCUMENT_DOWNLOADED;
      logAuditEvent(eventType, auditDetails);
      const auditDb = req.app?.locals?.db || db;
      if (auditDb && typeof auditDb.execute === 'function') {
        logAuditToDatabase(auditDb, eventType, auditDetails);
      }
    });

    return sendStoredDocument(res, absolutePath, {
      file_name: rows[0].file_name,
      encryption_alg: rows[0].encryption_alg,
      encryption_iv: rows[0].encryption_iv,
      encryption_tag: rows[0].encryption_tag,
    });
  } catch (error) {
    console.error('Error downloading resident document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

exports.getBlotterHistory = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const residentId = req.params.id;
    const effectiveResidentId = String(req.user.resident_id || req.user.id || '');

    // Residents can view their own history. Officials can view anyone's.
    if (req.user.role === ROLES.RESIDENT && residentId !== effectiveResidentId) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    const [rows] = await db.execute(
      `
      SELECT b.*
      FROM blotter b
      WHERE b.complainant_resident_id = ? 
         OR b.respondent_resident_id = ? 
         OR b.respondent_id = ?
      ORDER BY b.DateTime_Incident DESC
    `,
      [residentId, residentId, residentId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching resident blotter history:', error);
    res.status(500).json({ error: 'Failed to fetch resident blotter history' });
  }
};

exports.exportResidents = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const { format = 'json' } = req.query;

    // Fetch all residents (or filtered set if needed, but exports usually full dump or filtered)
    // Reusing the query logic from getAll would be ideal, but for simplicity let's do a clean fetch
    const [rows] = await db.execute(`
      SELECT r.Resident_ID, r.First_Name, r.Last_Name, r.Middle_Name, r.Birthdate, r.Age,
             r.Gender, r.Civil_Status, r.Occupation, r.Mobile_Number, r.Email,
             h.Household_Number, s.name as Sitio, r.Residency_Status
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      ORDER BY r.Last_Name, r.First_Name
    `);

    if (format === 'json') {
      res.header('Content-Type', 'application/json');
      res.attachment('residents_export.json');
      return res.send(JSON.stringify(rows, null, 2));
    }

    if (format === 'csv' || format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Residents');

      if (rows.length > 0) {
        worksheet.columns = Object.keys(rows[0]).map(key => ({ header: key, key }));
        worksheet.addRows(rows);
      }

      if (format === 'csv') {
        res.header('Content-Type', 'text/csv');
        res.attachment('residents_export.csv');
        await workbook.csv.write(res);
        return;
      }

      if (format === 'xlsx') {
        res.header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.attachment('residents_export.xlsx');
        await workbook.xlsx.write(res);
        return;
      }
    }

    res.status(400).json({ error: 'Invalid export format. Supported: json, csv, xlsx' });
  } catch (error) {
    console.error('Error exporting residents:', error);
    res.status(500).json({ error: 'Failed to export residents' });
  }
};

exports.importResidents = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1); // Get first sheet

    const data = [];
    if (worksheet) {
      // Get headers from first row
      const headers = [];
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.text; // Store header by column index
      });

      // Iterate rows starting from 2
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            // Basic value extraction, might need more robust type handling depending on ExcelJS version
            rowData[header] = cell.value;
            // Handle rich text or formulas if necessary, but .value is usually sufficient for simple imports
            if (typeof cell.value === 'object' && cell.value !== null) {
              if (cell.value.text)
                rowData[header] = cell.value.text; // Hyperlink or RichText
              else if (cell.value.result) rowData[header] = cell.value.result; // Formula
            }
          }
        });
        // Only add if row has data
        if (Object.keys(rowData).length > 0) {
          data.push(rowData);
        }
      });
    }

    if (!data || data.length === 0) {
      fs.unlinkSync(req.file.path); // Clean up
      return res.status(400).json({ error: 'File is empty or invalid' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const [index, row] of data.entries()) {
      try {
        // Basic Validation
        if (!row.first_name || !row.last_name || !row.birthdate || !row.household_id) {
          throw new Error(
            'Missing required fields: first_name, last_name, birthdate, household_id'
          );
        }

        // Generate IDs
        const residentId = `RES-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${index}`;
        const qrHash = crypto
          .createHash('sha256')
          .update(`${residentId}-${Date.now()}`)
          .digest('hex')
          .substring(0, 16)
          .toUpperCase();

        // Generate User Account
        const email = row.email || `resident_${residentId}@clearpass.local`;
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const age = calculateAge(row.birthdate);

        // Insert Resident
        await connection.execute(
          `INSERT INTO residents (
            Resident_ID, Household_ID, Relation_to_Head, First_Name, Middle_Name, Last_Name, Suffix,
            Birthdate, Age, Gender, Civil_Status, Occupation, Income_Estimate, Email, Mobile_Number,
            Voter_Status, Date_Arrival, Residency_Status, QR_Hash_String
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)`,
          [
            residentId,
            row.household_id,
            row.relation_to_head || 'Head',
            row.first_name,
            row.middle_name || null,
            row.last_name,
            row.suffix || null,
            row.birthdate,
            age,
            row.gender || 'Unknown',
            row.civil_status || 'Single',
            row.occupation || null,
            row.income_estimate || 0,
            email,
            row.mobile_number || null,
            row.voter_status || 'Non-Registered',
            row.date_arrival || new Date(),
            qrHash,
          ]
        );

        // Insert Vulnerabilities
        await connection.execute(
          `INSERT INTO vulnerabilities (
            Resident_ID, Is_4Ps, Is_PWD, Is_Solo_Parent, Is_Out_of_School_Youth, Disability_Type
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            residentId,
            row.is_4ps ? 1 : 0,
            row.is_pwd ? 1 : 0,
            row.is_solo_parent ? 1 : 0,
            row.is_out_of_school_youth ? 1 : 0,
            row.disability_type || null,
          ]
        );

        // Insert User
        await connection.execute(
          `INSERT INTO users (username, email, password_hash, role, resident_id, is_active)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [email, email, hashedPassword, ROLES.RESIDENT || 12, residentId]
        );

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${index + 1}: ${err.message}`);
      }
    }

    await connection.commit();
    fs.unlinkSync(req.file.path); // Clean up

    res.json({
      message: 'Bulk import completed',
      results,
    });
  } catch (error) {
    await connection.rollback();
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Error importing residents:', error);
    res.status(500).json({ error: 'Failed to import residents' });
  } finally {
    connection.release();
  }
};

// Export upload middleware
exports.uploadMiddleware = uploadMiddleware;
