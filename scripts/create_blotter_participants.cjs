const mysql = require('mysql2/promise');
require('dotenv').config();

async function createBlotterParticipantsTable() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management',
    multipleStatements: true
  });

  try {
    console.log('🔧 THEMIS: Creating blotter_participants table...');

    // Check if table already exists
    const [tables] = await db.execute('SHOW TABLES LIKE "blotter_participants"');
    if (tables.length > 0) {
      console.log('✅ blotter_participants table already exists!');
      return;
    }

    // THEMIS REQUIREMENT: blotter_participants table must reference blotter.Case_Number
    // From schema analysis, blotter table uses Case_Number (varchar) as primary key
    console.log('THEMIS: Creating blotter_participants table with Case_Number foreign key');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`blotter_participants\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`blotter_id\` varchar(50) NOT NULL COMMENT 'References blotter.Case_Number',
        \`resident_id\` varchar(50) NOT NULL,
        \`participation_type\` enum('Complainant','Respondent','Victim','Witness') NOT NULL,
        \`status\` enum('Active','Settled','Cleared') DEFAULT 'Active',
        PRIMARY KEY (\`id\`),
        KEY \`fk_bp_blotter\` (\`blotter_id\`),
        KEY \`fk_bp_resident\` (\`resident_id\`),
        CONSTRAINT \`fk_bp_blotter\` FOREIGN KEY (\`blotter_id\`) REFERENCES \`blotter\` (\`Case_Number\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_bp_resident\` FOREIGN KEY (\`resident_id\`) REFERENCES \`residents\` (\`Resident_ID\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    console.log('Using blotter.Case_Number (varchar) as foreign key reference - THEMIS STANDARD');

    await db.execute(createTableSQL);
    console.log('✅ blotter_participants table created successfully!');

    // Verify table creation
    const [verifyTables] = await db.execute('SHOW TABLES LIKE "blotter_participants"');
    if (verifyTables.length > 0) {
      console.log('🎉 THEMIS: blotter_participants table is ready for use!');
      console.log('📋 This table enables linking residents to blotter cases for ClearPass validation');
    } else {
      throw new Error('Table creation verification failed');
    }

  } catch (error) {
    console.error('❌ Error creating blotter_participants table:', error.message);
    throw error;
  } finally {
    await db.end();
  }
}

// Run if called directly
if (require.main === module) {
  createBlotterParticipantsTable()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createBlotterParticipantsTable };
