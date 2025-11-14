const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'barangay_batia',
  port: 3306
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

// Check if resident has active blotter cases
async function checkBlotterStatus(residentId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT COUNT(*) as active_cases 
      FROM blotter_records 
      WHERE (complainant_id = ? OR respondent_id = ?) 
      AND status = 'active' 
      AND severity IN ('major', 'critical')
    `, [residentId, residentId]);
    return rows[0].active_cases > 0;
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
    const [activeBlotters] = await connection.execute('SELECT COUNT(*) as total FROM blotter_records WHERE status = "active"');
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
        fee_paid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      certificate_number,
      resident_id,
      certificate_type_id,
      purpose,
      JSON.stringify(data),
      issued_by,
      status,
      issue_date,
      fee_paid
    ]);

    const [rows] = await connection.execute('SELECT * FROM certificates WHERE id = ?', [result.insertId]);
    return rows[0];
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
  createCertificate
};