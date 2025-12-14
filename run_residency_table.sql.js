// Script to create the residency_verifications table
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: './server/.env' });

async function createResidencyTable() {
  let connection;

  try {
    console.log('🔄 Creating residency_verifications table...');
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

    // Create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS residency_verifications (
        id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id int unsigned NOT NULL,
        resident_id varchar(50) DEFAULT NULL,
        firebase_uid varchar(128) NOT NULL,
        proof_type varchar(50) DEFAULT NULL,
        proof_document_path varchar(500) DEFAULT NULL,
        notes text,
        status enum('pending', 'approved', 'rejected', 'archived') DEFAULT 'pending',
        officer_notes text,
        review_reason text,
        submitted_at timestamp DEFAULT CURRENT_TIMESTAMP,
        reviewed_at timestamp NULL DEFAULT NULL,
        reviewed_by int unsigned DEFAULT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_user_id (user_id),
        INDEX idx_firebase_uid (firebase_uid),
        INDEX idx_status (status),
        INDEX idx_submitted_at (submitted_at),
        INDEX idx_resident_id (resident_id),

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `;

    await connection.execute(createTableSQL);
    console.log('✅ residency_verifications table created successfully');

    // Verify the table was created
    const [rows] = await connection.execute('DESCRIBE residency_verifications');
    console.log('📋 Table structure:');
    console.table(rows);

  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createResidencyTable();
