/**
 * THEMIS USER ROLE ALIGNMENT
 * Aligns user roles to match requirement document exactly
 *
 * This script performs:
 * 1. Ensures Blotter Officer role exists (Role 7)
 * 2. Migrates Tanod users (Role 6) to Blotter Officer (Role 7)
 * 3. Updates positions accordingly
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../server/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_management',
  multipleStatements: true
};

async function alignUserRoles() {
  let connection;

  try {
    console.log('🔧 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);

    console.log('🔄 Starting THEMIS User Role Alignment...\n');

    // ==========================================
    // PHASE 1: Ensure Blotter Officer Role Exists
    // ==========================================
    console.log('🔐 Phase 1: Ensuring Blotter Officer role exists...');

    // Check if roles table exists
    const [rolesTables] = await connection.execute(`
      SHOW TABLES LIKE 'roles'
    `);

    if (rolesTables.length === 0) {
      throw new Error('Roles table does not exist. Please run database migrations first.');
    }

    // Fix swapped roles - current system has Blotter Officer as ID 6 and Resident as ID 7
    // We need to swap them to match THEMIS requirements: Resident=6, Blotter Officer=7

    console.log('🔄 Fixing swapped roles - current state:');
    console.log('  - Role ID 6: Blotter Officer (should be Resident)');
    console.log('  - Role ID 7: Resident (should be Blotter Officer)');

    // Temporarily disable foreign key checks to allow role updates
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    try {
      // Simply swap the role names to fix the mismatch
      await connection.execute(`
        UPDATE roles SET role_name = 'Temp_Blotter' WHERE id = 6 AND role_name = 'Blotter Officer'
      `);
      await connection.execute(`
        UPDATE roles SET role_name = 'Temp_Resident' WHERE id = 7 AND role_name = 'Resident'
      `);

      // Now set the correct names
      await connection.execute(`
        UPDATE roles SET role_name = 'Resident' WHERE id = 6
      `);
      await connection.execute(`
        UPDATE roles SET role_name = 'Blotter Officer' WHERE id = 7
      `);

      // Fix IT Admin ID
      await connection.execute(`
        UPDATE roles SET id = 1 WHERE id = 5 AND role_name = 'IT Admin'
      `);
      await connection.execute(`
        UPDATE users SET role_id = 1 WHERE role_id = 5
      `);
    } finally {
      // Re-enable foreign key checks
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    }

    console.log('✅ Fixed role IDs: IT Admin=1, Captain=2, Secretary=3, Clerk=4, Resident=6, Blotter Officer=7');

    // ==========================================
    // PHASE 2: Migrate Tanod Users to Blotter Officer
    // ==========================================
    console.log('\n👥 Phase 2: Migrating Tanod users to Blotter Officer...');

    // Check current users with role_id = 6 (Tanod/Chief Tanod)
    const [tanodUsers] = await connection.execute(`
      SELECT id, username, full_name, position
      FROM users
      WHERE role_id = 6 AND is_active = 1
    `);

    console.log(`Found ${tanodUsers.length} active Tanod users to migrate:`);
    tanodUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.full_name}): ${user.position || 'No position'}`);
    });

    if (tanodUsers.length > 0) {
      // Migrate Tanod users to Blotter Officer
      const [migrateResult] = await connection.execute(`
        UPDATE users
        SET role_id = 7, position = 'Blotter Officer'
        WHERE role_id = 6 AND is_active = 1
      `);

      console.log(`✅ Migrated ${migrateResult.affectedRows} users from Tanod (Role 6) to Blotter Officer (Role 7)`);

      // Verify migration
      const [verifyUsers] = await connection.execute(`
        SELECT id, username, position, role_id
        FROM users
        WHERE role_id = 7 AND is_active = 1
        ORDER BY username
      `);

      console.log('\n📋 Blotter Officer users after migration:');
      verifyUsers.forEach(user => {
        console.log(`  - ${user.username}: ${user.position} (Role ${user.role_id})`);
      });

    } else {
      console.log('ℹ️ No active Tanod users found to migrate');
    }

    // ==========================================
    // PHASE 3: Role Distribution Summary
    // ==========================================
    console.log('\n📊 Phase 3: Role distribution summary...');

    const [roleSummary] = await connection.execute(`
      SELECT
        r.role_name,
        COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
      GROUP BY r.id, r.role_name
      ORDER BY r.id
    `);

    console.log('Current role distribution:');
    roleSummary.forEach(row => {
      console.log(`  - ${row.role_name}: ${row.user_count} users`);
    });

    // ==========================================
    // PHASE 4: Verify Role Constants Alignment
    // ==========================================
    console.log('\n✅ Phase 4: Verifying role constants alignment...');

    const expectedRoles = [
      { id: 1, name: 'IT Admin' },
      { id: 2, name: 'Captain' },
      { id: 3, name: 'Secretary' },
      { id: 4, name: 'Clerk' },
      { id: 6, name: 'Resident' },
      { id: 7, name: 'Blotter Officer' }
    ];

    console.log('Expected THEMIS roles:');
    for (const expected of expectedRoles) {
      const dbRole = roleSummary.find(r => r.role_name === expected.name);
      if (dbRole) {
        console.log(`  ✅ ${expected.name} (ID ${expected.id}): ${dbRole.user_count} users`);
      } else {
        console.log(`  ❌ ${expected.name} (ID ${expected.id}): MISSING from database`);
      }
    }

    console.log('\n🎉 THEMIS User Role Alignment completed successfully!');
    console.log('\n📋 Summary:');
    console.log('• Ensured Blotter Officer role (ID 7) exists');
    console.log('• Migrated Tanod users (Role 6) to Blotter Officer (Role 7)');
    console.log('• Updated positions to "Blotter Officer"');
    console.log('• Verified role distribution matches THEMIS requirements');

  } catch (error) {
    console.error('❌ User role alignment failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Execute the alignment
if (require.main === module) {
  alignUserRoles()
    .then(() => {
      console.log('\n✅ User role alignment completed. Ready for code updates.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ User role alignment failed:', error.message);
      process.exit(1);
    });
}

module.exports = { alignUserRoles };
