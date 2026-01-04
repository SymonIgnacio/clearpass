const crypto = require('crypto');
const xlsx = require('xlsx');

exports.getAll = async (req, res) => {
  const db = req.app.locals.db;
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
  const db = req.app.locals.db;
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
  const db = req.app.locals.db;
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
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      household_id, relation_to_head, first_name, middle_name, last_name, suffix,
      birthdate, gender, civil_status, occupation, income_estimate, mobile_number,
      voter_status, date_arrival, profile_photo_url,
      is_4ps, is_pwd, is_solo_parent, is_out_of_school_youth, disability_type
    } = req.body || {};

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

exports.generateQR = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

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