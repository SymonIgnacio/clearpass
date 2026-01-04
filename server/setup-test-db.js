const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestDatabase() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    // Create test database
    await connection.query('CREATE DATABASE IF NOT EXISTS barangay_management_test');
    console.log('Test database created successfully');

    // Close and reconnect to the test database
    await connection.end();
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'barangay_management_test',
      port: process.env.DB_PORT || 3306
    });

    // Create basic tables for testing
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        full_name VARCHAR(100),
        role_id INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_name VARCHAR(50) NOT NULL,
        hierarchy_level INT DEFAULT 1,
        permissions JSON
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS residents (
        Resident_ID INT PRIMARY KEY AUTO_INCREMENT,
        First_Name VARCHAR(50) NOT NULL,
        Last_Name VARCHAR(50) NOT NULL,
        Gender ENUM('Male', 'Female') NOT NULL,
        Birthdate DATE,
        Mobile_Number VARCHAR(15),
        Residency_Status ENUM('Active', 'Inactive') DEFAULT 'Active',
        Household_ID INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert test roles
    await connection.query(`
      INSERT IGNORE INTO roles (id, role_name, hierarchy_level) VALUES
      (1, 'resident', 1),
      (2, 'clerk', 2),
      (3, 'secretary', 3),
      (4, 'captain', 4),
      (5, 'admin', 5)
    `);

    // Insert test user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.query(`
      INSERT IGNORE INTO users (username, password_hash, role_id, full_name) 
      VALUES ('admin', ?, 5, 'Test Admin')
    `, [hashedPassword]);

    console.log('Test database setup completed');
  } catch (error) {
    console.error('Error setting up test database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  createTestDatabase();
}

module.exports = createTestDatabase;