const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyBlotterParticipants() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management'
  });

  try {
    console.log('🔍 Verifying blotter_participants table creation...');

    // Check if table exists
    const [tables] = await db.execute('SHOW TABLES LIKE "blotter_participants"');
    if (tables.length === 0) {
      console.log('❌ blotter_participants table does NOT exist!');
      return false;
    }

    console.log('✅ blotter_participants table exists!');

    // Check table structure
    const [columns] = await db.execute('DESCRIBE blotter_participants');
    console.log('Table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? `KEY(${col.Key})` : ''} ${col.Default !== null ? `DEFAULT '${col.Default}'` : ''}`);
    });

    // Check if we can query it (basic functionality test)
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM blotter_participants');
    console.log(`📊 Table contains ${rows[0].count} records`);

    console.log('🎉 blotter_participants table is ready for THEMIS ClearPass operations!');
    return true;

  } catch (error) {
    console.error('❌ Error verifying blotter_participants table:', error.message);
    return false;
  } finally {
    await db.end();
  }
}

// Run if called directly
if (require.main === module) {
  verifyBlotterParticipants()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyBlotterParticipants };
