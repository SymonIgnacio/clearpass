class ResidentService {
  constructor(db) {
    this.db = db;
  }

  async getAll({ page = 1, limit = 50, search, sitio_id, residency_status, show_vulnerable }) {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereConditions = [];
    let values = [];

    if (search && search.trim()) {
      whereConditions.push(
        '(CONCAT(r.First_Name, " ", r.Last_Name) LIKE ? OR CONCAT(r.First_Name, " ", r.Middle_Name, " ", r.Last_Name) LIKE ? OR r.Mobile_Number LIKE ?)'
      );
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
    const [rows] = await this.db.execute(mainQuery, mainParams);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      ${whereClause}
    `;

    const [totalRows] = await this.db.execute(countQuery, values);

    // Ensure total is a number, handling different DB driver return formats
    const total = totalRows[0] ? totalRows[0].total || 0 : 0;

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getById(id) {
    const [rows] = await this.db.execute(
      `
      SELECT r.*, h.Household_Number, h.Street_Address, h.Household_Type, s.name as sitio_name,
        v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent, v.Is_Out_of_School_Youth,
        v.Vulnerability_Score, v.Disability_Type
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Resident_ID = ?
    `,
      [id]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  async checkDuplicate({ first_name, last_name, birthdate }) {
    if (!first_name || !last_name || !birthdate) {
      throw new Error('First name, last name, and birthdate are required');
    }

    const [duplicates] = await this.db.execute(
      `
      SELECT r.Resident_ID, r.First_Name, r.Last_Name, r.Birthdate, r.Residency_Status,
        h.Household_Number, s.name as sitio_name
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE r.First_Name = ? AND r.Last_Name = ? AND r.Birthdate = ?
      AND r.Residency_Status = 'Active'
    `,
      [first_name.trim(), last_name.trim(), birthdate]
    );

    return duplicates;
  }

  async create(data, files = []) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();

      const {
        household_id,
        relation_to_head,
        first_name,
        middle_name,
        last_name,
        suffix,
        birthdate,
        gender,
        civil_status,
        occupation,
        income_estimate,
        email,
        mobile_number,
        voter_status,
        date_arrival,
        profile_photo_url,
        is_4ps,
        is_pwd,
        is_solo_parent,
        is_out_of_school_youth,
        disability_type,
      } = data;

      // Check for existing email
      const [existingUser] = await connection.execute('SELECT email FROM users WHERE email = ?', [
        email.trim(),
      ]);
      if (existingUser.length > 0) {
        throw new Error('Email address is already registered to another user');
      }

      const [householdCheck] = await connection.execute(
        'SELECT Household_ID FROM households WHERE Household_ID = ?',
        [household_id]
      );
      if (householdCheck.length === 0) {
        throw new Error('Invalid household_id - household does not exist');
      }

      const residentId = `RES-${Date.now()}-${require('crypto').randomBytes(4).toString('hex').toUpperCase()}`;
      const qrHash = require('crypto')
        .createHash('sha256')
        .update(`${residentId}-${Date.now()}-${require('crypto').randomBytes(8).toString('hex')}`)
        .digest('hex')
        .substring(0, 16)
        .toUpperCase();

      const tempPassword = require('crypto').randomBytes(8).toString('hex');
      const hashedPassword = await require('bcryptjs').hash(tempPassword, 10);

      const calculateAge = bdate => {
        const today = new Date();
        const birthDate = new Date(bdate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
      };
      const age = calculateAge(birthdate);

      await connection.execute(
        `INSERT INTO residents (
          Resident_ID, Household_ID, Relation_to_Head, First_Name, Middle_Name, Last_Name, Suffix,
          Birthdate, Age, Gender, Civil_Status, Occupation, Income_Estimate, Email, Mobile_Number,
          Voter_Status, Date_Arrival, Residency_Status, Profile_Photo_URL, QR_Hash_String
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          residentId,
          household_id,
          relation_to_head || 'Head',
          first_name.trim(),
          middle_name?.trim() || null,
          last_name.trim(),
          suffix?.trim() || null,
          birthdate,
          age,
          gender,
          civil_status || 'Single',
          occupation?.trim() || null,
          income_estimate || 0,
          email.trim(),
          mobile_number?.trim() || null,
          voter_status || 'Non-Registered',
          date_arrival || null,
          'Active',
          profile_photo_url?.trim() || null,
          qrHash,
        ]
      );

      const { ROLES } = require('../config/roles');
      await connection.execute(
        `INSERT INTO users (username, email, password_hash, role, resident_id, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [email.trim(), email.trim(), hashedPassword, ROLES.RESIDENT || 12, residentId]
      );

      await connection.execute(
        `INSERT INTO vulnerabilities (
          Resident_ID, Is_4Ps, Is_PWD, Is_Solo_Parent, Is_Out_of_School_Youth, Disability_Type
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          residentId,
          is_4ps || false,
          is_pwd || false,
          is_solo_parent || false,
          is_out_of_school_youth || false,
          disability_type?.trim() || null,
        ]
      );

      await this.handleDocuments(connection, residentId, files);

      await connection.execute(
        'UPDATE households SET Total_Members = Total_Members + 1 WHERE Household_ID = ?',
        [household_id]
      );

      await connection.commit();
      return {
        resident_code: residentId,
        user_email: email.trim(),
        temp_password: tempPassword,
        qr_hash: qrHash,
      };
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  async handleDocuments(connection, residentId, files) {
    if (!files || files.length === 0) return;

    const { isEncryptionEnabled, encryptFileToEncryptedPath } = require('../utils/documentStorage');

    for (const file of files) {
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
        `INSERT INTO resident_documents (
          resident_id, document_type, file_path, file_name, verification_status, created_at,
          encryption_alg, encryption_version, encryption_iv, encryption_tag
        ) VALUES (?, ?, ?, ?, 'pending', NOW(), ?, ?, ?, ?)`,
        [
          residentId,
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

  async update(id, data, files = []) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();

      const updates = [];
      const values = [];

      const fields = [
        'Household_ID',
        'Relation_to_Head',
        'First_Name',
        'Middle_Name',
        'Last_Name',
        'Suffix',
        'Gender',
        'Civil_Status',
        'Occupation',
        'Income_Estimate',
        'Mobile_Number',
        'Voter_Status',
        'Date_Arrival',
        'Residency_Status',
        'Profile_Photo_URL',
      ];

      // Mapping incoming snake_case to DB PascalCase/CamelCase where needed or simple transformations
      const mapField = {
        household_id: 'Household_ID',
        relation_to_head: 'Relation_to_Head',
        first_name: 'First_Name',
        middle_name: 'Middle_Name',
        last_name: 'Last_Name',
        suffix: 'Suffix',
        gender: 'Gender',
        civil_status: 'Civil_Status',
        occupation: 'Occupation',
        income_estimate: 'Income_Estimate',
        mobile_number: 'Mobile_Number',
        voter_status: 'Voter_Status',
        date_arrival: 'Date_Arrival',
        residency_status: 'Residency_Status',
        profile_photo_url: 'Profile_Photo_URL',
      };

      for (const [key, dbField] of Object.entries(mapField)) {
        if (data[key] !== undefined) {
          updates.push(`${dbField} = ?`);
          values.push(data[key]);
        }
      }

      if (data.birthdate !== undefined) {
        updates.push('Birthdate = ?');
        values.push(data.birthdate);

        const calculateAge = bdate => {
          const today = new Date();
          const birthDate = new Date(bdate);
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
          return age;
        };
        updates.push('Age = ?');
        values.push(calculateAge(data.birthdate));
      }

      if (updates.length > 0) {
        values.push(id);
        await connection.execute(
          `UPDATE residents SET ${updates.join(', ')} WHERE Resident_ID = ?`,
          values
        );
      }

      const vulnUpdates = [];
      const vulnValues = [];
      const vulnMap = {
        is_4ps: 'Is_4Ps',
        is_pwd: 'Is_PWD',
        is_solo_parent: 'Is_Solo_Parent',
        is_out_of_school_youth: 'Is_Out_of_School_Youth',
        disability_type: 'Disability_Type',
      };

      for (const [key, dbField] of Object.entries(vulnMap)) {
        if (data[key] !== undefined) {
          vulnUpdates.push(`${dbField} = ?`);
          vulnValues.push(data[key]);
        }
      }

      if (vulnUpdates.length > 0) {
        vulnValues.push(id);
        await connection.execute(
          `UPDATE vulnerabilities SET ${vulnUpdates.join(', ')} WHERE Resident_ID = ?`,
          vulnValues
        );
      }

      await this.handleDocuments(connection, id, files);

      await connection.commit();
      return true;
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  async archive(id, { departure_reason, departure_date }) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE residents 
         SET Residency_Status = 'Transferred Out', Departure_Reason = ?, Departure_Date = ?, updated_at = CURRENT_TIMESTAMP
         WHERE Resident_ID = ?`,
        [departure_reason || null, departure_date || null, id]
      );

      await connection.execute(
        'UPDATE households SET Total_Members = Total_Members - 1 WHERE Household_ID = (SELECT Household_ID FROM residents WHERE Resident_ID = ?)',
        [id]
      );

      await connection.commit();
      return true;
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }
}

module.exports = ResidentService;
