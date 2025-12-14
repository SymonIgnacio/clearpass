// Script to create the resident_verification_requests table with BLOB storage
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: './server/.env' });

async function createResidencyTableWithBlob() {
  let connection;

  try {
    console.log('🔄 Creating resident_verification_requests table with BLOB storage...');
    console.log('📋 Database config - Host:', process.env.DB_HOST, 'DB:', process.env.DB_NAME);

    // Database configuration
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barangay_management'
    };

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Drop existing table if it exists
    console.log('🗑️ Dropping existing table if exists...');
    await connection.execute('DROP TABLE IF EXISTS resident_verification_requests');

    // Create the table with BLOB storage
    const createTableSQL = `
      CREATE TABLE resident_verification_requests (
        id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
        request_id varchar(100) UNIQUE NOT NULL,
        user_id int unsigned NOT NULL,

        -- Legacy file path (for backward compatibility)
        proof_of_residency_path varchar(255) NULL,

        -- New BLOB storage columns
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

        -- Indexes
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_request_id (request_id),
        INDEX idx_user_status (user_id, status),

        -- Foreign keys
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

      -- Insert sample data for testing
      INSERT INTO resident_verification_requests
      (request_id, user_id, proof_type, notes, status, submitted_at)
      SELECT
        CONCAT('TEST-REQ-', id, '-', DATE_FORMAT(NOW(), '%H%i%s')),
        id,
        'cedula',
        'Test request for blob storage implementation',
        'pending',
        NOW()
      FROM users
      WHERE role = 'resident'
      LIMIT 1;
    `;

    await connection.execute(createTableSQL);
    console.log('✅ resident_verification_requests table created successfully with BLOB support');

    // Verify the table was created
    const [rows] = await connection.execute('DESCRIBE resident_verification_requests');
    console.log('📋 Table structure:');
    rows.forEach(col => {
      console.log(`  ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} - ${col.Comment || ''}`);
    });

    // Show sample data
    const [sampleRows] = await connection.execute('SELECT * FROM resident_verification_requests LIMIT 5');
    console.log('📋 Sample data:');
    console.log(`Found ${sampleRows.length} test records`);

  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createResidencyTableWithBlob();
