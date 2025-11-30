const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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
app.use('/api/certificates', strictLimiter); // Certificate operations are sensitive
app.use('/api/residents', apiLimiter);
app.use('/api/blotter', apiLimiter);
app.use('/api/', apiLimiter);

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

// ==========================================
// RESIDENT PROFILING MODULE
// ==========================================

// Get all residents
app.get('/api/residents', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT r.*, s.name as sitio_name
      FROM residents r
      LEFT JOIN sitios s ON r.sitio_id = s.id
      ORDER BY r.last_name, r.first_name
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});

// Get resident by ID
app.get('/api/residents/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT r.*, s.name as sitio_name
      FROM residents r
      LEFT JOIN sitios s ON r.sitio_id = s.id
      WHERE r.id = ?
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

// Create new resident
app.post('/api/residents', async (req, res) => {
  try {
    const {
      first_name, last_name, middle_name, dob, age, gender, address, sitio_id,
      mobile_number, employment_status, income_estimate,
      is_senior, is_pwd, is_single_parent, is_4ps, voter_status
    } = req.body;

    // Input validation
    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    if (!sitio_id || isNaN(sitio_id)) {
      return res.status(400).json({ error: 'Valid sitio_id is required' });
    }

    // Verify sitio exists
    const [sitioCheck] = await db.execute('SELECT id FROM sitios WHERE id = ?', [sitio_id]);
    if (sitioCheck.length === 0) {
      return res.status(400).json({ error: 'Invalid sitio_id - sitio does not exist' });
    }

    const [result] = await db.execute(`
      INSERT INTO residents (
        first_name, last_name, middle_name, dob, age, gender, address, sitio_id,
        mobile_number, employment_status, income_estimate,
        is_senior, is_pwd, is_single_parent, is_4ps, voter_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      first_name, last_name, middle_name, dob, age, gender, address, sitio_id,
      mobile_number, employment_status, income_estimate,
      is_senior || false, is_pwd || false, is_single_parent || false, is_4ps || false, voter_status
    ]);

    res.status(201).json({ id: result.insertId, message: 'Resident created successfully' });
  } catch (error) {
    console.error('Error creating resident:', error);
    res.status(500).json({ error: 'Failed to create resident' });
  }
});

// Update resident
app.put('/api/residents/:id', async (req, res) => {
  try {
    const {
      first_name, last_name, middle_name, age, gender, sitio_id,
      is_senior, is_pwd, is_single_parent, employment_status, monthly_income,
      contact_number, address, date_of_birth
    } = req.body;

    await db.execute(`
      UPDATE residents SET
        first_name = ?, last_name = ?, middle_name = ?, age = ?, gender = ?, sitio_id = ?,
        is_senior = ?, is_pwd = ?, is_single_parent = ?, employment_status = ?, monthly_income = ?,
        contact_number = ?, address = ?, date_of_birth = ?
      WHERE id = ?
    `, [
      first_name, last_name, middle_name, age, gender, sitio_id,
      is_senior, is_pwd, is_single_parent, employment_status, monthly_income,
      contact_number, address, date_of_birth, req.params.id
    ]);

    res.json({ message: 'Resident updated successfully' });
  } catch (error) {
    console.error('Error updating resident:', error);
    res.status(500).json({ error: 'Failed to update resident' });
  }
});

// Delete resident (hard delete since no is_active column)
app.delete('/api/residents/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM residents WHERE id = ?', [req.params.id]);
    res.json({ message: 'Resident deleted successfully' });
  } catch (error) {
    console.error('Error deleting resident:', error);
    res.status(500).json({ error: 'Failed to delete resident' });
  }
});

// Get census statistics
app.get('/api/census', async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT
        s.name as sitio_name,
        COUNT(r.id) as total_residents,
        SUM(CASE WHEN r.is_senior = 1 THEN 1 ELSE 0 END) as seniors,
        SUM(CASE WHEN r.is_pwd = 1 THEN 1 ELSE 0 END) as pwd,
        SUM(CASE WHEN r.is_single_parent = 1 THEN 1 ELSE 0 END) as single_parents
      FROM sitios s
      LEFT JOIN residents r ON s.id = r.sitio_id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    const [overall] = await db.execute(`
      SELECT
        COUNT(*) as total_residents,
        SUM(CASE WHEN is_senior = 1 THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN is_pwd = 1 THEN 1 ELSE 0 END) as total_pwd,
        SUM(CASE WHEN is_single_parent = 1 THEN 1 ELSE 0 END) as total_single_parents
      FROM residents
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
        COUNT(r.id) as total_residents,
        SUM(CASE WHEN r.gender = 'Male' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN r.gender = 'Female' THEN 1 ELSE 0 END) as total_women,
        SUM(CASE WHEN r.is_senior = 1 THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN r.is_pwd = 1 THEN 1 ELSE 0 END) as total_pwds,
        SUM(CASE WHEN r.is_single_parent = 1 THEN 1 ELSE 0 END) as total_single_parents
      FROM sitios s
      LEFT JOIN residents r ON s.id = r.sitio_id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    const [overall] = await db.execute(`
      SELECT
        COUNT(*) as total_residents,
        SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) as total_women,
        SUM(CASE WHEN is_senior = 1 THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN is_pwd = 1 THEN 1 ELSE 0 END) as total_pwds,
        SUM(CASE WHEN is_single_parent = 1 THEN 1 ELSE 0 END) as total_single_parents
      FROM residents
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
      SELECT b.*, s.name as sitio_name, r.first_name, r.last_name
      FROM blotter b
      LEFT JOIN sitios s ON b.sitio_id = s.id
      LEFT JOIN residents r ON b.respondent_id = r.id
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching blotter:', error);
    res.status(500).json({ error: 'Failed to fetch blotter records' });
  }
});

// Create new blotter record
app.post('/api/blotter', async (req, res) => {
  try {
    const {
      complainant_id, respondent_id, respondent_name, incident_type,
      incident_date, incident_time, location, sitio_id, description, 
      status, severity, recorded_by
    } = req.body;

    // Get complainant name if ID provided
    let complainant_name = null;
    if (complainant_id) {
      const [complainant] = await db.execute(
        'SELECT CONCAT(first_name, " ", last_name) as name FROM residents WHERE id = ?',
        [complainant_id]
      );
      complainant_name = complainant[0]?.name || 'Unknown';
    }

    // Generate case number
    const caseNumber = `BLT-${Date.now()}`;

    const [result] = await db.execute(`
      INSERT INTO blotter (
        case_number, complainant_id, complainant_name, respondent_id, respondent_name, 
        incident_type, incident_date, incident_time, location, sitio_id, 
        description, status, severity, recorded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      caseNumber, complainant_id, complainant_name, respondent_id, respondent_name,
      incident_type, incident_date, incident_time, location, sitio_id,
      description, status || 'Pending', severity || 'minor', recorded_by || 1
    ]);

    res.status(201).json({ id: result.insertId, case_number: caseNumber, message: 'Blotter record created successfully' });
  } catch (error) {
    console.error('Error creating blotter record:', error);
    res.status(500).json({ error: 'Failed to create blotter record' });
  }
});

// Update blotter record
app.put('/api/blotter/:id', async (req, res) => {
  try {
    const {
      complainant_id, respondent_id, respondent_name, incident_type,
      incident_date, incident_time, location, sitio_id, description,
      status, severity, resolution, resolved_date, resolved_by
    } = req.body;

    // Get complainant name if ID provided
    let complainant_name = null;
    if (complainant_id) {
      const [complainant] = await db.execute(
        'SELECT CONCAT(first_name, " ", last_name) as name FROM residents WHERE id = ?',
        [complainant_id]
      );
      complainant_name = complainant[0]?.name || 'Unknown';
    }

    await db.execute(`
      UPDATE blotter SET
        complainant_id = ?, complainant_name = ?, respondent_id = ?, respondent_name = ?,
        incident_type = ?, incident_date = ?, incident_time = ?, location = ?, sitio_id = ?,
        description = ?, status = ?, severity = ?, resolution = ?, resolved_date = ?, resolved_by = ?
      WHERE id = ?
    `, [
      complainant_id, complainant_name, respondent_id, respondent_name,
      incident_type, incident_date, incident_time, location, sitio_id,
      description, status, severity, resolution, resolved_date, resolved_by,
      req.params.id
    ]);

    res.json({ message: 'Blotter record updated successfully' });
  } catch (error) {
    console.error('Error updating blotter record:', error);
    res.status(500).json({ error: 'Failed to update blotter record' });
  }
});

// Delete blotter record
app.delete('/api/blotter/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM blotter WHERE id = ?', [req.params.id]);
    res.json({ message: 'Blotter record deleted successfully' });
  } catch (error) {
    console.error('Error deleting blotter record:', error);
    res.status(500).json({ error: 'Failed to delete blotter record' });
  }
});

// ==========================================
// CERTIFICATE ISSUANCE MODULE
// ==========================================

// Get certificate types
app.get('/api/certificate-types', async (req, res) => {
  try {
    const certificateTypes = [
      {
        id: 1,
        name: 'Barangay Indigency',
        fee: 0,
        validity_days: 90,
        description: 'Proving a resident has no or limited income.',
        purpose: 'To qualify the resident for financial discount',
        when_needed: 'For assistance',
        required_data: [
          'Full Name of Applicant',
          'Complete Address',
          'Categorical Statement',
          'Specific Purpose',
          'Date of Issuance and Validity',
          'Signature of Barangay Captain and Secretary'
        ]
      },
      {
        id: 2,
        name: 'Barangay Residency',
        fee: 30,
        validity_days: 180,
        description: 'Certifies an individual\'s residence within the barangay',
        purpose: 'Confirms that an individual is a resident of the barangay.',
        when_needed: 'Applying for government ID, Business permit, License',
        required_data: [
          'Full name of the resident.',
          'Address within the barangay.',
          'Period of residency (start date and up to present).',
          'Purpose for which the certificate is issued.',
          'Date of issuance and signature of the Barangay Captain and Secretary',
          'Barangay seal and control number.'
        ]
      },
      {
        id: 3,
        name: 'Barangay Certification',
        fee: 25,
        validity_days: 180,
        description: 'Specific information of individuals',
        purpose: 'Proof or Residency, Legal Administrative Confirmation',
        when_needed: 'Applying for government ID, Business permit',
        required_data: [
          'Full name of individual',
          'Complete address',
          'Date of residency or length of stay.',
          'Purpose of the certification',
          'Date of issuance of the certificate.',
          'Signature of the Punong Barangay or authorized official.',
          'Barangay seal or stamp to authenticate the document.'
        ]
      },
      {
        id: 4,
        name: 'Barangay Clearance',
        fee: 50,
        validity_days: 365,
        description: 'Proves you have no issue or file complaint',
        purpose: 'Certify a person is law-abiding resident',
        when_needed: 'Apply for other clearances / job',
        required_data: [
          'Valid ID',
          'Proof of Residency',
          'CEDULA',
          'Purpose',
          'Payment',
          'Personal Information (Name, Date of Birth, Address, Contact Number, Length of stay in barangay)',
          'Signature of Barangay Captain and Secretary'
        ]
      },
      {
        id: 5,
        name: 'Business Clearance',
        fee: 100,
        validity_days: 365,
        description: 'Business allowed to operate in the barangay',
        purpose: 'Verify Business is legitimate and follow the barangay regulation',
        when_needed: 'Register or Renew your Business',
        required_data: [
          'Business Name',
          'Business Address',
          'Name of Owner',
          'Type of Business',
          'Valid ID of Owner',
          'Barangay Residency',
          'CEDULA',
          'Payment',
          'Signature of Barangay Captain and Secretary'
        ]
      },
      {
        id: 6,
        name: 'Oath of Undertaking',
        fee: 25,
        validity_days: 180,
        description: 'Individual promises to follow certain rules and responsibility',
        purpose: 'Show a person\'s commitment to comply with rules, serves as a supporting document for the legal process.',
        when_needed: 'Need to promise compliance with government requirements, Register for certain ID\'s',
        required_data: [
          'Full Name of the Person',
          'Address',
          'Statement of the promise/undertaking',
          'Date signed',
          'Signature of the applicant',
          'Signature and Seal of the official administering the oath'
        ]
      },
      {
        id: 7,
        name: 'Good Moral',
        fee: 25,
        validity_days: 180,
        description: 'A person has good behavior, no major issues and conduct themselves properly',
        purpose: 'Prove a person that has good character, Support Application',
        when_needed: 'Enroll or Transfer in School, Apply for Scholarship or Job',
        required_data: [
          'Full Name of the Person',
          'Date of Birth',
          'Address',
          'School year or Purpose',
          'Name of barangay/school issuing the certificate',
          'Statement confirming good moral character',
          'Signature of the issuing officer',
          'Date Issued'
        ]
      },
      {
        id: 8,
        name: 'Low Income Certificate',
        fee: 0,
        validity_days: 90,
        description: 'Certifies a person or family belongs to the low-income sector',
        purpose: 'Prove a person or family has limited financial resources, Eligibility for discounts, social services, qualify for medical assistance',
        when_needed: 'Applying scholarship, Applying for government assistance programs, Processing social welfare documents',
        required_data: [
          'Full Name of Applicant',
          'Address / Proof of Residency',
          'Valid ID',
          'Household Information (Number of Family Member)',
          'Source of Income',
          'Estimate Monthly Income',
          'Purpose of the Certificate',
          'Date of Issuance',
          'Signature of Barangay Captain and Secretary'
        ]
      },
      {
        id: 9,
        name: 'Birth Certificate',
        fee: 50,
        validity_days: 0, // Permanent
        description: 'Local Civil Registry that records a person\'s birth details',
        purpose: 'Prove\'s a person identity, age, citizenship / Support Legal Transaction / Serves as a requirements',
        when_needed: 'Enrollment, Applying Government ID / Employment, Processing Marriage/Divorce',
        required_data: [
          'Full Name of the Child',
          'Date and place of Birth',
          'Sex/Gender',
          'Full Name of Parents',
          'Nationality of Parents',
          'Occupation of Parents',
          'Address of parents at the time of birth',
          'Registration Number / PSA Serial Number',
          'Date of Registration',
          'Signature of the Civil Registrar',
          'Barangay Seal'
        ]
      }
    ];
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
      SELECT c.*, CONCAT(r.first_name, ' ', r.last_name) as resident_name
      FROM certificates_log c
      JOIN residents r ON c.resident_id = r.id
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
    const [residentCheck] = await connection.execute('SELECT id FROM residents WHERE id = ?', [resident_id]);
    if (residentCheck.length === 0) {
      return res.status(400).json({ error: 'Resident not found' });
    }

    // Get certificate type name - Updated with all 9 types
    const certificateTypes = [
      { id: 1, name: 'Barangay Indigency' },
      { id: 2, name: 'Barangay Residency' },
      { id: 3, name: 'Barangay Certification' },
      { id: 4, name: 'Barangay Clearance' },
      { id: 5, name: 'Business Clearance' },
      { id: 6, name: 'Oath of Undertaking' },
      { id: 7, name: 'Good Moral' },
      { id: 8, name: 'Low Income Certificate' },
      { id: 9, name: 'Birth Certificate' }
    ];

    const certType = certificateTypes.find(ct => ct.id === certificate_type_id);
    if (!certType) {
      return res.status(400).json({ error: 'Invalid certificate type' });
    }

    const certificate_type = certType.name;

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
    const [residents] = await db.execute('SELECT * FROM residents WHERE id = ?', [resident_id]);
    if (residents.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    const resident = residents[0];

    // Call AI service
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/suggest-aid`, {
      income_estimate: resident.income_estimate,
      is_senior: resident.is_senior,
      is_pwd: resident.is_pwd,
      is_single_parent: resident.is_single_parent,
      employment_status: resident.employment_status
    });

    res.json({
      resident_id,
      resident_name: `${resident.first_name} ${resident.last_name}`,
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
    const [residents] = await db.execute('SELECT * FROM residents WHERE id = ?', [resident_id]);
    if (residents.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    const resident = residents[0];
    let fallback = false;

    try {
      // Try AI service first
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:5000'}/suggest-aid`, {
        monthly_income: resident.monthly_income || resident.income_estimate || 0,
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
      const income = resident.monthly_income || resident.income_estimate || 0;
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
    // Get recent blotter data (last 7 days)
    const [blotterData] = await db.execute(`
      SELECT b.*, s.name as sitio_name
      FROM blotter b
      LEFT JOIN sitios s ON b.sitio_id = s.id
      WHERE b.date_filed >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY b.date_filed DESC
    `);

    // Call AI service
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/suggest-patrol`, {
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
      'UPDATE residents SET qr_code_string = ? WHERE id = ?',
      [qrString, residentId]
    );

    // Get updated resident data
    const [residents] = await db.execute(`
      SELECT r.*, s.name as sitio_name
      FROM residents r
      LEFT JOIN sitios s ON r.sitio_id = s.id
      WHERE r.id = ?
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
             CONCAT(r.first_name, ' ', r.last_name) as resident_name,
             r.mobile_number as contact_number,
             s.name as sitio_name
      FROM certificates_log c
      JOIN residents r ON c.resident_id = r.id
      LEFT JOIN sitios s ON r.sitio_id = s.id
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
        'SELECT mobile_number FROM residents WHERE id = ?',
        [resident_id]
      );
      if (residents.length > 0 && residents[0].mobile_number) {
        targetMobile = residents[0].mobile_number;
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
      SELECT id, mobile_number, CONCAT(first_name, ' ', last_name) as name
      FROM residents
      WHERE sitio_id = ?
      AND mobile_number IS NOT NULL
      AND mobile_number != ''
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
