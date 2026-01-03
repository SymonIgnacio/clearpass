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
      ADD COLUMN IF NOT EXISTS file_data LONGBLOB NULL COMMENT 'Binary file data stored in database',
      ADD COLUMN IF NOT EXISTS file_encoding VARCHAR(50) NULL COMMENT 'File encoding type (e.g., buffer)';
    `;

    await connection.execute(alterQuery);
    console.log('✅ Added BLOB columns to document_templates table');

    // Add index if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE document_templates
        ADD INDEX IF NOT EXISTS idx_templates_active_type (is_active, document_type);
      `);
      console.log('✅ Added index to document_templates table');
    } catch (indexError) {
      console.log('ℹ️  Index already exists or could not be created');
    }

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
