const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_management',
  port: process.env.DB_PORT || 3306
};

async function runMigrations() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('🚀 Running Database Migrations...\n');

    // Create roles table if not exists
    console.log('📝 Creating roles table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        permissions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default roles
    await connection.execute(`
      INSERT IGNORE INTO roles (id, name, description) VALUES
      (2, 'Captain', 'Barangay Captain'),
      (3, 'Secretary', 'Barangay Secretary'),
      (4, 'Clerk', 'Barangay Clerk'),
      (5, 'Admin', 'System Administrator'),
      (6, 'Blotter Officer', 'Blotter Officer'),
      (12, 'Resident', 'Barangay Resident')
    `);
    console.log('✅ Roles table created and populated');

    // Create document_requests table if not exists
    console.log('📝 Creating document_requests table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS document_requests (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Document requests table created');

    // Create login_attempts table if not exists
    console.log('📝 Creating login_attempts table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100),
        ip_address VARCHAR(45),
        success BOOLEAN DEFAULT FALSE,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT
      )
    `);
    console.log('✅ Login attempts table created');

    // Create notifications table if not exists
    console.log('📝 Creating notifications table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
        read_status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Notifications table created');

    // Add indexes for performance
    console.log('📊 Adding performance indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_residents_name ON residents(First_Name, Last_Name)',
      'CREATE INDEX IF NOT EXISTS idx_residents_status ON residents(Residency_Status)',
      'CREATE INDEX IF NOT EXISTS idx_blotter_status ON blotter(Status)',
      'CREATE INDEX IF NOT EXISTS idx_blotter_incident_type ON blotter(Incident_Type)',
      'CREATE INDEX IF NOT EXISTS idx_certificates_resident ON certificates_log(resident_id)',
      'CREATE INDEX IF NOT EXISTS idx_certificates_date ON certificates_log(date_issued)',
      'CREATE INDEX IF NOT EXISTS idx_document_requests_resident ON document_requests(resident_id)',
      'CREATE INDEX IF NOT EXISTS idx_document_requests_status ON document_requests(status)',
      'CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username)',
      'CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)'
    ];

    for (const indexQuery of indexes) {
      try {
        await connection.execute(indexQuery);
        console.log(`  ✅ ${indexQuery.split(' ON ')[1]}`);
      } catch (error) {
        if (!error.message.includes('Duplicate key name')) {
          console.log(`  ⚠️  ${indexQuery.split(' ON ')[1]} - ${error.message}`);
        }
      }
    }

    // Add foreign key constraints (if tables exist)
    console.log('🔗 Adding foreign key constraints...');
    
    const foreignKeys = [
      {
        table: 'document_requests',
        constraint: 'fk_document_requests_resident',
        sql: 'ALTER TABLE document_requests ADD CONSTRAINT fk_document_requests_resident FOREIGN KEY (resident_id) REFERENCES residents(Resident_ID) ON DELETE CASCADE'
      },
      {
        table: 'notifications',
        constraint: 'fk_notifications_user',
        sql: 'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
      }
    ];

    for (const fk of foreignKeys) {
      try {
        await connection.execute(fk.sql);
        console.log(`  ✅ ${fk.constraint}`);
      } catch (error) {
        if (!error.message.includes('Duplicate foreign key constraint')) {
          console.log(`  ⚠️  ${fk.constraint} - ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Database migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migrations
runMigrations();