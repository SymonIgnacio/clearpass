const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import authentication system
const authController = require('./authController');
const {
  verifyToken,
  checkRole,
  checkHierarchyAccess,
  checkOwnershipOrHierarchy
} = require('./authMiddleware');

// Import monitoring system
const {
  register,
  logger,
  requestLogger,
  monitorDatabaseQuery,
  monitorAIService,
  monitorCertificateIssuance,
  errorHandler,
  healthCheck
} = require('./monitoring');

// Import API documentation
const { swaggerUi, swaggerSpec } = require('./swagger');

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for sensitive operations
  message: {
    error: 'Too many sensitive operations, please try again later.',
    retryAfter: 15 * 60 * 1000
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(requestLogger);

// Apply rate limiting
// Temporarily disabled for development/testing
// app.use('/api/certificates', strictLimiter); // Certificate operations are sensitive
// app.use('/api/residents', apiLimiter);
// app.use('/api/blotter', apiLimiter);
// app.use('/api/', apiLimiter);

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let db;
async function initializeDatabase() {
  try {
    db = await mysql.createPool(dbConfig);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Initialize database on startup
initializeDatabase();

// Utility function to calculate age
function calculateAge(birthdate) {
  if (!birthdate) return 0;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

const multer = require('multer');
const xlsx = require('xlsx');

// Multer configuration for file uploads
const upload = multer({ dest: 'uploads/' });

// ==========================================
// AUTHENTICATION & ACCOUNT HIERARCHY MODULE
// ==========================================

// Public authentication routes (no middleware needed)
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', verifyToken, checkRole(['Super Admin']), authController.register);

// Protected auth routes
app.get('/api/auth/profile', verifyToken, authController.getProfile);
app.get('/api/auth/subordinates', verifyToken, authController.getSubordinates);

// ==========================================
// RESIDENT PROFILING MODULE (RBIM Enhanced)
// ==========================================

// Get all residents with RBIM data (protected - requires auth)
app.get('/api/residents', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, sitio_id, residency_status, show_vulnerable } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let values = [];

    if (search) {
      whereConditions.push('(r.First_Name LIKE ? OR r.Last_Name LIKE ? OR r.Mobile_Number LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
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

    const [rows] = await db.execute(`
      SELECT
        r.*,
        h.Household_Number,
        h.Street_Address,
        s.name as sitio_name,
        v.Is_4Ps,
        v.Is_PWD,
        v.Is_Senior,
        v.Is_Solo_Parent,
        v.Is_Out_of_School_Youth,
        v.Vulnerability_Score,
        v.Disability_Type
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      ${whereClause}
      ORDER BY r.Last_Name, r.First_Name
      LIMIT ? OFFSET ?
    `, [...values, parseInt(limit), offset]);

    const [totalRows] = await db.execute(`
      SELECT COUNT(*) as total
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      ${whereClause}
    `, values);

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
});

// Get resident by ID (RBIM enhanced) - protected with hierarchy check
app.get('/api/residents/:id', verifyToken, checkOwnershipOrHierarchy, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        r.*,
        h.Household_Number,
        h.Street_Address,
        h.Household_Type,
        s.name as sitio_name,
        v.Is_4Ps,
        v.Is_PWD,
        v.Is_Senior,
        v.Is_Solo_Parent,
        v.Is_Out_of_School_Youth,
        v.Vulnerability_Score,
        v.Disability_Type
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
});

// Duplicate checker (RBIM requirement)
app.post('/api/residents/check-duplicate', async (req, res) => {
  try {
    const { first_name, last_name, birthdate } = req.body;

    if (!first_name || !last_name || !birthdate) {
      return res.status(400).json({ error: 'First name, last name, and birthdate are required' });
    }

    const [duplicates] = await db.execute(`
      SELECT
        r.Resident_ID,
        r.First_Name,
        r.Last_Name,
        r.Birthdate,
        r.Residency_Status,
        h.Household_Number,
        s.name as sitio_name
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
});

// Create new resident (RBIM enhanced)
app.post('/api/residents', async (req, res) => {
  const connection = await db.getConnection();

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
      mobile_number,
      voter_status,
      date_arrival,
      profile_photo_url,
      // Vulnerability data
      is_4ps,
      is_pwd,
      is_solo_parent,
      is_out_of_school_youth,
      disability_type
    } = req.body;

    // Validation
    if (!first_name || !last_name || !birthdate || !household_id) {
      return res.status(400).json({ error: 'Required fields: first_name, last_name, birthdate, household_id' });
    }

    // Verify household exists
    const [householdCheck] = await connection.execute(
      'SELECT Household_ID FROM households WHERE Household_ID = ?',
      [household_id]
    );
    if (householdCheck.length === 0) {
      return res.status(400).json({ error: 'Invalid household_id - household does not exist' });
    }

    // Generate Resident_ID (UUID format)
    const residentId = `RES-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Generate QR Hash
    const qrHash = crypto.createHash('sha256')
      .update(`${residentId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    // Insert resident
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

    // Insert vulnerability data
    await connection.execute(`
      INSERT INTO vulnerabilities (
        Resident_ID, Is_4Ps, Is_PWD, Is_Solo_Parent, Is_Out_of_School_Youth, Disability_Type
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      residentId,
      is_4ps || false,
      is_pwd || false,
      is_solo_parent || false,
      is_out_of_school_youth || false,
      disability_type?.trim()
    ]);

    // Update household member count
    await connection.execute(`
      UPDATE households
      SET Total_Members = Total_Members + 1
      WHERE Household_ID = ?
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
});

// Update resident (RBIM enhanced)
app.put('/api/residents/:id', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const residentId = req.params.id;
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
      mobile_number,
      voter_status,
      date_arrival,
      residency_status,
      profile_photo_url,
      // Vulnerability updates
      is_4ps,
      is_pwd,
      is_solo_parent,
      is_out_of_school_youth,
      disability_type
    } = req.body;

    // Update resident data
    const residentUpdates = [];
    const residentValues = [];

    if (household_id !== undefined) {
      residentUpdates.push('Household_ID = ?');
      residentValues.push(household_id);
    }
    if (relation_to_head !== undefined) {
      residentUpdates.push('Relation_to_Head = ?');
      residentValues.push(relation_to_head);
    }
    if (first_name !== undefined) {
      residentUpdates.push('First_Name = ?');
      residentValues.push(first_name.trim());
    }
    if (middle_name !== undefined) {
      residentUpdates.push('Middle_Name = ?');
      residentValues.push(middle_name?.trim());
    }
    if (last_name !== undefined) {
      residentUpdates.push('Last_Name = ?');
      residentValues.push(last_name.trim());
    }
    if (suffix !== undefined) {
      residentUpdates.push('Suffix = ?');
      residentValues.push(suffix?.trim());
    }
    if (birthdate !== undefined) {
      residentUpdates.push('Birthdate = ?');
      residentValues.push(birthdate);
    }
    if (gender !== undefined) {
      residentUpdates.push('Gender = ?');
      residentValues.push(gender);
    }
    if (civil_status !== undefined) {
      residentUpdates.push('Civil_Status = ?');
      residentValues.push(civil_status);
    }
    if (occupation !== undefined) {
      residentUpdates.push('Occupation = ?');
      residentValues.push(occupation?.trim());
    }
    if (income_estimate !== undefined) {
      residentUpdates.push('Income_Estimate = ?');
      residentValues.push(income_estimate);
    }
    if (mobile_number !== undefined) {
      residentUpdates.push('Mobile_Number = ?');
      residentValues.push(mobile_number?.trim());
    }
    if (voter_status !== undefined) {
      residentUpdates.push('Voter_Status = ?');
      residentValues.push(voter_status);
    }
    if (date_arrival !== undefined) {
      residentUpdates.push('Date_Arrival = ?');
      residentValues.push(date_arrival);
    }
    if (residency_status !== undefined) {
      residentUpdates.push('Residency_Status = ?');
      residentValues.push(residency_status);
    }
    if (profile_photo_url !== undefined) {
      residentUpdates.push('Profile_Photo_URL = ?');
      residentValues.push(profile_photo_url?.trim());
    }

    if (residentUpdates.length > 0) {
      const residentSql = `UPDATE residents SET ${residentUpdates.join(', ')} WHERE Resident_ID = ?`;
      residentValues.push(residentId);
      await connection.execute(residentSql, residentValues);
    }

    // Update vulnerability data
    const vulnUpdates = [];
    const vulnValues = [];

    if (is_4ps !== undefined) {
      vulnUpdates.push('Is_4Ps = ?');
      vulnValues.push(is_4ps);
    }
    if (is_pwd !== undefined) {
      vulnUpdates.push('Is_PWD = ?');
      vulnValues.push(is_pwd);
    }
    if (is_solo_parent !== undefined) {
      vulnUpdates.push('Is_Solo_Parent = ?');
      vulnValues.push(is_solo_parent);
    }
    if (is_out_of_school_youth !== undefined) {
      vulnUpdates.push('Is_Out_of_School_Youth = ?');
      vulnValues.push(is_out_of_school_youth);
    }
    if (disability_type !== undefined) {
      vulnUpdates.push('Disability_Type = ?');
      vulnValues.push(disability_type?.trim());
    }

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
});

// Archive resident (Migration handler - RBIM requirement)
app.put('/api/residents/:id/archive', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const residentId = req.params.id;
    const { departure_date, departure_reason, destination } = req.body;

    // Update resident status
    await connection.execute(`
      UPDATE residents
      SET Residency_Status = 'Transferred Out',
          updated_at = CURRENT_TIMESTAMP
      WHERE Resident_ID = ?
    `, [residentId]);

    // Update household member count
    await connection.execute(`
      UPDATE households
      SET Total_Members = Total_Members - 1
      WHERE Household_ID = (SELECT Household_ID FROM residents WHERE Resident_ID = ?)
    `, [residentId]);

    // Log the migration (you could create a separate migration_log table)
    console.log(`Resident ${residentId} archived - Departure: ${departure_date}, Reason: ${departure_reason}, Destination: ${destination}`);

    await connection.commit();
    res.json({
      message: 'Resident archived successfully',
      status: 'Transferred Out'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error archiving resident:', error);
    res.status(500).json({ error: 'Failed to archive resident' });
  } finally {
    connection.release();
  }
});

// Bulk import residents (Excel/CSV parser)
app.post('/api/residents/bulk-import', upload.single('file'), async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const results = {
      imported: 0,
      skipped: 0,
      errors: [],
      duplicates: []
    };

    for (const row of data) {
      try {
        // Map Excel columns to database fields (adjust column names as needed)
        const residentData = {
          household_id: row['Household_ID'] || row['Household ID'],
          relation_to_head: row['Relation_to_Head'] || row['Relation to Head'] || 'Member',
          first_name: row['First_Name'] || row['First Name'],
          middle_name: row['Middle_Name'] || row['Middle Name'],
          last_name: row['Last_Name'] || row['Last Name'],
          suffix: row['Suffix'],
          birthdate: row['Birthdate'] || row['Date_of_Birth'] || row['DOB'],
          gender: row['Gender'],
          civil_status: row['Civil_Status'] || row['Civil Status'] || 'Single',
          occupation: row['Occupation'],
          income_estimate: parseFloat(row['Income_Estimate'] || row['Monthly_Income'] || '0'),
          mobile_number: row['Mobile_Number'] || row['Contact_Number'] || row['Phone'],
          voter_status: row['Voter_Status'] || row['Voter Status'] || 'Non-Registered',
          date_arrival: row['Date_Arrival'] || row['Date Arrived'] || new Date().toISOString().split('T')[0],
          is_4ps: row['Is_4Ps'] || row['4Ps_Member'] ? true : false,
          is_pwd: row['Is_PWD'] || row['PWD'] ? true : false,
          is_solo_parent: row['Is_Solo_Parent'] || row['Solo_Parent'] ? true : false,
          is_out_of_school_youth: row['Is_Out_of_School_Youth'] || row['OSY'] ? true : false,
          disability_type: row['Disability_Type'] || row['Disability Type']
        };

        // Check for duplicates
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

        // Generate IDs and insert (similar to single insert logic)
        const residentId = `RES-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const qrHash = crypto.createHash('sha256')
          .update(`${residentId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`)
          .digest('hex')
          .substring(0, 16)
          .toUpperCase();

        await connection.execute(`
          INSERT INTO residents (
            Resident_ID, Household_ID, Relation_to_Head, First_Name, Middle_Name, Last_Name, Suffix,
            Birthdate, Gender, Civil_Status, Occupation, Income_Estimate, Mobile_Number,
            Voter_Status, Date_Arrival, Residency_Status, QR_Hash_String
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          residentId, residentData.household_id, residentData.relation_to_head,
          residentData.first_name, residentData.middle_name, residentData.last_name, residentData.suffix,
          residentData.birthdate, residentData.gender, residentData.civil_status,
          residentData.occupation, residentData.income_estimate, residentData.mobile_number,
          residentData.voter_status, residentData.date_arrival, 'Active', qrHash
        ]);

        await connection.execute(`
          INSERT INTO vulnerabilities (
            Resident_ID, Is_4Ps, Is_PWD, Is_Solo_Parent, Is_Out_of_School_Youth, Disability_Type
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          residentId, residentData.is_4ps, residentData.is_pwd,
          residentData.is_solo_parent, residentData.is_out_of_school_youth, residentData.disability_type
        ]);

        results.imported++;
      } catch (rowError) {
        results.errors.push({
          row: data.indexOf(row) + 2, // +2 because Excel is 1-indexed and has header
          error: rowError.message,
          data: row
        });
      }
    }

    await connection.commit();

    // Clean up uploaded file
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
});

// Get household members
app.get('/api/households/:id/members', async (req, res) => {
  try {
    const [members] = await db.execute(`
      SELECT
        r.*,
        v.Is_4Ps,
        v.Is_PWD,
        v.Is_Senior,
        v.Is_Solo_Parent,
        v.Is_Out_of_School_Youth,
        v.Vulnerability_Score
      FROM residents r
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Household_ID = ?
      ORDER BY
        CASE r.Relation_to_Head
          WHEN 'Head' THEN 1
          WHEN 'Spouse' THEN 2
          ELSE 3
        END,
        r.Birthdate
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

    res.json({
      household: household[0],
      members: members
    });
  } catch (error) {
    console.error('Error fetching household members:', error);
    res.status(500).json({ error: 'Failed to fetch household members' });
  }
});

// Generate QR code for resident ID (RBIM enhanced)
app.post('/api/residents/:id/generate-qr', async (req, res) => {
  try {
    const residentId = req.params.id;

    // Generate unique QR code string (Barangay ID format)
    const qrString = `BARANGAY-ID-${residentId}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // Update resident with QR code
    await db.execute(
      'UPDATE residents SET QR_Hash_String = ? WHERE Resident_ID = ?',
      [qrString, residentId]
    );

    // Get updated resident data with household info
    const [residents] = await db.execute(`
      SELECT
        r.*,
        h.Household_Number,
        h.Street_Address,
        s.name as sitio_name,
        v.Vulnerability_Score
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Resident_ID = ?
    `, [residentId]);

    res.json({
      success: true,
      qr_code: qrString,
      resident: residents[0],
      message: 'QR code generated successfully for Barangay ID'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// ==========================================
// HOUSEHOLDS MANAGEMENT (RBIM)
// ==========================================

// Get all households
app.get('/api/households', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT h.*, s.name as sitio_name
      FROM households h
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      ORDER BY h.Household_Number
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching households:', error);
    res.status(500).json({ error: 'Failed to fetch households' });
  }
});

// Get household by ID
app.get('/api/households/:id', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT h.*, s.name as sitio_name
      FROM households h
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE h.Household_ID = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching household:', error);
    res.status(500).json({ error: 'Failed to fetch household' });
  }
});

// Create new household
app.post('/api/households', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { Household_Number, Sitio_ID, Street_Address, Household_Type } = req.body;

    // Validation
    if (!Household_Number || !Sitio_ID || !Street_Address) {
      return res.status(400).json({ error: 'Household_Number, Sitio_ID, and Street_Address are required' });
    }

    // Generate Household_ID
    const householdId = `H-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Insert household
    await connection.execute(`
      INSERT INTO households (
        Household_ID, Household_Number, Sitio_ID, Street_Address, Household_Type
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      householdId, Household_Number.trim(), Sitio_ID, Street_Address.trim(),
      Household_Type || 'Nuclear'
    ]);

    await connection.commit();

    res.status(201).json({
      household_id: householdId,
      message: 'Household created successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating household:', error);
    res.status(500).json({ error: 'Failed to create household' });
  } finally {
    connection.release();
  }
});

// Update household
app.put('/api/households/:id', async (req, res) => {
  try {
    const { Household_Number, Sitio_ID, Street_Address, Household_Type } = req.body;

    const updates = [];
    const values = [];

    if (Household_Number !== undefined) {
      updates.push('Household_Number = ?');
      values.push(Household_Number.trim());
    }
    if (Sitio_ID !== undefined) {
      updates.push('Sitio_ID = ?');
      values.push(Sitio_ID);
    }
    if (Street_Address !== undefined) {
      updates.push('Street_Address = ?');
      values.push(Street_Address.trim());
    }
    if (Household_Type !== undefined) {
      updates.push('Household_Type = ?');
      values.push(Household_Type);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const sql = `UPDATE households SET ${updates.join(', ')} WHERE Household_ID = ?`;
    values.push(req.params.id);

    await db.execute(sql, values);
    res.json({ message: 'Household updated successfully' });
  } catch (error) {
    console.error('Error updating household:', error);
    res.status(500).json({ error: 'Failed to update household' });
  }
});

// Delete household
app.delete('/api/households/:id', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const householdId = req.params.id;

    // Check if household has residents
    const [residents] = await connection.execute(
      'SELECT COUNT(*) as count FROM residents WHERE Household_ID = ?',
      [householdId]
    );

    if (residents[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete household with active residents. Archive residents first.'
      });
    }

    await connection.execute('DELETE FROM households WHERE Household_ID = ?', [householdId]);
    await connection.commit();

    res.json({ message: 'Household deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting household:', error);
    res.status(500).json({ error: 'Failed to delete household' });
  } finally {
    connection.release();
  }
});

// Get census statistics
app.get('/api/census', verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT
        s.name as sitio_name,
        COUNT(r.Resident_ID) as total_residents,
        SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as pwd,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as single_parents
      FROM sitios s
      LEFT JOIN households h ON s.id = h.Sitio_ID
      LEFT JOIN residents r ON h.Household_ID = r.Household_ID
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    const [overall] = await db.execute(`
      SELECT
        COUNT(*) as total_residents,
        SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as total_pwd,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as total_single_parents
      FROM residents r
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
    `);

    res.json({
      bySitio: stats,
      overall: overall[0]
    });
  } catch (error) {
    console.error('Error fetching census:', error);
    res.status(500).json({ error: 'Failed to fetch census data' });
  }
});

// Analytics census endpoint (for Analytics page)
app.get('/api/analytics/census', async (req, res) => {
  try {
    const [bySitio] = await db.execute(`
      SELECT
        s.id as sitio_id,
        s.name as sitio_name,
        COUNT(r.Resident_ID) as total_residents,
        SUM(CASE WHEN r.Gender = 'Male' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN r.Gender = 'Female' THEN 1 ELSE 0 END) as total_women,
        SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as total_pwds,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as total_single_parents
      FROM sitios s
      LEFT JOIN households h ON s.id = h.Sitio_ID
      LEFT JOIN residents r ON h.Household_ID = r.Household_ID
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    const [overall] = await db.execute(`
      SELECT
        COUNT(*) as total_residents,
        SUM(CASE WHEN Gender = 'Male' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN Gender = 'Female' THEN 1 ELSE 0 END) as total_women,
        SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as total_pwds,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as total_single_parents
      FROM residents r
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
    `);

    res.json({
      bySitio,
      overall: overall[0]
    });
  } catch (error) {
    console.error('Error fetching analytics census:', error);
    res.status(500).json({ error: 'Failed to fetch analytics census data' });
  }
});

// ==========================================
// BLOTTER & INCIDENT REPORTING MODULE
// ==========================================

// Get all blotter records
app.get('/api/blotter', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT b.*,
             s.name as sitio_name
      FROM blotter b
      LEFT JOIN sitios s ON b.Location_Sitio = s.name
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching blotter:', error);
    res.status(500).json({ error: 'Failed to fetch blotter records' });
  }
});

// Create new blotter record (using new Katarungang Pambarangay schema)
app.post('/api/blotter', async (req, res) => {
  try {
    const {
      Case_Number,
      Complainant_Details,
      Respondent_Details,
      Incident_Type,
      Narrative,
      DateTime_Incident,
      Location_Sitio,
      Status
    } = req.body;

    // Validation
    if (!Complainant_Details || !Incident_Type || !Narrative || !Location_Sitio) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Generate case number if not provided
    let caseNumber = Case_Number;
    if (!caseNumber) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(4, '0');
      caseNumber = `BLOT-${year}-${month}-${sequence}`;
    }

    const [result] = await db.execute(`
      INSERT INTO blotter (
        Case_Number, Complainant_Details, Respondent_Details, Incident_Type,
        Narrative, DateTime_Incident, Location_Sitio, Status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      caseNumber,
      JSON.stringify(Complainant_Details),
      Respondent_Details ? JSON.stringify(Respondent_Details) : null,
      Incident_Type,
      Narrative,
      DateTime_Incident,
      Location_Sitio,
      Status || 'Pending'
    ]);

    res.status(201).json({
      id: result.insertId,
      Case_Number: caseNumber,
      message: 'Blotter record created successfully'
    });
  } catch (error) {
    console.error('Error creating blotter record:', error);
    res.status(500).json({ error: 'Failed to create blotter record' });
  }
});

// Update blotter record (using new schema)
app.put('/api/blotter/:caseNumber', async (req, res) => {
  try {
    const {
      Complainant_Details,
      Respondent_Details,
      Incident_Type,
      Narrative,
      DateTime_Incident,
      Location_Sitio,
      Status,
      Hearing_Schedule
    } = req.body;

    const updateFields = [];
    const values = [];

    if (Complainant_Details !== undefined) {
      updateFields.push('Complainant_Details = ?');
      values.push(JSON.stringify(Complainant_Details));
    }
    if (Respondent_Details !== undefined) {
      updateFields.push('Respondent_Details = ?');
      values.push(Respondent_Details ? JSON.stringify(Respondent_Details) : null);
    }
    if (Incident_Type !== undefined) {
      updateFields.push('Incident_Type = ?');
      values.push(Incident_Type);
    }
    if (Narrative !== undefined) {
      updateFields.push('Narrative = ?');
      values.push(Narrative);
    }
    if (DateTime_Incident !== undefined) {
      updateFields.push('DateTime_Incident = ?');
      values.push(DateTime_Incident);
    }
    if (Location_Sitio !== undefined) {
      updateFields.push('Location_Sitio = ?');
      values.push(Location_Sitio);
    }
    if (Status !== undefined) {
      updateFields.push('Status = ?');
      values.push(Status);
    }
    if (Hearing_Schedule !== undefined) {
      updateFields.push('Hearing_Schedule = ?');
      values.push(Hearing_Schedule);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const sql = `UPDATE blotter SET ${updateFields.join(', ')} WHERE Case_Number = ?`;
    values.push(req.params.caseNumber);

    await db.execute(sql, values);
    res.json({ message: 'Blotter record updated successfully' });
  } catch (error) {
    console.error('Error updating blotter record:', error);
    res.status(500).json({ error: 'Failed to update blotter record' });
  }
});

// Delete blotter record
app.delete('/api/blotter/:caseNumber', async (req, res) => {
  try {
    await db.execute('DELETE FROM blotter WHERE Case_Number = ?', [req.params.caseNumber]);
    res.json({ message: 'Blotter record deleted successfully' });
  } catch (error) {
    console.error('Error deleting blotter record:', error);
    res.status(500).json({ error: 'Failed to delete blotter record' });
  }
});

// ==========================================
// CERTIFICATE ISSUANCE MODULE
// ==========================================

// Get certificate types (from database - removed hardcoded data)
app.get('/api/certificate-types', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        id,
        name,
        fee,
        validity_days,
        description,
        purpose,
        when_needed,
        required_data
      FROM certificate_types
      WHERE is_active = TRUE
      ORDER BY name
    `);

    // Parse JSON required_data for each certificate type
    const certificateTypes = rows.map(type => ({
      ...type,
      required_data: type.required_data ? JSON.parse(type.required_data) : []
    }));

    res.json(certificateTypes);
  } catch (error) {
    console.error('Error fetching certificate types:', error);
    res.status(500).json({ error: 'Failed to fetch certificate types' });
  }
});

// Get all certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
      FROM certificates_log c
      JOIN residents r ON c.resident_id = r.Resident_ID
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Issue new certificate
app.post('/api/certificates', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { resident_id, certificate_type_id, purpose, data, issued_by, status, fee_paid } = req.body;

    // Enhanced input validation
    if (!resident_id || isNaN(resident_id)) {
      return res.status(400).json({ error: 'Valid resident_id is required' });
    }

    if (!certificate_type_id || isNaN(certificate_type_id)) {
      return res.status(400).json({ error: 'Valid certificate_type_id is required' });
    }

    if (!purpose || purpose.trim().length === 0) {
      return res.status(400).json({ error: 'Purpose is required' });
    }

    // Verify resident exists
    const [residentCheck] = await connection.execute('SELECT Resident_ID FROM residents WHERE Resident_ID = ?', [resident_id]);
    if (residentCheck.length === 0) {
      return res.status(400).json({ error: 'Resident not found' });
    }

    // Get certificate type name from database
    const [certTypeRows] = await connection.execute(
      'SELECT name FROM certificate_types WHERE id = ? AND is_active = TRUE',
      [certificate_type_id]
    );

    if (certTypeRows.length === 0) {
      return res.status(400).json({ error: 'Invalid certificate type' });
    }

    const certificate_type = certTypeRows[0].name;

    // CRITICAL BUSINESS RULE: Check blotter before issuing clearance or good moral certificates
    // As per survey requirements - block issuance for residents with active blotter cases
    if (certificate_type === 'Barangay Clearance' || certificate_type === 'Good Moral') {
      const [blotterCheck] = await connection.execute(`
        SELECT COUNT(*) as active_cases,
               GROUP_CONCAT(case_number) as case_numbers,
               GROUP_CONCAT(incident_type) as incident_types
        FROM blotter
        WHERE respondent_id = ? AND status = 'Pending'
      `, [resident_id]);

      if (blotterCheck[0].active_cases > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'BLOCK ISSUANCE: Active blotter case found for this resident',
          details: {
            caseCount: blotterCheck[0].active_cases,
            caseNumbers: blotterCheck[0].case_numbers,
            incidentTypes: blotterCheck[0].incident_types,
            message: 'Cannot issue clearance certificate while resident has pending blotter cases'
          }
        });
      }
    }

    // Generate certificate number with transaction safety
    const controlNo = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const [result] = await connection.execute(`
      INSERT INTO certificates_log (
        control_no, resident_id, certificate_type, purpose, data,
        date_issued, status, fee_paid, issued_by,
        signatory_captain, signatory_secretary
      ) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?)
    `, [
      controlNo, resident_id, certificate_type, purpose.trim(), JSON.stringify(data || {}),
      status || 'approved', fee_paid || 0, issued_by || 1,
      'Captain Juan Dela Cruz', 'Secretary Maria Santos'
    ]);

    await connection.commit();

    res.status(201).json({
      id: result.insertId,
      control_no: controlNo,
      message: 'Certificate issued successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error issuing certificate:', error);
    res.status(500).json({ error: 'Failed to issue certificate' });
  } finally {
    connection.release();
  }
});

// ==========================================
// AI INTEGRATION MODULE
// ==========================================

// Social Aid Priority
app.post('/api/ai/priority', async (req, res) => {
  try {
    const { resident_id } = req.body;

    // Get resident data
    const [residents] = await db.execute('SELECT * FROM residents WHERE Resident_ID = ?', [resident_id]);
    if (residents.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    const resident = residents[0];

    // Call AI service
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/suggest-aid`, {
      income_estimate: resident.Income_Estimate,
      is_senior: resident.is_senior,
      is_pwd: resident.is_pwd,
      is_single_parent: resident.is_single_parent,
      employment_status: resident.employment_status
    });

    res.json({
      resident_id,
      resident_name: `${resident.First_Name} ${resident.Last_Name}`,
      ...aiResponse.data
    });
  } catch (error) {
    console.error('AI service error:', error.message);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// AI Priority Score (for Social Aid page)
app.post('/api/ai/priority-score', async (req, res) => {
  try {
    const { resident_id } = req.body;

    // Get resident data
    const [residents] = await db.execute('SELECT * FROM residents WHERE Resident_ID = ?', [resident_id]);
    if (residents.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    const resident = residents[0];
    let fallback = false;

    try {
      // Try AI service first
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:5000'}/suggest-aid`, {
        monthly_income: resident.monthly_income || resident.Income_Estimate || 0,
        is_senior: resident.is_senior || false,
        is_pwd: resident.is_pwd || false,
        is_single_parent: resident.is_single_parent || false,
        employment_status: resident.employment_status || 'unemployed'
      });

      res.json({
        data: aiResponse.data,
        fallback: false
      });
    } catch (aiError) {
      // Fallback calculation
      fallback = true;
      const income = resident.monthly_income || resident.Income_Estimate || 0;
      const isSenior = resident.is_senior || false;
      const isPwd = resident.is_pwd || false;
      const isSingleParent = resident.is_single_parent || false;
      const isEmployed = resident.employment_status === 'employed';

      let priority = 'MEDIUM';
      let score = 50;
      let reasons = [];

      if (income < 10000 || isSenior || isPwd) {
        priority = 'HIGH';
        score = 80;
        if (income < 10000) reasons.push('Low monthly income (below ₱10,000)');
        if (isSenior) reasons.push('Senior citizen status');
        if (isPwd) reasons.push('Person with disability');
      } else if (income > 20000 && isEmployed) {
        priority = 'LOW';
        score = 25;
        reasons.push('High income and employed');
      } else {
        if (isSingleParent) reasons.push('Single parent household');
        if (!isEmployed) reasons.push('Currently unemployed');
        reasons.push('Moderate income level');
      }

      res.json({
        data: {
          priority,
          score,
          reasons
        },
        fallback: true
      });
    }
  } catch (error) {
    console.error('Priority calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate priority score' });
  }
});

// Predictive Patrol Suggestions
app.get('/api/ai/patrol-suggestions', async (req, res) => {
  try {
    // Get recent blotter data (last 30 days for better analysis)
    const [blotterData] = await db.execute(`
      SELECT b.*, s.name as sitio_name
      FROM blotter b
      LEFT JOIN sitios s ON b.Location_Sitio = s.name
      WHERE b.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY b.created_at DESC
    `);

    // Call AI service
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:5000'}/suggest-patrol`, {
      blotter_data: blotterData
    });

    res.json(aiResponse.data);
  } catch (error) {
    console.error('AI patrol service error:', error.message);
    res.status(500).json({ error: 'AI patrol service unavailable' });
  }
});

// ==========================================
// TANOD SCHEDULE MODULE
// ==========================================

// Get tanod schedules
app.get('/api/tanod-schedules', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT t.*, s.name as sitio_name
      FROM tanod_schedule t
      LEFT JOIN sitios s ON t.sitio_id = s.id
      ORDER BY t.shift_date DESC, t.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tanod schedules:', error);
    res.status(500).json({ error: 'Failed to fetch tanod schedules' });
  }
});

// Create tanod schedule
app.post('/api/tanod-schedules', async (req, res) => {
  try {
    const { patrol_area, sitio_id, number_of_tanods, shift_time, shift_date, notes } = req.body;

    const [result] = await db.execute(`
      INSERT INTO tanod_schedule (
        patrol_area, sitio_id, number_of_tanods, shift_time, shift_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [patrol_area, sitio_id, number_of_tanods, shift_time, shift_date, notes]);

    res.status(201).json({ id: result.insertId, message: 'Tanod schedule created successfully' });
  } catch (error) {
    console.error('Error creating tanod schedule:', error);
    res.status(500).json({ error: 'Failed to create tanod schedule' });
  }
});

// ==========================================
// UTILITY ENDPOINTS
// ==========================================

// Get sitios
app.get('/api/sitios', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM sitios ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sitios:', error);
    res.status(500).json({ error: 'Failed to fetch sitios' });
  }
});

// ==========================================
// QR CODE & ID SYSTEM
// ==========================================

// Generate QR code for resident ID
app.post('/api/residents/:id/generate-qr', async (req, res) => {
  try {
    const residentId = req.params.id;

    // Generate unique QR code string
    const qrString = `BARANGAY-ID-${residentId}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // Update resident with QR code
    await db.execute(
      'UPDATE residents SET qr_code_string = ? WHERE Resident_ID = ?',
      [qrString, residentId]
    );

    // Get updated resident data
    const [residents] = await db.execute(`
      SELECT r.*, s.name as sitio_name
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE r.Resident_ID = ?
    `, [residentId]);

    res.json({
      success: true,
      qr_code: qrString,
      resident: residents[0],
      message: 'QR code generated successfully'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Generate QR code for certificate
app.post('/api/certificates/:id/generate-qr', async (req, res) => {
  try {
    const certificateId = req.params.id;

    // Generate unique QR validation hash
    const qrHash = crypto.createHash('sha256')
      .update(`CERT-${certificateId}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
      .digest('hex')
      .substring(0, 32)
      .toUpperCase();

    // Update certificate with QR hash
    await db.execute(
      'UPDATE certificates_log SET qr_validation_string = ? WHERE id = ?',
      [qrHash, certificateId]
    );

    res.json({
      success: true,
      qr_hash: qrHash,
      verification_url: `${req.protocol}://${req.get('host')}/verify-qr/${qrHash}`,
      message: 'QR code generated successfully'
    });
  } catch (error) {
    console.error('Error generating certificate QR:', error);
    res.status(500).json({ error: 'Failed to generate certificate QR' });
  }
});

// Public QR verification endpoint
app.get('/verify-qr/:hash', async (req, res) => {
  try {
    const qrHash = req.params.hash;

    // Check if hash exists in certificates_log
    const [certificates] = await db.execute(`
      SELECT c.*,
             CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name,
             r.Mobile_Number as contact_number,
             s.name as sitio_name
      FROM certificates_log c
      JOIN residents r ON c.resident_id = r.Resident_ID
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE c.qr_validation_string = ? AND c.status = 'Released'
    `, [qrHash]);

    if (certificates.length > 0) {
      const cert = certificates[0];
      res.json({
        status: 'VALID',
        type: 'certificate',
        certificate: {
          number: cert.control_no,
          type: cert.certificate_type,
          resident_name: cert.resident_name,
          sitio: cert.sitio_name,
          issued_date: cert.date_issued,
          signatory_captain: cert.signatory_captain,
          signatory_secretary: cert.signatory_secretary
        },
        message: 'Certificate is valid and authentic'
      });
    } else {
      // Check if hash exists in residents (Barangay ID)
      const [residents] = await db.execute(`
        SELECT r.*,
               s.name as sitio_name
        FROM residents r
        LEFT JOIN sitios s ON r.sitio_id = s.id
        WHERE r.qr_identity_hash = ?
      `, [qrHash]);

      if (residents.length > 0) {
        const resident = residents[0];
        res.json({
          status: 'VALID',
          type: 'barangay_id',
          resident: {
            name: `${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`.trim(),
            sitio: resident.sitio_name,
            age: resident.age,
            address: resident.address,
            contact: resident.mobile_number
          },
          message: 'Barangay ID is valid and authentic'
        });
      } else {
        res.json({
          status: 'INVALID',
          message: 'QR code not found or invalid. This document may be counterfeit.'
        });
      }
    }
  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Verification service temporarily unavailable'
    });
  }
});

// ==========================================
// COMMUNITY EVENTS MODULE
// ==========================================

// Get all community programs/events
app.get('/api/programs', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.*,
             s.name as sitio_name,
             JSON_LENGTH(p.target_beneficiaries) as target_count
      FROM community_programs p
      LEFT JOIN sitios s ON p.sitio_id = s.id
      ORDER BY p.program_date DESC, p.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Create new community program/event
app.post('/api/programs', async (req, res) => {
  try {
    const {
      program_name,
      description,
      program_date,
      sitio_id,
      target_beneficiaries,
      status,
      organizer,
      budget_allocated,
      notes
    } = req.body;

    const [result] = await db.execute(`
      INSERT INTO community_programs (
        program_name, description, program_date, sitio_id,
        target_beneficiaries, status, organizer, budget_allocated, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      program_name, description, program_date, sitio_id,
      JSON.stringify(target_beneficiaries || []), status || 'Planned', organizer, budget_allocated || 0, notes
    ]);

    res.status(201).json({
      id: result.insertId,
      message: 'Community program created successfully'
    });
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({ error: 'Failed to create program' });
  }
});

// Update community program/event
app.put('/api/programs/:id', async (req, res) => {
  try {
    const {
      program_name,
      description,
      program_date,
      sitio_id,
      target_beneficiaries,
      status,
      organizer,
      budget_allocated,
      actual_cost,
      participants_count,
      success_rating,
      notes
    } = req.body;

    await db.execute(`
      UPDATE community_programs SET
        program_name = ?, description = ?, program_date = ?, sitio_id = ?,
        target_beneficiaries = ?, status = ?, organizer = ?, budget_allocated = ?,
        actual_cost = ?, participants_count = ?, success_rating = ?, notes = ?
      WHERE id = ?
    `, [
      program_name, description, program_date, sitio_id,
      JSON.stringify(target_beneficiaries || []), status, organizer, budget_allocated,
      actual_cost, participants_count, success_rating, notes,
      req.params.id
    ]);

    res.json({ message: 'Program updated successfully' });
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(500).json({ error: 'Failed to update program' });
  }
});

// Add resident to community program
app.post('/api/programs/:id/add-participant', async (req, res) => {
  try {
    const { resident_id } = req.body;
    const programId = req.params.id;

    // Get current program
    const [programs] = await db.execute(
      'SELECT * FROM community_programs WHERE id = ?',
      [programId]
    );

    if (programs.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const program = programs[0];
    let participants_count = program.participants_count || 0;
    participants_count += 1;

    // Update program
    await db.execute(
      'UPDATE community_programs SET participants_count = ? WHERE id = ?',
      [participants_count, programId]
    );

    res.json({ message: 'Participant added successfully' });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// ==========================================
// SMS NOTIFICATION SYSTEM
// ==========================================

// SMS stub function (ready for Twilio/Semaphore integration)
function sendSMS(mobile, message) {
  // For now, just log the SMS (replace with actual SMS service)
  const timestamp = new Date().toISOString();
  console.log(`📱 [${timestamp}] SMS to ${mobile}: ${message}`);

  // TODO: Integrate with actual SMS service
  // Example with Twilio:
  // const twilio = require('twilio');
  // const client = twilio(accountSid, authToken);
  // return client.messages.create({
  //   body: message,
  //   from: '+1234567890',
  //   to: mobile
  // });

  return {
    success: true,
    message: 'SMS logged (integration ready)',
    timestamp: timestamp,
    recipient: mobile,
    content: message
  };
}

// Send SMS notification
app.post('/api/sms/send', async (req, res) => {
  try {
    const { mobile, message, resident_id } = req.body;

    // If resident_id provided, get mobile from database
    let targetMobile = mobile;
    if (resident_id && !mobile) {
      const [residents] = await db.execute(
        'SELECT Mobile_Number FROM residents WHERE Resident_ID = ?',
        [resident_id]
      );
      if (residents.length > 0 && residents[0].Mobile_Number) {
        targetMobile = residents[0].Mobile_Number;
      } else {
        return res.status(400).json({ error: 'Resident has no mobile number on record' });
      }
    }

    if (!targetMobile) {
      return res.status(400).json({ error: 'Mobile number required' });
    }

    // Send SMS (currently just logs)
    const smsResult = sendSMS(targetMobile, message);

    res.json({
      success: true,
      sms_result: smsResult,
      message: 'SMS notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

// Bulk SMS to community program participants (simplified - using participants_count)
app.post('/api/programs/:id/notify-participants', async (req, res) => {
  try {
    const { message } = req.body;
    const programId = req.params.id;

    // Get program details
    const [programs] = await db.execute(`
      SELECT p.program_name, p.participants_count, p.sitio_id
      FROM community_programs p
      WHERE p.id = ?
    `, [programId]);

    if (programs.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const program = programs[0];

    if (program.participants_count === 0) {
      return res.status(400).json({ error: 'No participants in this program' });
    }

    // Get resident mobile numbers from the sitio
    const [participantData] = await db.execute(`
      SELECT Resident_ID as id, Mobile_Number as mobile_number, CONCAT(First_Name, ' ', Last_Name) as name
      FROM residents
      WHERE sitio_id = ?
      AND Mobile_Number IS NOT NULL
      AND Mobile_Number != ''
      LIMIT ?
    `, [program.sitio_id, program.participants_count]);

    // Send SMS to participants
    const smsResults = [];
    for (const participant of participantData) {
      const personalizedMessage = message.replace('{name}', participant.name);
      const smsResult = sendSMS(participant.mobile_number, personalizedMessage);
      smsResults.push({
        resident_id: participant.id,
        name: participant.name,
        mobile: participant.mobile_number,
        sms_result: smsResult
      });
    }

    res.json({
      success: true,
      program_name: program.program_name,
      total_participants: program.participants_count,
      sms_sent: smsResults.length,
      results: smsResults,
      message: `SMS notifications sent to ${smsResults.length} participants`
    });
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    res.status(500).json({ error: 'Failed to send bulk SMS' });
  }
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Enhanced health check with monitoring
app.get('/health', async (req, res) => {
  try {
    const { checks, isHealthy } = await healthCheck(db);
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(checks);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      service: 'Barangay Management API',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Add error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`🚀 Barangay Management Server running on port ${port}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'barangay_management'}`);
  console.log(`🤖 AI Service: ${process.env.AI_SERVICE_URL || 'http://localhost:5000'}`);
  console.log(`🔍 QR Verification: http://localhost:${port}/verify-qr/{hash}`);
});
