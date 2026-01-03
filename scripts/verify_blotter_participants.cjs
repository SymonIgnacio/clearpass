const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../server/.env' });

async function verifyBlotterParticipants() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management'
  };

  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔍 THEMIS: Verifying blotter_participants table...\n');

    // Check if table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'blotter_participants'");
    if (tables.length === 0) {
      console.log('❌ blotter_participants table does not exist!');
      return;
    }

    console.log('✅ blotter_participants table exists');

    // Check table structure
    const [columns] = await connection.execute('DESCRIBE blotter_participants');
    console.log('\n📋 Table Structure:');
    columns.forEach(col => {
      console.log(`• ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.Key ? `(${col.Key})` : ''}`);
    });

    // Check foreign key constraints
    const [constraints] = await connection.execute(`
      SELECT
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_SCHEMA = '${dbConfig.database}'
        AND TABLE_NAME = 'blotter_participants'
    `);

    console.log('\n🔗 Foreign Key Constraints:');
    constraints.forEach(constraint => {
      if (constraint.REFERENCED_TABLE_NAME) {
        console.log(`• ${constraint.COLUMN_NAME} → ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
      }
    });

    // Check if table has any data
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM blotter_participants');
    const recordCount = countResult[0].count;

    console.log(`\n📊 Table Status:`);
    console.log(`• Records: ${recordCount}`);
    console.log(`• Status: ${recordCount >= 0 ? 'Ready for use' : 'Empty but ready'}`);

    if (recordCount > 0) {
      console.log('\n📝 Sample Records:');
      const [samples] = await connection.execute('SELECT * FROM blotter_participants LIMIT 3');
      samples.forEach((record, index) => {
        console.log(`• Record ${index + 1}: blotter_id=${record.blotter_id}, resident_id=${record.resident_id}, type=${record.participation_type}`);
      });
    }

    console.log('\n🎉 THEMIS blotter_participants table verification complete!');
    console.log('✅ Table is ready for "Themis" background checks functionality.');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await connection.end();
  }
}

verifyBlotterParticipants();
