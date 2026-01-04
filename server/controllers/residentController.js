const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);

// REMEDIATION: Implement QR-Based Clearance Request with Logic Gate
exports.requestClearance = async (req, res) => {
    const residentId = req.user.resident_id; // Extracted from Token
    const { clearanceType, purpose } = req.body;

    try {
        // STEP 1: SELF-CHECK CLEARPASS LOGIC GATE
        // We check this BEFORE creating the request to give instant feedback
        const activeCases = await knex('blotter')
            .where({ respondent_id: residentId })
            .whereIn('status', ['Active', 'Pending'])
            .count('id as count')
            .first();

        if (activeCases.count > 0) {
            return res.status(403).json({
                error: "CLEARPASS BLOCKED: You have active accountabilities. Please visit the Barangay Hall."
            });
        }

        // STEP 2: GENERATE REQUEST
        const requestId = `REQ-${Date.now()}`;
        await knex('certificates_log').insert({
            control_no: requestId,
            resident_id: residentId,
            certificate_type: clearanceType,
            purpose: purpose,
            status: 'Pending',
            processed_by: 0 // System generated
        });

        // STEP 3: GENERATE QR CODE
        const QRCode = require('qrcode');
        const qrData = JSON.stringify({
            request_id: requestId,
            resident_id: residentId,
            clearance_type: clearanceType,
            timestamp: Date.now(),
            type: 'clearance_request'
        });

        const qrCodeDataURL = await QRCode.toDataURL(qrData);

        res.status(201).json({
            message: "Request Submitted Successfully",
            request_id: requestId,
            status: "Pending",
            qr_code: qrCodeDataURL
        });

    } catch (error) {
        console.error("Resident Request Error:", error);
        res.status(500).json({ error: "System Error processing request" });
    }
};

exports.getMyRequests = async (req, res) => {
    const residentId = req.user.resident_id;
    try {
        const requests = await knex('certificates_log')
            .where({ resident_id: residentId })
            .orderBy('date_issued', 'desc');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
};

exports.getDashboardStats = async (req, res) => {
    const residentId = req.user.resident_id;
    try {
        // Get resident profile
        const profile = await knex('residents').where({ Resident_ID: residentId }).first();
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        // Check for active blotter cases (THEMIS ClearPass logic)
        const activeCases = await knex('blotter')
            .where({ respondent_id: residentId })
            .whereIn('status', ['Active', 'Pending'])
            .count('id as count')
            .first();

        // Determine status
        const hasActiveCase = activeCases.count > 0;
        const status = hasActiveCase ? 'BLOCKED' : 'CLEARED';

        // Get blocking case details if blocked
        let blockingCase = null;
        if (hasActiveCase) {
            const caseDetails = await knex('blotter')
                .where({ respondent_id: residentId })
                .whereIn('status', ['Active', 'Pending'])
                .select('case_number', 'DateTime_Incident', 'complaint')
                .orderBy('DateTime_Incident', 'desc')
                .first();

            if (caseDetails) {
                blockingCase = `Case #${caseDetails.case_number}`;
            }
        }

        res.json({
            profile: {
                name: `${profile.First_Name} ${profile.Last_Name}`.trim(),
                photo_url: profile.photo_url || null,
                resident_id: profile.Resident_ID,
                contact_number: profile.Mobile_Number,
                email: profile.Email
            },
            status: status,
            blocking_case: blockingCase
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ error: "Database error" });
    }
};

exports.updateProfilePhoto = async (req, res) => {
    const residentId = req.user.resident_id;
    try {
        // Check if photo update is allowed (6 month rule)
        const profile = await knex('residents').where({ Resident_ID: residentId }).first();
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        const lastUpdate = profile.last_updated ? new Date(profile.last_updated) : new Date(2000, 0, 1);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        if (lastUpdate >= sixMonthsAgo) {
            return res.status(403).json({
                error: "Photo update not allowed. You can only update your photo once every 6 months."
            });
        }

        // Handle file upload
        if (!req.file) {
            return res.status(400).json({ error: "No photo file provided" });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                error: "Invalid file type. Only JPEG, PNG, and GIF images are allowed."
            });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (req.file.size > maxSize) {
            return res.status(400).json({
                error: "File too large. Maximum size is 5MB."
            });
        }

        // Generate unique filename
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        const filename = `profile_${residentId}_${Date.now()}.${fileExtension}`;
        const filepath = `uploads/profiles/${filename}`;

        // Ensure directory exists
        const fs = require('fs').promises;
        const path = require('path');
        const uploadDir = path.dirname(filepath);

        try {
            await fs.mkdir(uploadDir, { recursive: true });
            await fs.rename(req.file.path, filepath);
        } catch (fileError) {
            console.error('File operation error:', fileError);
            return res.status(500).json({ error: "Failed to save photo" });
        }

        // Update profile with new photo URL
        const photoUrl = `/uploads/profiles/${filename}`;
        await knex('residents')
            .where({ Resident_ID: residentId })
            .update({
                photo_url: photoUrl,
                last_updated: knex.fn.now()
            });

        res.json({
            message: "Profile photo updated successfully",
            photo_url: photoUrl
        });

    } catch (error) {
        console.error("Photo update error:", error);
        res.status(500).json({ error: "Database error" });
    }
};

exports.getProfile = async (req, res) => {
    const residentId = req.user.resident_id;
    try {
        const profile = await knex('residents').where({ Resident_ID: residentId }).first();
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        // Calculate if Photo Update is needed (6 month rule)
        const lastUpdate = new Date(profile.last_updated);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const photoUpdateNeeded = lastUpdate < sixMonthsAgo;

        res.json({ ...profile, photoUpdateNeeded });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
};

exports.getCensusData = async (req, res) => {
    try {
        // Get census statistics by sitio
        const statsBySitio = await knex('sitios as s')
            .leftJoin('households as h', 's.id', 'h.Sitio_ID')
            .leftJoin('residents as r', 'h.Household_ID', 'r.Household_ID')
            .leftJoin('vulnerabilities as v', 'r.Resident_ID', 'v.Resident_ID')
            .select(
                's.name as sitio_name',
                knex.raw('COUNT(r.Resident_ID) as total_residents'),
                knex.raw('SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as seniors'),
                knex.raw('SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as pwd'),
                knex.raw('SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as single_parents')
            )
            .groupBy('s.id', 's.name')
            .orderBy('s.name');

        // Get overall statistics
        const overallStats = await knex('residents as r')
            .leftJoin('vulnerabilities as v', 'r.Resident_ID', 'v.Resident_ID')
            .select(
                knex.raw('COUNT(*) as total_residents'),
                knex.raw('SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as total_seniors'),
                knex.raw('SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as total_pwd'),
                knex.raw('SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as total_single_parents')
            )
            .first();

        res.json({
            bySitio: statsBySitio,
            overall: overallStats
        });

    } catch (error) {
        console.error('Census data error:', error);
        res.status(500).json({ error: "Failed to fetch census data" });
    }
};

exports.uploadVerification = async (req, res) => {
    const residentId = req.user.resident_id;
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: "No verification file provided" });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                error: "Invalid file type. Only JPEG, PNG, GIF images and PDF files are allowed."
            });
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (req.file.size > maxSize) {
            return res.status(400).json({
                error: "File too large. Maximum size is 10MB."
            });
        }

        // Generate unique filename
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        const filename = `verification_${residentId}_${Date.now()}.${fileExtension}`;
        const filepath = `uploads/verification/${filename}`;

        // Ensure directory exists
        const fs = require('fs').promises;
        const path = require('path');
        const uploadDir = path.dirname(filepath);

        try {
            await fs.mkdir(uploadDir, { recursive: true });
            await fs.rename(req.file.path, filepath);
        } catch (fileError) {
            console.error('File operation error:', fileError);
            return res.status(500).json({ error: "Failed to save verification file" });
        }

        // Update resident record
        const verificationFileUrl = `/uploads/verification/${filename}`;
        await knex('residents')
            .where({ Resident_ID: residentId })
            .update({
                verification_file: verificationFileUrl,
                account_status: 'Pending Verification',
                updated_at: knex.fn.now()
            });

        res.json({
            message: "Verification file uploaded successfully. Your account is now under review.",
            verification_file: verificationFileUrl,
            account_status: 'Pending Verification'
        });

    } catch (error) {
        console.error("Verification upload error:", error);
        res.status(500).json({ error: "Database error" });
    }
};

exports.updateContactInfo = async (req, res) => {
    const residentId = req.user.resident_id;
    const { email, mobile_number } = req.body;

    try {
        // Create updateData object with only provided fields
        const updateData = {};
        if (email !== undefined) updateData.Email = email;
        if (mobile_number !== undefined) updateData.Mobile_Number = mobile_number;

        // Validate that updateData is not empty
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No update data provided. Please provide email or mobile_number.'
            });
        }

        // Update the residents table
        const result = await knex('residents')
            .where({ Resident_ID: residentId })
            .update({
                ...updateData,
                updated_at: knex.fn.now()
            });

        // Return success response
        res.status(200).json({
            success: true,
            message: 'Contact information updated successfully',
            records_updated: result
        });

    } catch (error) {
        console.error('Error updating contact info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update contact information',
            error: error.message
        });
    }
};

exports.requestDocument = async (req, res) => {
    const residentId = req.user.resident_id;
    const { document_type, request_data } = req.body;

    try {
        // Validate input
        if (!document_type) {
            return res.status(400).json({
                success: false,
                message: 'Document type is required'
            });
        }

        // Verify resident exists
        const resident = await knex('residents')
            .select('Resident_ID', 'First_Name', 'Last_Name')
            .where('Resident_ID', residentId)
            .first();

        if (!resident) {
            return res.status(404).json({
                success: false,
                message: 'Resident not found'
            });
        }

        // Generate request ID
        const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Insert new record into document requests table
        const [insertedRecord] = await knex('document_requests')
            .insert({
                request_id: requestId,
                resident_id: residentId,
                document_type: document_type,
                request_data: JSON.stringify(request_data || {}),
                status: 'pending',
                created_at: knex.fn.now(),
                updated_at: knex.fn.now()
            })
            .returning('*');

        // Return the created request object
        res.status(201).json({
            success: true,
            message: 'Document request created successfully',
            data: {
                request_id: insertedRecord.request_id,
                resident_id: insertedRecord.resident_id,
                document_type: insertedRecord.document_type,
                request_data: JSON.parse(insertedRecord.request_data || '{}'),
                status: insertedRecord.status,
                created_at: insertedRecord.created_at,
                updated_at: insertedRecord.updated_at
            }
        });

    } catch (error) {
        console.error('Error creating document request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create document request',
            error: error.message
        });
    }
};


// ==========================================
// ADMIN-FACING CRUD OPERATIONS
// ==========================================

const crypto = require('crypto');
const xlsx = require('xlsx');

exports.getAll = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { page = 1, limit = 50, search, sitio_id, residency_status, show_vulnerable } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let values = [];

    if (search && search.trim()) {
      whereConditions.push('r.First_Name LIKE ? OR r.Last_Name LIKE ? OR r.Mobile_Number LIKE ?');
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
        pages: Math.ceil(totalRows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
};

exports.getById = async (req, res) => {
  const db = req.app.locals.db;
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
  const db = req.app.locals.db;
  try {
    const { first_name, last_name, birthdate } = req.body;

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
  const db = req.app.locals.db;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      household_id, relation_to_head, first_name, middle_name, last_name, suffix,
      birthdate, gender, civil_status, occupation, income_estimate, mobile_number,
      voter_status, date_arrival, profile_photo_url,
      is_4ps, is_pwd, is_solo_parent, is_out_of_school_youth, disability_type
    } = req.body;

    if (!first_name || !last_name || !birthdate || !household_id) {
      return res.status(400).json({ error: 'Required fields: first_name, last_name, birthdate, household_id' });
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

    await connection.execute(`
      INSERT INTO residents (
        Resident_ID, Household_ID, Relation_to_Head, First_Name, Middle_Name, Last_Name, Suffix,
        Birthdate, Gender, Civil_Status, Occupation, Income_Estimate, Mobile_Number,
        Voter_Status, Date_Arrival, Residency_Status, Profile_Photo_URL, QR_Hash_String
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      residentId, household_id, relation_to_head || 'Head', first_name.trim(), middle_name?.trim(),
      last_name.trim(), suffix?.trim(), birthdate, gender, civil_status || 'Single',
      occupation?.trim(), income_estimate || 0, mobile_number?.trim(),
      voter_status || 'Non-Registered', date_arrival, 'Active',
      profile_photo_url?.trim(), qrHash
    ]);

    await connection.execute(`
      INSERT INTO vulnerabilities (
        Resident_ID, Is_4Ps, Is_PWD, Is_Solo_Parent, Is_Out_of_School_Youth, Disability_Type
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [residentId, is_4ps || false, is_pwd || false, is_solo_parent || false,
        is_out_of_school_youth || false, disability_type?.trim()]);

    await connection.execute(`
      UPDATE households SET Total_Members = Total_Members + 1 WHERE Household_ID = ?
    `, [household_id]);

    await connection.commit();

    res.status(201).json({
      resident_id: residentId,
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
  const db = req.app.locals.db;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const residentId = req.params.id;
    const {
      household_id, relation_to_head, first_name, middle_name, last_name, suffix,
      birthdate, gender, civil_status, occupation, income_estimate, mobile_number,
      voter_status, date_arrival, residency_status, profile_photo_url,
      is_4ps, is_pwd, is_solo_parent, is_out_of_school_youth, disability_type
    } = req.body;

    const residentUpdates = [];
    const residentValues = [];

    if (household_id !== undefined) { residentUpdates.push('Household_ID = ?'); residentValues.push(household_id); }
    if (relation_to_head !== undefined) { residentUpdates.push('Relation_to_Head = ?'); residentValues.push(relation_to_head); }
    if (first_name !== undefined) { residentUpdates.push('First_Name = ?'); residentValues.push(first_name.trim()); }
    if (middle_name !== undefined) { residentUpdates.push('Middle_Name = ?'); residentValues.push(middle_name?.trim()); }
    if (last_name !== undefined) { residentUpdates.push('Last_Name = ?'); residentValues.push(last_name.trim()); }
    if (suffix !== undefined) { residentUpdates.push('Suffix = ?'); residentValues.push(suffix?.trim()); }
    if (birthdate !== undefined) { residentUpdates.push('Birthdate = ?'); residentValues.push(birthdate); }
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
  const db = req.app.locals.db;
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

exports.bulkImport = async (req, res) => {
  const db = req.app.locals.db;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const results = { imported: 0, skipped: 0, errors: [], duplicates: [] };

    for (const row of data) {
      try {
        const residentData = {
          household_id: row['Household_ID'] || row['Household ID'],
          first_name: row['First_Name'] || row['First Name'],
          last_name: row['Last_Name'] || row['Last Name'],
          birthdate: row['Birthdate'] || row['Date_of_Birth'] || row['DOB']
        };

        const [duplicates] = await connection.execute(`
          SELECT Resident_ID FROM residents
          WHERE First_Name = ? AND Last_Name = ? AND Birthdate = ? AND Residency_Status = 'Active'
        `, [residentData.first_name, residentData.last_name, residentData.birthdate]);

        if (duplicates.length > 0) {
          results.duplicates.push({
            name: `${residentData.first_name} ${residentData.last_name}`,
            existing_id: duplicates[0].Resident_ID
          });
          results.skipped++;
          continue;
        }

        const residentId = `RES-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const qrHash = crypto.createHash('sha256')
          .update(`${residentId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`)
          .digest('hex').substring(0, 16).toUpperCase();

        await connection.execute(`
          INSERT INTO residents (
            Resident_ID, Household_ID, First_Name, Last_Name, Birthdate, Residency_Status, QR_Hash_String
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [residentId, residentData.household_id, residentData.first_name, residentData.last_name,
            residentData.birthdate, 'Active', qrHash]);

        results.imported++;
      } catch (rowError) {
        results.errors.push({ row: data.indexOf(row) + 2, error: rowError.message, data: row });
      }
    }

    await connection.commit();
    require('fs').unlinkSync(req.file.path);

    res.json({
      message: `Bulk import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors.length} errors`,
      results
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in bulk import:', error);
    res.status(500).json({ error: 'Failed to process bulk import' });
  } finally {
    connection.release();
  }
};

exports.generateQR = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const residentId = req.params.id;
    const qrString = `BARANGAY-ID-${residentId}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    await db.execute('UPDATE residents SET QR_Hash_String = ? WHERE Resident_ID = ?', [qrString, residentId]);

    res.json({ qr_code: qrString, message: 'QR code generated successfully' });
  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

exports.getHouseholdMembers = async (req, res) => {
  const db = req.app.locals.db;
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
