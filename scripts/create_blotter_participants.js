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

    // First, check the actual structure of the blotter table to ensure correct foreign key
    const [blotterColumns] = await db.execute('DESCRIBE blotter');
    console.log('Blotter table structure:', blotterColumns.map(col => `${col.Field}: ${col.Type}`).join(', '));

    // Check if blotter table uses 'id' or 'Case_Number' as primary key
    const hasIdColumn = blotterColumns.some(col => col.Field === 'id');
    const hasCaseNumberColumn = blotterColumns.some(col => col.Field === 'Case_Number');

    console.log(`Blotter table has 'id' column: ${hasIdColumn}`);
    console.log(`Blotter table has 'Case_Number' column: ${hasCaseNumberColumn}`);

    // Create the table with correct foreign key reference
    let createTableSQL;
    if (hasIdColumn) {
      // If blotter table has auto-increment id, reference that
      createTableSQL = `
        CREATE TABLE IF NOT EXISTS \`blotter_participants\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`blotter_id\` int(11) NOT NULL,
          \`resident_id\` varchar(50) NOT NULL,
          \`participation_type\` enum('Complainant','Respondent','Victim','Witness') NOT NULL,
          \`status\` enum('Active','Settled','Cleared') DEFAULT 'Active',
          PRIMARY KEY (\`id\`),
          KEY \`fk_bp_blotter\` (\`blotter_id\`),
          KEY \`fk_bp_resident\` (\`resident_id\`),
          CONSTRAINT \`fk_bp_blotter\` FOREIGN KEY (\`blotter_id\`) REFERENCES \`blotter\` (\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`fk_bp_resident\` FOREIGN KEY (\`resident_id\`) REFERENCES \`residents\` (\`Resident_ID\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      console.log('Using blotter.id as foreign key reference');
    } else if (hasCaseNumberColumn) {
      // If blotter table uses Case_Number as identifier, reference that
      createTableSQL = `
        CREATE TABLE IF NOT EXISTS \`blotter_participants\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`blotter_id\` int(11) NOT NULL,
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
      console.log('Using blotter.Case_Number as foreign key reference');
    } else {
      throw new Error('Cannot determine appropriate foreign key for blotter table');
    }

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
