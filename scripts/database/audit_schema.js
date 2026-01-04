const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_management',
  port: process.env.DB_PORT || 3306
};

async function auditDatabaseSchema() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('🔍 Database Schema Audit Report');
    console.log('================================\n');

    // Check for required tables
    const requiredTables = [
      'users', 'residents', 'households', 'sitios', 'vulnerabilities',
      'blotter', 'certificates_log', 'certificate_types', 'document_requests',
      'roles', 'login_attempts', 'notifications'
    ];

    console.log('📋 Table Existence Check:');
    const [tables] = await connection.execute('SHOW TABLES');
    const existingTables = tables.map(row => Object.values(row)[0]);
    
    const missingTables = [];
    requiredTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
      if (!exists) missingTables.push(table);
    });

    // Check foreign key relationships
    console.log('\n🔗 Foreign Key Relationships:');
    const [fkInfo] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [dbConfig.database]);

    if (fkInfo.length > 0) {
      fkInfo.forEach(fk => {
        console.log(`  ✅ ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('  ❌ No foreign key constraints found');
    }

    // Check indexes
    console.log('\n📊 Index Analysis:');
    for (const table of existingTables) {
      try {
        const [indexes] = await connection.execute(`SHOW INDEX FROM ${table}`);
        const indexCount = indexes.filter(idx => idx.Key_name !== 'PRIMARY').length;
        console.log(`  ${table}: ${indexCount} indexes`);
      } catch (error) {
        console.log(`  ${table}: Error checking indexes`);
      }
    }

    // Generate missing table creation scripts
    if (missingTables.length > 0) {
      console.log('\n🛠️  Missing Table Creation Scripts:');
      console.log('=====================================\n');

      if (missingTables.includes('roles')) {
        console.log('-- Create roles table');
        console.log(`CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (id, name, description) VALUES
(2, 'Captain', 'Barangay Captain'),
(3, 'Secretary', 'Barangay Secretary'),
(4, 'Clerk', 'Barangay Clerk'),
(5, 'Admin', 'System Administrator'),
(6, 'Blotter Officer', 'Blotter Officer'),
(12, 'Resident', 'Barangay Resident');
`);
      }

      if (missingTables.includes('document_requests')) {
        console.log('-- Create document_requests table');
        console.log(`CREATE TABLE document_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id VARCHAR(50) UNIQUE NOT NULL,
  resident_id VARCHAR(50) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  purpose TEXT,
  urgency ENUM('Normal', 'Urgent', 'Emergency') DEFAULT 'Normal',
  additional_info TEXT,
  status ENUM('Pending', 'Processing', 'Ready', 'Released', 'Rejected') DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_resident_id (resident_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
`);
      }

      if (missingTables.includes('login_attempts')) {
        console.log('-- Create login_attempts table');
        console.log(`CREATE TABLE login_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100),
  ip_address VARCHAR(45),
  success BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  INDEX idx_username (username),
  INDEX idx_ip_address (ip_address),
  INDEX idx_attempted_at (attempted_at)
);
`);
      }

      if (missingTables.includes('notifications')) {
        console.log('-- Create notifications table');
        console.log(`CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_read_status (read_status),
  INDEX idx_created_at (created_at)
);
`);
      }
    }

    // Performance recommendations
    console.log('\n⚡ Performance Recommendations:');
    console.log('===============================');
    
    const recommendedIndexes = [
      'CREATE INDEX idx_residents_name ON residents(First_Name, Last_Name);',
      'CREATE INDEX idx_residents_status ON residents(Residency_Status);',
      'CREATE INDEX idx_blotter_status ON blotter(Status);',
      'CREATE INDEX idx_blotter_incident_type ON blotter(Incident_Type);',
      'CREATE INDEX idx_certificates_resident ON certificates_log(resident_id);',
      'CREATE INDEX idx_certificates_date ON certificates_log(date_issued);'
    ];

    recommendedIndexes.forEach(index => {
      console.log(`  ${index}`);
    });

    console.log('\n✅ Database audit completed successfully!');
    
  } catch (error) {
    console.error('❌ Database audit failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the audit
auditDatabaseSchema();