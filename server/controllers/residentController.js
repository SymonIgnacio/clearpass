const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { ROLES } = require('../config/roles');
const uploadMiddleware = require('../middleware/upload').any();
const {
  isEncryptionEnabled,
  encryptFileToEncryptedPath,
  resolveAndValidateUploadedDocumentPath,
  sendStoredDocument
} = require('../utils/documentStorage');
const { logAuditEvent, logAuditToDatabase, AUDIT_EVENTS } = require('../middleware/auditLogger');

const calculateAge = (birthdate) => {
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
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const { page = 1, limit = 50, search, sitio_id, residency_status, show_vulnerable } = req.query || {};
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];
    let values = [];

    if (search && search.trim()) {
      whereConditions.push('(r.First_Name LIKE ? OR r.Last_Name LIKE ? OR r.Mobile_Number LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }

    if (sitio_id) {
      whereConditions.push('h.Sitio_ID = ?');
      values.push(sitio_id);
    }

    if (residency_status) {
      whereConditions.push('r.Residency_Status = ?');
      values.push(residency_status);
    }

    if (show_vulnerable === 'true') {
      whereConditions.push('v.Vulnerability_Score > 0');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const mainQuery = `
      SELECT r.*, h.Household_Number, h.Street_Address, s.name as sitio_name,
        v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent, v.Is_Out_of_School_Youth,
        v.Vulnerability_Score, v.Disability_Type
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      ${whereClause}
      ORDER BY r.Last_Name, r.First_Name
      LIMIT ? OFFSET ?
    `;

    const mainParams = [...values, parseInt(limit), parseInt(offset)];
    const [rows] = await db.execute(mainQuery, mainParams);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      ${whereClause}
    `;

    const [totalRows] = await db.execute(countQuery, values);

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRows[0].total,
        pages: Math.ceil(totalRows[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
};

exports.getById = async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const [rows] = await db.execute(`
      SELECT r.*, h.Household_Number, h.Street_Address, h.Household_Type, s.name as sitio_name,
        v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent, v.Is_Out_of_School_Youth,
        v.Vulnerability_Score, v.Disability_Type
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Resident_ID = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching resident:', error);
    res.status(500).json({ error: 'Failed to fetch resident' });
  }
};

exports.checkDuplicate = async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const { first_name, last_name, birthdate } = req.body || {};

    if (!first_name || !last_name || !birthdate) {
      return res.status(400).json({ error: 'First name, last name, and birthdate are required' });
    }

    const [duplicates] = await db.execute(`
      SELECT r.Resident_ID, r.First_Name, r.Last_Name, r.Birthdate, r.Residency_Status,
        h.Household_Number, s.name as sitio_name
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE r.First_Name = ? AND r.Last_Name = ? AND r.Birthdate = ?
      AND r.Residency_Status = 'Active'
    `, [first_name.trim(), last_name.trim(), birthdate]);

    res.json({
      is_duplicate: duplicates.length > 0,
      duplicates: duplicates,
      message: duplicates.length > 0 ?
        'Possible duplicate found. Please verify if this is the same person.' :
        'No duplicates found. Safe to proceed.'
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({ error: 'Failed to check for duplicates' });
  }
};

exports.create = async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      household_id, relation_to_head, first_name, middle_name, last_name, suffix,
      birthdate, gender, civil_status, occupation, income_estimate, email, mobile_number,
      voter_status, date_arrival, profile_photo_url,
      is_4ps, is_pwd, is_solo_parent, is_out_of_school_youth, disability_type
    } = req.body || {};

    if (!first_name || !last_name || !birthdate || !household_id || !email) {
      return res.status(400).json({ error: 'Required fields: first_name, last_name, birthdate, household_id, email' });
    }

    const [householdCheck] = await connection.execute(
      'SELECT Household_ID FROM households WHERE Household_ID = ?',
      [household_id]
    );
    if (householdCheck.length === 0) {
      return res.status(400).json({ error: 'Invalid household_id - household does not exist' });
    }

    const residentId = `RES-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const qrHash = crypto.createHash('sha256')
      .update(`${residentId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`)
      .digest('hex').substring(0, 16).toUpperCase();

    // Generate temporary password for resident login
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const age = calculateAge(birthdate);

    await connection.execute(`
      INSERT INTO residents (
        Resident_ID, Household_ID, Relation_to_Head, First_Name, Middle_Name, Last_Name, Suffix,
        Birthdate, Age, Gender, Civil_Status, Occupation, Income_Estimate, Email, Mobile_Number,
        Voter_Status, Date_Arrival, Residency_Status, Profile_Photo_URL, QR_Hash_String
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      residentId, household_id, relation_to_head || 'Head', first_name.trim(), middle_name?.trim(),
      last_name.trim(), suffix?.trim(), birthdate, age, gender, civil_status || 'Single',
      occupation?.trim(), income_estimate || 0, email.trim(), mobile_number?.trim(),
      voter_status || 'Non-Registered', date_arrival, 'Active',
      profile_photo_url?.trim(), qrHash
    ]);

    // Create user account for resident
    await connection.execute(`
      INSERT INTO users (username, email, password_hash, role, resident_id, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [email.trim(), email.trim(), hashedPassword, ROLES.RESIDENT || 12, residentId]);

    await connection.execute(`
      INSERT INTO vulnerabilities (
        Resident_ID, Is_4Ps, Is_PWD, Is_Solo_Parent, Is_Out_of_School_Youth, Disability_Type
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [residentId, is_4ps || false, is_pwd || false, is_solo_parent || false,
        is_out_of_school_youth || false, disability_type?.trim()]);

    // Handle document uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Extract document type from fieldname (e.g., "document_valid_id" -> "valid_id")
        const docType = file.fieldname.replace('document_', '');

        let storedPath = file.path;
        let encryptionMeta = { encryption_alg: null, encryption_version: null, encryption_iv: null, encryption_tag: null };
        if (isEncryptionEnabled()) {
          const encrypted = await encryptFileToEncryptedPath(file.path);
          storedPath = encrypted.outputPath;
          encryptionMeta = encrypted;
        }

        await connection.execute(
          `
          INSERT INTO resident_documents (
            resident_id, document_type, file_path, file_name, verification_status, created_at,
            encryption_alg, encryption_version, encryption_iv, encryption_tag
          ) VALUES (?, ?, ?, ?, 'pending', NOW(), ?, ?, ?, ?)
        `,
          [
            residentId,
            docType,
            storedPath,
            file.originalname,
            encryptionMeta.encryption_alg,
            encryptionMeta.encryption_version,
            encryptionMeta.encryption_iv,
            encryptionMeta.encryption_tag
          ]
        );
      }
    }

    await connection.execute(`
      UPDATE households SET Total_Members = Total_Members + 1 WHERE Household_ID = ?
    `, [household_id]);

    await connection.commit();

    res.status(201).json({
      resident_code: residentId,
      user_email: email.trim(),
      temp_password: tempPassword,
      qr_hash: qrHash,
      message: 'Resident created successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating resident:', error);
    res.status(500).json({ error: 'Failed to create resident' });
  } finally {
    connection.release();
  }
};

exports.update = async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const residentId = req.params.id;
    const {
      household_id, relation_to_head, first_name, middle_name, last_name, suffix,
      birthdate, gender, civil_status, occupation, income_estimate, mobile_number,
      voter_status, date_arrival, residency_status, profile_photo_url,
      is_4ps, is_pwd, is_solo_parent, is_out_of_school_youth, disability_type
    } = req.body || {};

    const residentUpdates = [];
    const residentValues = [];

    if (household_id !== undefined) { residentUpdates.push('Household_ID = ?'); residentValues.push(household_id); }
    if (relation_to_head !== undefined) { residentUpdates.push('Relation_to_Head = ?'); residentValues.push(relation_to_head); }
    if (first_name !== undefined) { residentUpdates.push('First_Name = ?'); residentValues.push(first_name.trim()); }
    if (middle_name !== undefined) { residentUpdates.push('Middle_Name = ?'); residentValues.push(middle_name?.trim()); }
    if (last_name !== undefined) { residentUpdates.push('Last_Name = ?'); residentValues.push(last_name.trim()); }
    if (suffix !== undefined) { residentUpdates.push('Suffix = ?'); residentValues.push(suffix?.trim()); }
    if (birthdate !== undefined) { 
      residentUpdates.push('Birthdate = ?'); 
      residentValues.push(birthdate);
      const age = calculateAge(birthdate);
      residentUpdates.push('Age = ?');
      residentValues.push(age);
    }
    if (gender !== undefined) { residentUpdates.push('Gender = ?'); residentValues.push(gender); }
    if (civil_status !== undefined) { residentUpdates.push('Civil_Status = ?'); residentValues.push(civil_status); }
    if (occupation !== undefined) { residentUpdates.push('Occupation = ?'); residentValues.push(occupation?.trim()); }
    if (income_estimate !== undefined) { residentUpdates.push('Income_Estimate = ?'); residentValues.push(income_estimate); }
    if (mobile_number !== undefined) { residentUpdates.push('Mobile_Number = ?'); residentValues.push(mobile_number?.trim()); }
    if (voter_status !== undefined) { residentUpdates.push('Voter_Status = ?'); residentValues.push(voter_status); }
    if (date_arrival !== undefined) { residentUpdates.push('Date_Arrival = ?'); residentValues.push(date_arrival); }
    if (residency_status !== undefined) { residentUpdates.push('Residency_Status = ?'); residentValues.push(residency_status); }
    if (profile_photo_url !== undefined) { residentUpdates.push('Profile_Photo_URL = ?'); residentValues.push(profile_photo_url?.trim()); }

    if (residentUpdates.length > 0) {
      const residentSql = `UPDATE residents SET ${residentUpdates.join(', ')} WHERE Resident_ID = ?`;
      residentValues.push(residentId);
      await connection.execute(residentSql, residentValues);
    }

    const vulnUpdates = [];
    const vulnValues = [];

    if (is_4ps !== undefined) { vulnUpdates.push('Is_4Ps = ?'); vulnValues.push(is_4ps); }
    if (is_pwd !== undefined) { vulnUpdates.push('Is_PWD = ?'); vulnValues.push(is_pwd); }
    if (is_solo_parent !== undefined) { vulnUpdates.push('Is_Solo_Parent = ?'); vulnValues.push(is_solo_parent); }
    if (is_out_of_school_youth !== undefined) { vulnUpdates.push('Is_Out_of_School_Youth = ?'); vulnValues.push(is_out_of_school_youth); }
    if (disability_type !== undefined) { vulnUpdates.push('Disability_Type = ?'); vulnValues.push(disability_type?.trim()); }

    if (vulnUpdates.length > 0) {
      const vulnSql = `UPDATE vulnerabilities SET ${vulnUpdates.join(', ')} WHERE Resident_ID = ?`;
      vulnValues.push(residentId);
      await connection.execute(vulnSql, vulnValues);
    }

    // Handle document uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Extract document type from fieldname (e.g., "document_valid_id" -> "valid_id")
        const docType = file.fieldname.replace('document_', '');

        let storedPath = file.path;
        let encryptionMeta = { encryption_alg: null, encryption_version: null, encryption_iv: null, encryption_tag: null };
        if (isEncryptionEnabled()) {
          const encrypted = await encryptFileToEncryptedPath(file.path);
          storedPath = encrypted.outputPath;
          encryptionMeta = encrypted;
        }

        await connection.execute(
          `
          INSERT INTO resident_documents (
            resident_id, document_type, file_path, file_name, verification_status, created_at,
            encryption_alg, encryption_version, encryption_iv, encryption_tag
          ) VALUES (?, ?, ?, ?, 'pending', NOW(), ?, ?, ?, ?)
        `,
          [
            residentId,
            docType,
            storedPath,
            file.originalname,
            encryptionMeta.encryption_alg,
            encryptionMeta.encryption_version,
            encryptionMeta.encryption_iv,
            encryptionMeta.encryption_tag
          ]
        );
      }
    }

    await connection.commit();
    res.json({ message: 'Resident updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating resident:', error);
    res.status(500).json({ error: 'Failed to update resident' });
  } finally {
    connection.release();
  }
};

exports.archive = async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const residentId = req.params.id;

    await connection.execute(`
      UPDATE residents SET Residency_Status = 'Transferred Out', updated_at = CURRENT_TIMESTAMP
      WHERE Resident_ID = ?
    `, [residentId]);

    await connection.execute(`
      UPDATE households SET Total_Members = Total_Members - 1
      WHERE Household_ID = (SELECT Household_ID FROM residents WHERE Resident_ID = ?)
    `, [residentId]);

    await connection.commit();
    res.json({ message: 'Resident archived successfully', status: 'Transferred Out' });
  } catch (error) {
    await connection.rollback();
    console.error('Error archiving resident:', error);
    res.status(500).json({ error: 'Failed to archive resident' });
  } finally {
    connection.release();
  }
};

exports.toggleStatus = async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const residentId = req.params.id;
    const { status, is_active } = req.body; // status for residents table, is_active for users table

    if (status) {
        await connection.execute(`
            UPDATE residents SET Residency_Status = ?, updated_at = NOW() WHERE Resident_ID = ?
        `, [status, residentId]);
    }

    if (is_active !== undefined) {
        // Find linked user
        await connection.execute(`
            UPDATE users SET is_active = ?, updated_at = NOW() WHERE resident_id = ?
        `, [is_active, residentId]);
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
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const [members] = await db.execute(`
      SELECT r.*, v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent,
        v.Is_Out_of_School_Youth, v.Vulnerability_Score
      FROM residents r
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Household_ID = ?
      ORDER BY CASE r.Relation_to_Head WHEN 'Head' THEN 1 WHEN 'Spouse' THEN 2 ELSE 3 END, r.Birthdate
    `, [req.params.id]);

    const [household] = await db.execute(`
      SELECT h.*, s.name as sitio_name
      FROM households h
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE h.Household_ID = ?
    `, [req.params.id]);

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
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      first_name, middle_name, last_name, suffix, birthdate, gender, civil_status,
      occupation, income_estimate, email, mobile_number, street_address, sitio,
      voter_status, is_4ps, is_pwd, is_solo_parent, is_out_of_school_youth, disability_type
    } = req.body || {};

    if (!first_name || !last_name || !birthdate || !email || !street_address || !sitio) {
      return res.status(400).json({ error: 'Required fields: first_name, last_name, birthdate, email, street_address, sitio' });
    }

    if (!req.body.government_id_uploaded) {
      // return res.status(400).json({ error: 'Government ID confirmation is required' });
      // Relaxed check if files are present in req.files
    }

    // Check for existing email
    const [existingUser] = await connection.execute(
      'SELECT email FROM users WHERE email = ?',
      [email.trim()]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email address already registered' });
    }

    const applicationId = `APP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create pending registration record
    await connection.execute(`
      INSERT INTO resident_applications (
        application_id, first_name, middle_name, last_name, suffix, birthdate, gender,
        civil_status, occupation, income_estimate, email, mobile_number, street_address,
        sitio, voter_status, is_4ps, is_pwd, is_solo_parent, is_out_of_school_youth,
        disability_type, status, temp_password, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())
    `, [
      applicationId, first_name.trim(), middle_name?.trim(), last_name.trim(), suffix?.trim(),
      birthdate, gender, civil_status || 'Single', occupation?.trim(), income_estimate || 0,
      email.trim(), mobile_number?.trim(), street_address.trim(), sitio.trim(),
      voter_status || 'Non-Registered', is_4ps || false, is_pwd || false,
      is_solo_parent || false, is_out_of_school_youth || false, disability_type?.trim(),
      hashedPassword
    ]);

    // Handle document uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Extract document type from fieldname (e.g., "document_valid_id" -> "valid_id")
        const docType = file.fieldname.replace('document_', '');

        let storedPath = file.path;
        let encryptionMeta = { encryption_alg: null, encryption_version: null, encryption_iv: null, encryption_tag: null };
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
            encryptionMeta.encryption_tag
          ]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      application_id: applicationId,
      message: 'Registration application submitted successfully. You will receive an email notification once verified.'
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
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const residentId = req.user.resident_id || req.user.id; // Assuming user is linked

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    for (const file of req.files) {
        const docType = file.fieldname.replace('document_', '');
        let storedPath = file.path;
        let encryptionMeta = { encryption_alg: null, encryption_version: null, encryption_iv: null, encryption_tag: null };
        if (isEncryptionEnabled()) {
            const encrypted = await encryptFileToEncryptedPath(file.path);
            storedPath = encrypted.outputPath;
            encryptionMeta = encrypted;
        }

        await connection.execute(
            `
            INSERT INTO resident_documents (
            resident_id, document_type, file_path, file_name, verification_status, created_at,
            encryption_alg, encryption_version, encryption_iv, encryption_tag
            ) VALUES (?, ?, ?, ?, 'pending', NOW(), ?, ?, ?, ?)
        `,
            [
              residentId,
              docType,
              storedPath,
              file.originalname,
              encryptionMeta.encryption_alg,
              encryptionMeta.encryption_version,
              encryptionMeta.encryption_iv,
              encryptionMeta.encryption_tag
            ]
        );
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
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  try {
    const residentId = String(req.params.id || '');
    const effectiveResidentId = String(req.user.resident_id || req.user.id || '');
    if (req.user.role === ROLES.RESIDENT && residentId !== effectiveResidentId) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    const [rows] = await db.execute(
      `
      SELECT id, resident_id, document_type, file_name, verification_status, created_at, updated_at
      FROM resident_documents
      WHERE resident_id = ?
      ORDER BY created_at DESC
      `,
      [residentId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching resident documents:', error);
    res.status(500).json({ error: 'Failed to fetch resident documents' });
  }
};

exports.downloadDocument = async (req, res) => {
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
        document_id: docId
      },
      session_id: req.sessionID
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
      encryption_tag: rows[0].encryption_tag
    });
  } catch (error) {
    console.error('Error downloading resident document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

exports.getBlotterHistory = async (req, res) => {
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

    const [rows] = await db.execute(`
      SELECT b.*
      FROM blotter b
      WHERE b.complainant_resident_id = ? 
         OR b.respondent_resident_id = ? 
         OR b.respondent_id = ?
      ORDER BY b.DateTime_Incident DESC
    `, [residentId, residentId, residentId]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching resident blotter history:', error);
    res.status(500).json({ error: 'Failed to fetch resident blotter history' });
  }
};

// Export upload middleware
exports.uploadMiddleware = uploadMiddleware;
