// Database configuration for Barangay Management System
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'barangay_batia',
  port: 3306,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database connection function
async function connectDB() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// Execute query function
async function executeQuery(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

// Get database statistics
async function getDatabaseStats() {
  try {
    const stats = {};
    
    // Get total residents
    const [residents] = await pool.execute('SELECT COUNT(*) as total FROM residents WHERE is_active = TRUE');
    stats.totalResidents = residents[0].total;
    
    // Get residents by sitio
    const [sitioStats] = await pool.execute(`
      SELECT s.name, COUNT(r.id) as resident_count 
      FROM sitios s 
      LEFT JOIN residents r ON s.id = r.sitio_id AND r.is_active = TRUE 
      GROUP BY s.id, s.name
    `);
    stats.residentsBySitio = sitioStats;
    
    // Get certificate statistics
    const [certStats] = await pool.execute(`
      SELECT ct.name, COUNT(c.id) as issued_count 
      FROM certificate_types ct 
      LEFT JOIN certificates c ON ct.id = c.certificate_type_id AND c.status = 'approved'
      GROUP BY ct.id, ct.name
    `);
    stats.certificateStats = certStats;
    
    // Get blotter statistics
    const [blotterStats] = await pool.execute(`
      SELECT status, COUNT(*) as count 
      FROM blotter_records 
      GROUP BY status
    `);
    stats.blotterStats = blotterStats;
    
    return stats;
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
}

module.exports = {
  pool,
  connectDB,
  executeQuery,
  getDatabaseStats
};