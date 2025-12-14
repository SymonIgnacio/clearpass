// Simple table creation
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: './server/.env' });

async function createSimpleTable() {
  let connection;

  try {
    console.log('🔄 Creating resident_verification_requests table...');

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barangay_management'
    };

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Create simple table first
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS resident_verification_requests (
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
        INDEX idx_user_status (user_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `;

    await connection.execute(createTableSQL);
    console.log('✅ resident_verification_requests table created successfully');

    // Now try to add foreign key constraints (ignore errors if they fail)
    try {
      await connection.execute(`
        ALTER TABLE resident_verification_requests
        ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        ADD CONSTRAINT fk_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
      `);
      console.log('✅ Foreign key constraints added');
    } catch (fkError) {
      console.log('⚠️ Foreign key constraints not added (may already exist or users table missing):', fkError.message);
    }

    // Verify the table was created
    const [rows] = await connection.execute('DESCRIBE resident_verification_requests');
    console.log('📋 Table structure:');
    rows.forEach(col => {
      console.log(`  ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} - ${col.Comment || ''}`);
    });

    console.log('✅ Table created successfully with BLOB storage support!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createSimpleTable();
