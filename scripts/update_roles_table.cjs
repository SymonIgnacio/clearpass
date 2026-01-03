/**
 * THEMIS ROLES TABLE SYNCHRONIZATION
 * Updates the roles table to match the required THEMIS role mappings
 *
 * Required Mappings:
 * - IT_ADMIN = 5
 * - CAPTAIN = 2
 * - SECRETARY = 3
 * - CLERK = 4
 * - BLOTTER_OFFICER = 6
 * - RESIDENT = 12
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

async function updateRolesTable() {
  let connection;

  try {
    console.log('🔧 THEMIS: Synchronizing roles table to match required mappings...');
    connection = await mysql.createConnection(dbConfig);

    console.log('\n🎯 Required Role Mappings:');
    console.log('• IT_ADMIN → ID 5');
    console.log('• CAPTAIN → ID 2 (keep existing)');
    console.log('• SECRETARY → ID 3 (keep existing)');
    console.log('• CLERK → ID 4 (keep existing)');
    console.log('• BLOTTER_OFFICER → ID 6 (update from 7)');
    console.log('• RESIDENT → ID 12 (update from 6)');

    // First, show current roles
    const [currentRoles] = await connection.execute('SELECT * FROM roles ORDER BY id');
    console.log('\n📊 Current Roles:');
    currentRoles.forEach(role => {
      console.log(`• ID ${role.id}: ${role.role_name} (hierarchy: ${role.hierarchy_level})`);
    });

    // STEP 1: Temporarily set user role_ids to NULL to avoid FK constraint issues
    console.log('\n🔄 Step 1: Temporarily clearing user role_id references...');
    await connection.execute('UPDATE users SET role_id = NULL WHERE role_id IS NOT NULL');
    console.log('✅ User role_id references cleared');

    // STEP 2: Delete conflicting roles that need ID changes
    console.log('\n🔄 Step 2: Removing roles that need ID reassignment...');
    await connection.execute('DELETE FROM roles WHERE id IN (1, 6, 7)');
    console.log('✅ Conflicting roles removed');

    // STEP 3: Insert all required roles with correct IDs (only if they don't exist)
    console.log('\n🔄 Step 3: Inserting all required roles with correct IDs...');
    const requiredRoles = [
      { id: 2, name: 'Captain', hierarchy: 2 },
      { id: 3, name: 'Secretary', hierarchy: 3 },
      { id: 4, name: 'Clerk', hierarchy: 4 },
      { id: 5, name: 'IT Admin', hierarchy: 5 },
      { id: 6, name: 'Blotter Officer', hierarchy: 6 },
      { id: 12, name: 'Resident', hierarchy: 12 }
    ];

    for (const reqRole of requiredRoles) {
      const [existing] = await connection.execute('SELECT id FROM roles WHERE id = ?', [reqRole.id]);
      if (existing.length === 0) {
        console.log(`📝 Inserting role: ${reqRole.name} (ID ${reqRole.id})`);
        await connection.execute(`
          INSERT INTO roles (id, role_name, description, hierarchy_level, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, 1, NOW(), NOW())
        `, [reqRole.id, reqRole.name, `${reqRole.name} role`, reqRole.hierarchy]);
      } else {
        console.log(`⏭️ Role already exists: ${reqRole.name} (ID ${reqRole.id})`);
      }
    }

    // STEP 4: Now update user role_ids to match new role IDs
    console.log('\n🔄 Step 4: Updating user role_id assignments...');

    // Map old role IDs to new ones based on the user data we saw earlier
    // superadmin was role_id 1 → should be 5 (IT Admin)
    // captain was role_id 2 → stays 2 (Captain)
    // secretary was role_id 3 → stays 3 (Secretary)
    // clerk was role_id 4 → stays 4 (Clerk)
    // officer was role_id 7 → should be 6 (Blotter Officer)
    // resident was NULL/role_id → should be 12 (Resident)

    // Update based on usernames since role_ids are now NULL
    const userUpdates = [
      { username: 'superadmin', roleId: 5, roleName: 'IT Admin' },
      { username: 'captain', roleId: 2, roleName: 'Captain' },
      { username: 'secretary', roleId: 3, roleName: 'Secretary' },
      { username: 'clerk', roleId: 4, roleName: 'Clerk' },
      { username: 'officer', roleId: 6, roleName: 'Blotter Officer' },
      { username: 'resident', roleId: 12, roleName: 'Resident' }
    ];

    for (const update of userUpdates) {
      const [result] = await connection.execute(
        'UPDATE users SET role_id = ? WHERE username = ? AND is_active = true',
        [update.roleId, update.username]
      );
      if (result.affectedRows > 0) {
        console.log(`✅ ${update.username} → ${update.roleName} (Role ${update.roleId})`);
      }
    }

    // Update any remaining users with role_id NULL to Resident (12)
    const [remainingResult] = await connection.execute(
      'UPDATE users SET role_id = 12 WHERE role_id IS NULL AND is_active = true'
    );
    if (remainingResult.affectedRows > 0) {
      console.log(`✅ ${remainingResult.affectedRows} remaining users → Resident (Role 12)`);
    }

    // Verify final roles
    const [finalRoles] = await connection.execute('SELECT * FROM roles ORDER BY id');
    console.log('\n📊 Final Roles Table:');
    finalRoles.forEach(role => {
      console.log(`✅ ID ${role.id}: ${role.role_name} (hierarchy: ${role.hierarchy_level})`);
    });

    // Verify user assignments
    const [finalUsers] = await connection.execute(`
      SELECT u.username, u.role_id, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = true
      ORDER BY u.username
    `);
    console.log('\n👥 Final User Assignments:');
    finalUsers.forEach(user => {
      console.log(`✅ ${user.username}: ${user.role_name || 'NULL'} (Role ${user.role_id || 'NULL'})`);
    });

    console.log('\n🎉 Roles table synchronization completed successfully!');
    console.log('🔑 Ready for login testing with new role system.');

  } catch (error) {
    console.error('❌ Role table synchronization failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Execute the role table synchronization
if (require.main === module) {
  updateRolesTable()
    .then(() => {
      console.log('\n✅ THEMIS Roles table synchronization completed. Ready for user assignments.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Roles table synchronization failed:', error.message);
      process.exit(1);
    });
}

module.exports = { updateRolesTable };
