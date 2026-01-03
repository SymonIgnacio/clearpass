#!/usr/bin/env node

require('dotenv').config({ path: '../../../server/.env' });
const mysql = require('mysql2/promise');

async function fixTableSchema() {
  let connection;

  try {
    console.log('🔧 Connecting to database...');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barangay_management'
    });

    console.log('✅ Connected to database');

    // Check if the table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'resident_verification_requests'"
    );

    if (tables.length === 0) {
      console.log('❌ Table resident_verification_requests does not exist. Creating...');

      await connection.execute(`
        CREATE TABLE resident_verification_requests (
          id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
          request_id varchar(100) UNIQUE NOT NULL,
          user_id int unsigned NOT NULL,
          proof_of_residency_path varchar(255) NULL,
          file_data longblob NULL COMMENT 'Binary file data stored in database',
          file_encoding varchar(50) NULL COMMENT 'File encoding type (e.g., buffer)',
          original_filename varchar(255) NULL COMMENT 'Original uploaded filename',
          mime_type varchar(100) NULL COMMENT 'File MIME type (e.g., image/jpeg)',
          file_size int NULL COMMENT 'File size in bytes',
          proof_type varchar(50) NULL,
          notes text NULL,
          status enum('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft',
          submitted_at timestamp NULL,
          reviewed_at timestamp NULL,
          reviewed_by int unsigned NULL,
          review_notes text NULL,
          created_at timestamp DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_request_id (request_id),
          INDEX idx_user_status (user_id, status),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `);

      console.log('✅ Created resident_verification_requests table with BLOB support');
    } else {
      console.log('📋 Table exists. Checking columns...');

      // Check if BLOB columns exist
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM resident_verification_requests LIKE 'file_data'"
      );

      if (columns.length === 0) {
        console.log('🔄 Adding missing BLOB columns...');

        await connection.execute(`
          ALTER TABLE resident_verification_requests
          ADD COLUMN file_data LONGBLOB NULL COMMENT 'Binary file data stored in database',
          ADD COLUMN file_encoding VARCHAR(50) NULL COMMENT 'File encoding type (e.g., buffer)',
          ADD COLUMN original_filename VARCHAR(255) NULL COMMENT 'Original uploaded filename',
          ADD COLUMN mime_type VARCHAR(100) NULL COMMENT 'File MIME type (e.g., image/jpeg)',
          ADD COLUMN file_size INT NULL COMMENT 'File size in bytes'
        `);

        console.log('✅ Added BLOB columns successfully');
      } else {
        console.log('✅ BLOB columns already exist');
      }
    }

    // Show table structure
    const [columns] = await connection.execute(
      "DESCRIBE resident_verification_requests"
    );

    console.log('\n📋 Table structure:');
    console.log('Column Name'.padEnd(25), 'Type'.padEnd(20), 'Null', 'Key', 'Default');
    console.log('-'.repeat(80));
    columns.forEach(col => {
      console.log(
        col.Field.padEnd(25),
        col.Type.padEnd(20),
        col.Null.padEnd(4),
        (col.Key || '').padEnd(4),
        (col.Default || '')
      );
    });

    console.log('\n🎉 Table schema fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing table schema:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixTableSchema();
