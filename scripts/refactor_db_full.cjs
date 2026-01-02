/**
 * THEMIS BIOPROFILING DATABASE REFACTOR
 * Complete database cleanup and schema alignment
 *
 * This script performs:
 * 1. Drop redundant tables and columns
 * 2. Enforce new schema structure
 * 3. Create intelligence layer (blotter_participants, resident_status)
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_management',
  multipleStatements: true
};

async function executeFullRefactor() {
  let connection;

  try {
    console.log('🔧 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);

    console.log('📊 Starting THEMIS Full Database Refactor...\n');

    // ==========================================
    // PHASE 1: Drop Redundant Tables
    // ==========================================
    console.log('🧹 Phase 1: Dropping redundant tables...');

    // Drop officials table (data merged to users)
    const [officialsTables] = await connection.execute(`
      SHOW TABLES LIKE 'officials'
    `);

    if (officialsTables.length > 0) {
      await connection.execute(`DROP TABLE officials`);
      console.log('✅ Dropped officials table');
    } else {
      console.log('ℹ️ Officials table already dropped');
    }

    // Drop tanod_patrol_schedule table (if not in requirements)
    const [tanodTables] = await connection.execute(`
      SHOW TABLES LIKE 'tanod_patrol_schedule'
    `);

    if (tanodTables.length > 0) {
      await connection.execute(`DROP TABLE tanod_patrol_schedule`);
      console.log('✅ Dropped tanod_patrol_schedule table');
    } else {
      console.log('ℹ️ tanod_patrol_schedule table not found');
    }

    // Drop ai_analytics_cache table (rebuilding AI fresh)
    const [aiTables] = await connection.execute(`
      SHOW TABLES LIKE 'ai_analytics_cache'
    `);

    if (aiTables.length > 0) {
      await connection.execute(`DROP TABLE ai_analytics_cache`);
      console.log('✅ Dropped ai_analytics_cache table');
    } else {
      console.log('ℹ️ ai_analytics_cache table not found');
    }

    // ==========================================
    // PHASE 2: Clean Users Table
    // ==========================================
    console.log('\n👥 Phase 2: Cleaning users table...');

    // Remove official_id column
    const [officialIdCols] = await connection.execute(`
      SHOW COLUMNS FROM users WHERE Field = 'official_id'
    `);

    if (officialIdCols.length > 0) {
      await connection.execute(`
        ALTER TABLE users DROP FOREIGN KEY users_ibfk_1
      `).catch(() => console.log('⚠️ Foreign key already removed'));
      await connection.execute(`ALTER TABLE users DROP COLUMN official_id`);
      console.log('✅ Removed official_id column from users');
    } else {
      console.log('ℹ️ official_id column already removed');
    }

    // Remove role column (string-based)
    const [roleCols] = await connection.execute(`
      SHOW COLUMNS FROM users WHERE Field = 'role'
    `);

    if (roleCols.length > 0 && roleCols[0].Type.toLowerCase().includes('varchar')) {
      await connection.execute(`ALTER TABLE users DROP COLUMN role`);
      console.log('✅ Removed legacy string role column from users');
    } else {
      console.log('ℹ️ String role column already removed');
    }

    // Ensure position column exists
    const [positionCols] = await connection.execute(`
      SHOW COLUMNS FROM users WHERE Field = 'position'
    `);

    if (positionCols.length === 0) {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN position VARCHAR(100) NULL
      `);
      console.log('✅ Added position column to users');
    } else {
      console.log('ℹ️ Position column already exists');
    }

    // ==========================================
    // PHASE 3: Clean Residents Table
    // ==========================================
    console.log('\n🏠 Phase 3: Cleaning residents table...');

    // Drop Age column (derived from Birthdate)
    const [ageCols] = await connection.execute(`
      SHOW COLUMNS FROM residents WHERE Field = 'Age'
    `);

    if (ageCols.length > 0) {
      await connection.execute(`ALTER TABLE residents DROP COLUMN Age`);
      console.log('✅ Dropped Age column from residents');
    } else {
      console.log('ℹ️ Age column already removed');
    }

    // ==========================================
    // PHASE 4: Construct Themis Intelligence Layer
    // ==========================================
    console.log('\n🧠 Phase 4: Constructing Themis Intelligence Layer...');

    // Create blotter_participants table
    const [participantsTables] = await connection.execute(`
      SHOW TABLES LIKE 'blotter_participants'
    `);

    if (participantsTables.length === 0) {
      // Check blotter table structure to determine correct foreign key
      const [blotterColumns] = await connection.execute('DESCRIBE blotter');
      const hasIdColumn = blotterColumns.some(col => col.Field === 'id');
      const hasCaseNumberColumn = blotterColumns.some(col => col.Field === 'Case_Number');

      let foreignKeyReference;
      if (hasIdColumn) {
        foreignKeyReference = 'blotter(id)';
      } else if (hasCaseNumberColumn) {
        foreignKeyReference = 'blotter(Case_Number)';
      } else {
        throw new Error('Cannot determine appropriate foreign key for blotter table');
      }

      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`blotter_participants\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`blotter_id\` int(11) NOT NULL,
          \`resident_id\` varchar(50) NOT NULL,
          \`participation_type\` enum('Complainant','Respondent','Victim','Witness') NOT NULL,
          \`status\` enum('Active','Settled','Cleared') DEFAULT 'Active',
          PRIMARY KEY (\`id\`),
          KEY \`fk_bp_blotter\` (\`blotter_id\`),
          KEY \`fk_bp_resident\` (\`resident_id\`),
          CONSTRAINT \`fk_bp_blotter\` FOREIGN KEY (\`blotter_id\`) REFERENCES ${foreignKeyReference} ON DELETE CASCADE,
          CONSTRAINT \`fk_bp_resident\` FOREIGN KEY (\`resident_id\`) REFERENCES \`residents\` (\`Resident_ID\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log(`✅ Created blotter_participants table with foreign key to ${foreignKeyReference}`);
    } else {
      console.log('ℹ️ blotter_participants table already exists');
    }

    // Add resident_status column to residents
    const [statusCols] = await connection.execute(`
      SHOW COLUMNS FROM residents WHERE Field = 'resident_status'
    `);

    if (statusCols.length === 0) {
      await connection.execute(`
        ALTER TABLE residents ADD COLUMN resident_status ENUM('Good Standing', 'Derogatory Record', 'Watchlist') DEFAULT 'Good Standing'
      `);
      console.log('✅ Added resident_status column to residents');
    } else {
      console.log('ℹ️ resident_status column already exists');
    }

    console.log('\n🎉 THEMIS Full Database Refactor completed successfully!');
    console.log('\n📋 Summary:');
    console.log('• Dropped redundant tables (officials, tanod_patrol_schedule, ai_analytics_cache)');
    console.log('• Cleaned users table (removed official_id, string role; ensured position)');
    console.log('• Cleaned residents table (removed Age column)');
    console.log('• Created blotter_participants table for background checks');
    console.log('• Added resident_status column for ClearPass validation');

  } catch (error) {
    console.error('❌ Database refactor failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Execute the refactor
if (require.main === module) {
  executeFullRefactor()
    .then(() => {
      console.log('\n✅ Full refactor completed. Ready for user alignment.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Full refactor failed:', error.message);
      process.exit(1);
    });
}

module.exports = { executeFullRefactor };
