const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;

  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barangay_management',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Add BLOB columns to document_templates table
    const alterQuery = `
      ALTER TABLE document_templates
      ADD COLUMN file_data LONGBLOB NULL COMMENT 'Binary file data stored in database',
      ADD COLUMN file_encoding VARCHAR(50) NULL COMMENT 'File encoding type (e.g., buffer)',
      ADD INDEX idx_templates_active_type (is_active, document_type);
    `;

    await connection.execute(alterQuery);
    console.log('✅ Added BLOB columns to document_templates table');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  BLOB columns already exist, skipping migration');
    } else {
      console.error('❌ Migration failed:', error.message);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

runMigration().catch(console.error);
