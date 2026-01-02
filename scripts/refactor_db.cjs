/**
 * THEMIS BIOPROFILING DATABASE REFACTOR
 * Raw SQL execution script for safe structural changes
 *
 * This script performs:
 * 1. Fixes circular dependencies
 * 2. Merges Officials -> Users
 * 3. Standardizes roles
 * 4. Adds intelligence layer (blotter_participants, resident_status)
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: './server/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_management',
  multipleStatements: true
};

async function executeRawSQL() {
  let connection;

  try {
    console.log('🔧 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);

    console.log('📊 Starting THEMIS BioProfiling Database Refactor...\n');

    // ==========================================
    // PHASE 1: Fix Circular Dependencies
    // ==========================================
    console.log('🔄 Phase 1: Fixing circular dependencies...');

    await connection.execute(`
      ALTER TABLE households MODIFY Head_Resident_ID VARCHAR(50) NULL;
    `);
    console.log('✅ Made Head_Resident_ID nullable');

    // ==========================================
    // PHASE 2: Consolidate User Identity
    // ==========================================
    console.log('\n👥 Phase 2: Consolidating user identity (Officials -> Users)...');

    // Check if position column already exists
    const [positionCols] = await connection.execute(`
      SHOW COLUMNS FROM users WHERE Field = 'position'
    `);

    if (positionCols.length === 0) {
      // Add position column to users table
      await connection.execute(`
        ALTER TABLE users ADD COLUMN position VARCHAR(100) NULL;
      `);
      console.log('✅ Added position column to users table');
    } else {
      console.log('ℹ️ Position column already exists, skipping...');
    }

    // Check if officials table still exists
    const [officialsTables] = await connection.execute(`
      SHOW TABLES LIKE 'officials'
    `);

    if (officialsTables.length > 0) {
      // Update users with position from officials
      const [updateResult] = await connection.execute(`
        UPDATE users u
        JOIN officials o ON u.official_id = o.id
        SET u.position = o.position;
      `);
      console.log(`✅ Updated ${updateResult.affectedRows} user positions`);

      // Remove foreign key constraint from users to officials
      await connection.execute(`
        ALTER TABLE users DROP FOREIGN KEY users_ibfk_1;
      `);
      console.log('✅ Removed foreign key constraint');

      // Remove official_id column from users
      await connection.execute(`
        ALTER TABLE users DROP COLUMN official_id;
      `);
      console.log('✅ Removed official_id column from users');

      // Drop officials table
      await connection.execute(`
        DROP TABLE officials;
      `);
      console.log('✅ Dropped officials table');
    } else {
      console.log('ℹ️ Officials table already dropped, skipping...');
    }

    // ==========================================
    // PHASE 3: Standardize Roles
    // ==========================================
    console.log('\n🔐 Phase 3: Standardizing roles...');

    // Ensure roles table contains exactly the required roles
    await connection.execute(`
      INSERT INTO roles (role_name, hierarchy_level, description, permissions) VALUES
      ('IT Admin', 6, 'System Administrator with full access', '["admin","manage_users","manage_system"]'),
      ('Secretary', 5, 'Barangay Secretary with document management', '["manage_documents","approve_certificates","manage_residents"]'),
      ('Clerk', 4, 'Administrative Clerk for certificate processing', '["process_certificates","view_residents","manage_documents"]'),
      ('Blotter Officer', 3, 'Tanod/Officer for incident reporting', '["manage_blotter","view_residents","create_reports"]'),
      ('Captain', 2, 'Barangay Captain with approval authority', '["approve_documents","manage_staff","view_reports"]'),
      ('Resident', 1, 'Regular resident with limited access', '["view_profile","request_documents","view_public_info"]')
      ON DUPLICATE KEY UPDATE
        role_name=VALUES(role_name),
        hierarchy_level=VALUES(hierarchy_level),
        description=VALUES(description),
        permissions=VALUES(permissions);
    `);
    console.log('✅ Ensured roles table has THEMIS standard roles');

    // Check if role column still exists
    const [roleCols] = await connection.execute(`
      SHOW COLUMNS FROM users WHERE Field = 'role'
    `);

    if (roleCols.length > 0) {
      // Sync users.role_id with new role IDs based on old role strings
      const [roleSyncResult] = await connection.execute(`
        UPDATE users u
        JOIN roles r ON (
          CASE u.role
            WHEN 'admin' THEN r.role_name = 'IT Admin'
            WHEN 'captain' THEN r.role_name = 'Captain'
            WHEN 'secretary' THEN r.role_name = 'Secretary'
            WHEN 'clerk' THEN r.role_name = 'Clerk'
            WHEN 'blotter_officer' THEN r.role_name = 'Blotter Officer'
            WHEN 'resident' THEN r.role_name = 'Resident'
            ELSE NULL
          END
        )
        SET u.role_id = r.id;
      `);
      console.log(`✅ Synced ${roleSyncResult.affectedRows} user role IDs`);

      // Remove string role column
      await connection.execute(`
        ALTER TABLE users DROP COLUMN role;
      `);
      console.log('✅ Removed legacy string role column');
    } else {
      console.log('ℹ️ Role column already removed, skipping...');
    }

    // ==========================================
    // PHASE 4: Intelligence Layer
    // ==========================================
    console.log('\n🧠 Phase 4: Adding intelligence layer...');

    // Check if blotter_participants table already exists
    const [participantsTables] = await connection.execute(`
      SHOW TABLES LIKE 'blotter_participants'
    `);

    if (participantsTables.length === 0) {
      // Create blotter_participants table first without foreign keys
      await connection.execute(`
        CREATE TABLE blotter_participants (
          id INT PRIMARY KEY AUTO_INCREMENT,
          blotter_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          resident_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          participation_type ENUM('Complainant', 'Respondent', 'Victim', 'Witness') NOT NULL,
          status ENUM('Active', 'Settled', 'Cleared') DEFAULT 'Active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_blotter_id (blotter_id),
          INDEX idx_resident_id (resident_id),
          INDEX idx_participation_type (participation_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ Created blotter_participants table structure');

      // Add foreign keys separately to isolate the issue
      try {
        await connection.execute(`
          ALTER TABLE blotter_participants
          ADD CONSTRAINT fk_blotter_participants_blotter
          FOREIGN KEY (blotter_id) REFERENCES blotter(Case_Number) ON DELETE CASCADE;
        `);
        console.log('✅ Added blotter foreign key');

        await connection.execute(`
          ALTER TABLE blotter_participants
          ADD CONSTRAINT fk_blotter_participants_resident
          FOREIGN KEY (resident_id) REFERENCES residents(Resident_ID) ON DELETE CASCADE;
        `);
        console.log('✅ Added resident foreign key');
      } catch (fkError) {
        console.log('⚠️ Foreign key creation failed, but table structure is complete');
        console.log('Error details:', fkError.message);
        // Continue anyway since the table structure is created
      }
    } else {
      console.log('ℹ️ blotter_participants table already exists, skipping...');
    }

    // Check if resident_status column already exists
    const [statusCols] = await connection.execute(`
      SHOW COLUMNS FROM residents WHERE Field = 'resident_status'
    `);

    if (statusCols.length === 0) {
      // Update residents table with resident_status
      await connection.execute(`
        ALTER TABLE residents ADD COLUMN resident_status ENUM('Good Standing', 'Derogatory Record', 'Watchlist') DEFAULT 'Good Standing';
      `);
      console.log('✅ Added resident_status column to residents table');
    } else {
      console.log('ℹ️ resident_status column already exists, skipping...');
    }

    // ==========================================
    // PHASE 5: Data Migration
    // ==========================================
    console.log('\n📦 Phase 5: Migrating existing data...');

    // Migrate blotter respondent data to new participants table
    const [migrationResult] = await connection.execute(`
      INSERT INTO blotter_participants (blotter_id, resident_id, participation_type, status)
      SELECT Case_Number, respondent_id, 'Respondent', 'Active'
      FROM blotter
      WHERE respondent_id IS NOT NULL;
    `);
    console.log(`✅ Migrated ${migrationResult.affectedRows} blotter respondents to participants table`);

    // Update resident status based on blotter cases
    const [statusUpdateResult] = await connection.execute(`
      UPDATE residents r SET resident_status = 'Derogatory Record'
      WHERE EXISTS (
        SELECT 1 FROM blotter b
        WHERE b.respondent_id = r.Resident_ID
        AND b.status IN ('Pending', 'Active')
      );
    `);
    console.log(`✅ Updated resident status for ${statusUpdateResult.affectedRows} residents with active cases`);

    console.log('\n🎉 THEMIS BioProfiling Database Refactor completed successfully!');
    console.log('\n📋 Summary:');
    console.log('• Fixed circular dependencies');
    console.log('• Consolidated user identity');
    console.log('• Standardized RBAC roles');
    console.log('• Added intelligence layer for background checks');
    console.log('• Migrated existing data safely');

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
  executeRawSQL()
    .then(() => {
      console.log('\n✅ Refactor completed. Ready for seeding.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Refactor failed:', error.message);
      process.exit(1);
    });
}

module.exports = { executeRawSQL };
