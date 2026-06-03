const mysql = require('mysql2/promise');
require('dotenv').config();
const { allocateBlotterCaseNumber } = require('./utils/blotterCaseNumber');
const { getDatabaseConfig } = require('./config/env');

const pool = mysql.createPool({
  ...getDatabaseConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Database helper methods
const db = {
  // Direct pool access
  pool: pool,
  
  // Get connection from pool
  getConnection: () => pool.getConnection(),
  
  // Execute query
  execute: (sql, params) => pool.execute(sql, params),

  // Close pool (for testing)
  end: () => pool.end()
};

// Get all residents with sitio information (OPTIMIZED)
async function getResidents() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT r.*, h.Household_Number, s.name as sitio_name,
             v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent, v.Is_Out_of_School_Youth,
             v.Vulnerability_Score
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Residency_Status = 'Active'
      ORDER BY r.Last_Name, r.First_Name
    `);
    return rows;
  } finally {
    connection.release();
  }
}

// Get all blotter records with resident names
async function getBlotterRecords() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT
        b.*,
        s.name as sitio_name
      FROM blotter b
      LEFT JOIN sitios s ON b.Location_Sitio = s.name
      ORDER BY b.DateTime_Incident DESC
    `);
    return rows;
  } finally {
    connection.release();
  }
}

// Get all certificate types
async function getCertificateTypes() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT * FROM certificate_types WHERE is_active = TRUE ORDER BY name
    `);
    return rows;
  } finally {
    connection.release();
  }
}

// Get certificates with resident and type information
async function getCertificates() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT
        c.*,
        CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
      FROM certificates_log c
      LEFT JOIN residents r ON c.resident_id = r.Resident_ID
      ORDER BY c.date_issued DESC
    `);
    return rows;
  } finally {
    connection.release();
  }
}

// Check if resident has active blotter cases (UPDATED for new status enum)
async function checkBlotterStatus(residentId) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT
        COUNT(*) as active_cases,
        GROUP_CONCAT(Case_Number SEPARATOR ', ') as case_numbers,
        GROUP_CONCAT(Incident_Type SEPARATOR ', ') as incident_types
      FROM blotter
      WHERE (JSON_EXTRACT(Complainant_Details, '$.id') = ? OR JSON_EXTRACT(Respondent_Details, '$.id') = ?)
      AND Status IN ('Pending', 'Scheduled for Mediation')
      AND Incident_Type IN ('Physical Injury', 'Unjust Vexation', 'Grave Threats', 'Malicious Mischief', 'Theft (Petty)', 'Estafa (Swindling)')
    `, [residentId, residentId]);
    return {
      hasActiveCases: rows[0].active_cases > 0,
      caseCount: rows[0].active_cases,
      caseNumbers: rows[0].case_numbers,
      incidentTypes: rows[0].incident_types
    };
  } finally {
    connection.release();
  }
}

// Get dashboard statistics
async function getDashboardStats() {
  const connection = await pool.getConnection();
  try {
    const [residents] = await connection.execute('SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"');
    const [certificates] = await connection.execute('SELECT COUNT(*) as total FROM certificates_log WHERE status = "Released"');
    const [activeBlotters] = await connection.execute('SELECT COUNT(*) as total FROM blotter WHERE Status IN ("Pending", "Scheduled for Mediation")');
    const [sitios] = await connection.execute('SELECT COUNT(*) as total FROM sitios');

    return {
      totalResidents: residents[0].total,
      totalCertificates: certificates[0].total,
      activeBlotters: activeBlotters[0].total,
      totalSitios: sitios[0].total
    };
  } finally {
    connection.release();
  }
}

// Create a new certificate
async function createCertificate(certificateData) {
  const connection = await pool.getConnection();
  try {
    const {
      resident_id,
      certificate_type,
      purpose,
      issued_by,
      status,
      fee_amount
    } = certificateData;

    const control_no = `CERT-${Date.now()}`;
    const date_issued = new Date();

    const [result] = await connection.execute(`
      INSERT INTO certificates_log (
        control_no,
        resident_id,
        certificate_type,
        purpose,
        date_issued,
        status,
        fee_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      control_no,
      resident_id,
      certificate_type,
      purpose,
      date_issued,
      status,
      fee_amount
    ]);

    const [rows] = await connection.execute('SELECT * FROM certificates_log WHERE control_no = ?', [control_no]);
    return rows[0];
  } finally {
    connection.release();
  }
}

// Create a new blotter record
async function createBlotterRecord(blotterData) {
  const connection = await pool.getConnection();
  try {
    const {
      complainant_details,
      respondent_details,
      incident_type,
      incident_date,
      incident_time,
      location_sitio,
      narrative,
      status,
      recorded_by
    } = blotterData;

    const case_number = await allocateBlotterCaseNumber(db, { incidentDate: `${incident_date} ${incident_time}` });

    const [result] = await connection.execute(`
      INSERT INTO blotter (
        Case_Number, Complainant_Details, Respondent_Details,
        Incident_Type, DateTime_Incident, Location_Sitio,
        Narrative, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      case_number,
      JSON.stringify(complainant_details),
      JSON.stringify(respondent_details || {}),
      incident_type,
      `${incident_date} ${incident_time}`,
      location_sitio,
      narrative,
      status
    ]);

    const [rows] = await connection.execute('SELECT * FROM blotter WHERE Case_Number = ?', [case_number]);
    return rows[0];
  } finally {
    connection.release();
  }
}

// Update blotter record
async function updateBlotterRecord(caseNumber, updates) {
  const connection = await pool.getConnection();
  try {
    const allowedFields = ['Status', 'Hearing_Schedule'];
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

    values.push(caseNumber);
    await connection.execute(
      `UPDATE blotter SET ${updateFields.join(', ')} WHERE Case_Number = ?`,
      values
    );

    const [rows] = await connection.execute('SELECT * FROM blotter WHERE Case_Number = ?', [caseNumber]);
    return rows[0];
  } finally {
    connection.release();
  }
}

// Delete blotter record
async function deleteBlotterRecord(caseNumber) {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM blotter WHERE Case_Number = ?', [caseNumber]);
    return { success: true, message: 'Blotter record deleted' };
  } finally {
    connection.release();
  }
}

// Get census statistics by sitio
async function getCensusStatistics() {
  const connection = await pool.getConnection();
  try {
    const [stats] = await connection.execute(`
      SELECT
        s.id as sitio_id,
        s.name as sitio_name,
        COUNT(r.Resident_ID) as total_residents,
        SUM(CASE WHEN r.Gender = 'Male' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN r.Gender = 'Female' THEN 1 ELSE 0 END) as total_women,
        SUM(CASE WHEN v.Is_Senior = TRUE THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN v.Is_PWD = TRUE THEN 1 ELSE 0 END) as total_pwds,
        SUM(CASE WHEN v.Is_Solo_Parent = TRUE THEN 1 ELSE 0 END) as total_single_parents,
        SUM(CASE WHEN v.Is_4Ps = TRUE THEN 1 ELSE 0 END) as total_4ps,
        SUM(CASE WHEN r.Voter_Status = 'Registered' THEN 1 ELSE 0 END) as total_voters
      FROM sitios s
      LEFT JOIN households h ON s.id = h.Sitio_ID
      LEFT JOIN residents r ON h.Household_ID = r.Household_ID AND r.Residency_Status = 'Active'
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    const [totals] = await connection.execute(`
      SELECT
        COUNT(*) as total_residents,
        SUM(CASE WHEN Gender = 'Male' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN Gender = 'Female' THEN 1 ELSE 0 END) as total_women,
        SUM(CASE WHEN Voter_Status = 'Registered' THEN 1 ELSE 0 END) as total_voters
      FROM residents
      WHERE Residency_Status = 'Active'
    `);

    const [vulnerabilities] = await connection.execute(`
      SELECT
        SUM(CASE WHEN Is_Senior = TRUE THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN Is_PWD = TRUE THEN 1 ELSE 0 END) as total_pwds,
        SUM(CASE WHEN Is_Solo_Parent = TRUE THEN 1 ELSE 0 END) as total_single_parents,
        SUM(CASE WHEN Is_4Ps = TRUE THEN 1 ELSE 0 END) as total_4ps
      FROM vulnerabilities
    `);

    return {
      bySitio: stats,
      overall: { ...totals[0], ...vulnerabilities[0] }
    };
  } finally {
    connection.release();
  }
}

// Get census statistics for specific sitio
async function getSitioCensus(sitioId) {
  const connection = await pool.getConnection();
  try {
    const [stats] = await connection.execute(`
      SELECT
        s.id as sitio_id,
        s.name as sitio_name,
        COUNT(r.Resident_ID) as total_residents,
        SUM(CASE WHEN r.Gender = 'Male' THEN 1 ELSE 0 END) as total_men,
        SUM(CASE WHEN r.Gender = 'Female' THEN 1 ELSE 0 END) as total_women,
        SUM(CASE WHEN v.Is_Senior = TRUE THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN v.Is_PWD = TRUE THEN 1 ELSE 0 END) as total_pwds,
        SUM(CASE WHEN v.Is_Solo_Parent = TRUE THEN 1 ELSE 0 END) as total_single_parents,
        SUM(CASE WHEN v.Is_4Ps = TRUE THEN 1 ELSE 0 END) as total_4ps,
        SUM(CASE WHEN r.Voter_Status = 'Registered' THEN 1 ELSE 0 END) as total_voters
      FROM sitios s
      LEFT JOIN households h ON s.id = h.Sitio_ID
      LEFT JOIN residents r ON h.Household_ID = r.Household_ID AND r.Residency_Status = 'Active'
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE s.id = ?
      GROUP BY s.id, s.name
    `, [sitioId]);

    return stats[0] || null;
  } finally {
    connection.release();
  }
}

db.getResidents = getResidents;
db.getBlotterRecords = getBlotterRecords;
db.getCertificateTypes = getCertificateTypes;
db.getCertificates = getCertificates;
db.checkBlotterStatus = checkBlotterStatus;
db.getDashboardStats = getDashboardStats;
db.createCertificate = createCertificate;
db.createBlotterRecord = createBlotterRecord;
db.updateBlotterRecord = updateBlotterRecord;
db.deleteBlotterRecord = deleteBlotterRecord;
db.getCensusStatistics = getCensusStatistics;
db.getSitioCensus = getSitioCensus;

module.exports = db;
