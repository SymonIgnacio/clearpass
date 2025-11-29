const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bmw_barangay_batia',
  port: process.env.DB_PORT || 3306
};

async function getConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// Get all residents with sitio information
async function getResidents() {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT r.*, s.name as sitio_name 
      FROM residents r 
      LEFT JOIN sitios s ON r.sitio_id = s.id 
      WHERE r.is_active = TRUE
      ORDER BY r.last_name, r.first_name
    `);
    return rows;
  } finally {
    await connection.end();
  }
}

// Get all blotter records with resident names
async function getBlotterRecords() {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT 
        br.*,
        CONCAT(complainant.first_name, ' ', complainant.last_name) as complainant_name,
        CONCAT(respondent.first_name, ' ', respondent.last_name) as respondent_name,
        s.name as sitio_name
      FROM blotter_records br
      LEFT JOIN residents complainant ON br.complainant_id = complainant.id
      LEFT JOIN residents respondent ON br.respondent_id = respondent.id
      LEFT JOIN sitios s ON br.sitio_id = s.id
      ORDER BY br.created_at DESC
    `);
    return rows;
  } finally {
    await connection.end();
  }
}

// Get all certificate types
async function getCertificateTypes() {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT * FROM certificate_types WHERE is_active = TRUE ORDER BY name
    `);
    return rows;
  } finally {
    await connection.end();
  }
}

// Get certificates with resident and type information
async function getCertificates() {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT 
        c.*,
        CONCAT(r.first_name, ' ', r.last_name) as resident_name,
        ct.name as certificate_type_name,
        ct.fee as certificate_fee,
        CONCAT(issued_by.first_name, ' ', issued_by.last_name) as issued_by_name
      FROM certificates c
      LEFT JOIN residents r ON c.resident_id = r.id
      LEFT JOIN certificate_types ct ON c.certificate_type_id = ct.id
      LEFT JOIN users issued_by ON c.issued_by = issued_by.id
      ORDER BY c.created_at DESC
    `);
    return rows;
  } finally {
    await connection.end();
  }
}

// Check if resident has active blotter cases (UPDATED for new status enum)
async function checkBlotterStatus(residentId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT 
        COUNT(*) as active_cases,
        GROUP_CONCAT(case_number SEPARATOR ', ') as case_numbers,
        GROUP_CONCAT(incident_type SEPARATOR ', ') as incident_types
      FROM blotter_records 
      WHERE (complainant_id = ? OR respondent_id = ?) 
      AND status IN ('Pending', 'Forwarded to Lupon')
      AND severity IN ('major', 'critical')
    `, [residentId, residentId]);
    return {
      hasActiveCases: rows[0].active_cases > 0,
      caseCount: rows[0].active_cases,
      caseNumbers: rows[0].case_numbers,
      incidentTypes: rows[0].incident_types
    };
  } finally {
    await connection.end();
  }
}

// Get dashboard statistics
async function getDashboardStats() {
  const connection = await getConnection();
  try {
    const [residents] = await connection.execute('SELECT COUNT(*) as total FROM residents WHERE is_active = TRUE');
    const [certificates] = await connection.execute('SELECT COUNT(*) as total FROM certificates WHERE status = "approved"');
    const [activeBlotters] = await connection.execute('SELECT COUNT(*) as total FROM blotter_records WHERE status IN ("Pending", "Forwarded to Lupon")');
    const [sitios] = await connection.execute('SELECT COUNT(*) as total FROM sitios');
    
    return {
      totalResidents: residents[0].total,
      totalCertificates: certificates[0].total,
      activeBlotters: activeBlotters[0].total,
      totalSitios: sitios[0].total
    };
  } finally {
    await connection.end();
  }
}

// Create a new certificate
async function createCertificate(certificateData) {
  const connection = await getConnection();
  try {
    const {
      resident_id,
      certificate_type_id,
      purpose,
      data,
      issued_by,
      status,
      fee_paid
    } = certificateData;

    // Generate a unique certificate number
    const certificate_number = `CERT-${Date.now()}`;
    const issue_date = new Date();

    const blotter_check_date = new Date();

    const [result] = await connection.execute(`
      INSERT INTO certificates (
        certificate_number,
        resident_id,
        certificate_type_id,
        purpose,
        data,
        issued_by,
        status,
        issue_date,
        fee_paid,
        blotter_check_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      certificate_number,
      resident_id,
      certificate_type_id,
      purpose,
      JSON.stringify(data),
      issued_by,
      status,
      issue_date,
      fee_paid,
      blotter_check_date
    ]);

    const [rows] = await connection.execute('SELECT * FROM certificates WHERE id = ?', [result.insertId]);
    return rows[0];
  } finally {
    await connection.end();
  }
}

// Create a new blotter record
async function createBlotterRecord(blotterData) {
  const connection = await getConnection();
  try {
    const {
      complainant_id,
      respondent_id,
      respondent_name,
      incident_type,
      incident_date,
      incident_time,
      location,
      sitio_id,
      description,
      status,
      severity,
      recorded_by
    } = blotterData;

    // Generate unique case number
    const case_number = `BLT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    const [result] = await connection.execute(`
      INSERT INTO blotter_records (
        case_number, complainant_id, respondent_id, respondent_name,
        incident_type, incident_date, incident_time, location, sitio_id,
        description, status, severity, recorded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      case_number, complainant_id, respondent_id, respondent_name,
      incident_type, incident_date, incident_time, location, sitio_id,
      description, status, severity, recorded_by
    ]);

    const [rows] = await connection.execute('SELECT * FROM blotter_records WHERE id = ?', [result.insertId]);
    return rows[0];
  } finally {
    await connection.end();
  }
}

// Update blotter record
async function updateBlotterRecord(id, updates) {
  const connection = await getConnection();
  try {
    const allowedFields = ['status', 'resolution', 'resolved_date', 'resolved_by', 'incident_type', 'description', 'severity'];
    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    await connection.execute(
      `UPDATE blotter_records SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    const [rows] = await connection.execute('SELECT * FROM blotter_records WHERE id = ?', [id]);
    return rows[0];
  } finally {
    await connection.end();
  }
}

// Delete blotter record
async function deleteBlotterRecord(id) {
  const connection = await getConnection();
  try {
    await connection.execute('DELETE FROM blotter_records WHERE id = ?', [id]);
    return { success: true, message: 'Blotter record deleted' };
  } finally {
    await connection.end();
  }
}

// Get census statistics by sitio
async function getCensusStatistics() {
  const connection = await getConnection();
  try {
    const [stats] = await connection.execute(`
      SELECT 
        s.id as sitio_id,
        s.name as sitio_name,
        COUNT(r.id) as total_residents,
        SUM(CASE WHEN r.gender = 'Male' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN r.gender = 'Female' THEN 1 ELSE 0 END) as total_women,
        SUM(CASE WHEN r.is_senior = TRUE THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN r.is_pwd = TRUE THEN 1 ELSE 0 END) as total_pwds,
        SUM(CASE WHEN r.is_single_parent = TRUE THEN 1 ELSE 0 END) as total_single_parents,
        SUM(CASE WHEN r.is_4ps = TRUE THEN 1 ELSE 0 END) as total_4ps,
        SUM(CASE WHEN r.is_voter = TRUE THEN 1 ELSE 0 END) as total_voters
      FROM sitios s
      LEFT JOIN residents r ON s.id = r.sitio_id AND r.is_active = TRUE
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);
    
    // Get overall totals
    const [totals] = await connection.execute(`
      SELECT 
        COUNT(*) as total_residents,
        SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) as total_women,
        SUM(CASE WHEN is_senior = TRUE THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN is_pwd = TRUE THEN 1 ELSE 0 END) as total_pwds,
        SUM(CASE WHEN is_single_parent = TRUE THEN 1 ELSE 0 END) as total_single_parents,
        SUM(CASE WHEN is_4ps = TRUE THEN 1 ELSE 0 END) as total_4ps,
        SUM(CASE WHEN is_voter = TRUE THEN 1 ELSE 0 END) as total_voters
      FROM residents 
      WHERE is_active = TRUE
    `);

    return {
      bySitio: stats,
      overall: totals[0]
    };
  } finally {
    await connection.end();
  }
}

// Get census statistics for specific sitio
async function getSitioCensus(sitioId) {
  const connection = await getConnection();
  try {
    const [stats] = await connection.execute(`
      SELECT 
        s.id as sitio_id,
        s.name as sitio_name,
        COUNT(r.id) as total_residents,
        SUM(CASE WHEN r.gender = 'Male' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN r.gender = 'Female' THEN 1 ELSE 0 END) as total_women,
        SUM(CASE WHEN r.is_senior = TRUE THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN r.is_pwd = TRUE THEN 1 ELSE 0 END) as total_pwds,
        SUM(CASE WHEN r.is_single_parent = TRUE THEN 1 ELSE 0 END) as total_single_parents,
        SUM(CASE WHEN r.is_4ps = TRUE THEN 1 ELSE 0 END) as total_4ps,
        SUM(CASE WHEN r.is_voter = TRUE THEN 1 ELSE 0 END) as total_voters
      FROM sitios s
      LEFT JOIN residents r ON s.id = r.sitio_id AND r.is_active = TRUE
      WHERE s.id = ?
      GROUP BY s.id, s.name
    `, [sitioId]);

    return stats[0] || null;
  } finally {
    await connection.end();
  }
}

module.exports = {
  getResidents,
  getBlotterRecords,
  getCertificateTypes,
  getCertificates,
  checkBlotterStatus,
  getDashboardStats,
  createCertificate,
  createBlotterRecord,
  updateBlotterRecord,
  deleteBlotterRecord,
  getCensusStatistics,
  getSitioCensus
};
