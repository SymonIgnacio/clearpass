/**
 * THEMIS USER ROLE SYNCHRONIZATION
 * Updates existing user roles to match the new THEMIS role mappings
 *
 * New Mappings:
 * - IT_ADMIN = 5 (superadmin)
 * - CAPTAIN = 2 (captain)
 * - SECRETARY = 3 (secretary)
 * - CLERK = 4 (clerk)
 * - BLOTTER_OFFICER = 6 (officer)
 * - RESIDENT = 12 (residents)
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

async function updateUserRoles() {
  let connection;

  try {
    console.log('🔧 THEMIS: Synchronizing user roles to new mappings...');
    connection = await mysql.createConnection(dbConfig);

    // Get current users before update
    const [currentUsers] = await connection.execute(`
      SELECT id, username, role_id, full_name
      FROM users
      WHERE is_active = true
      ORDER BY id
    `);

    console.log('\n📊 Current User Roles:');
    currentUsers.forEach(user => {
      console.log(`• ${user.username}: Role ${user.role_id} (${user.full_name})`);
    });

    // THEMIS ROLE SYNCHRONIZATION MAPPINGS
    console.log('\n🎯 Applying THEMIS Role Mappings:');

    // Update superadmin to IT_ADMIN (5)
    const [superadminResult] = await connection.execute(`
      UPDATE users SET role_id = 5 WHERE username = 'superadmin' AND is_active = true
    `);
    if (superadminResult.affectedRows > 0) {
      console.log('✅ superadmin → IT_ADMIN (Role 5)');
    }

    // Update captain to CAPTAIN (2)
    const [captainResult] = await connection.execute(`
      UPDATE users SET role_id = 2 WHERE username = 'captain' AND is_active = true
    `);
    if (captainResult.affectedRows > 0) {
      console.log('✅ captain → CAPTAIN (Role 2)');
    }

    // Update secretary to SECRETARY (3)
    const [secretaryResult] = await connection.execute(`
      UPDATE users SET role_id = 3 WHERE username = 'secretary' AND is_active = true
    `);
    if (secretaryResult.affectedRows > 0) {
      console.log('✅ secretary → SECRETARY (Role 3)');
    }

    // Update clerk to CLERK (4)
    const [clerkResult] = await connection.execute(`
      UPDATE users SET role_id = 4 WHERE username = 'clerk' AND is_active = true
    `);
    if (clerkResult.affectedRows > 0) {
      console.log('✅ clerk → CLERK (Role 4)');
    }

    // Update officer to BLOTTER_OFFICER (6)
    const [officerResult] = await connection.execute(`
      UPDATE users SET role_id = 6 WHERE username = 'officer' AND is_active = true
    `);
    if (officerResult.affectedRows > 0) {
      console.log('✅ officer → BLOTTER_OFFICER (Role 6)');
    }

    // Update any remaining resident users to RESIDENT (12)
    const [residentResult] = await connection.execute(`
      UPDATE users SET role_id = 12 WHERE role_id NOT IN (2, 3, 4, 5, 6) AND is_active = true
    `);
    if (residentResult.affectedRows > 0) {
      console.log(`✅ ${residentResult.affectedRows} users → RESIDENT (Role 12)`);
    }

    // Verify the updates
    const [updatedUsers] = await connection.execute(`
      SELECT id, username, role_id, full_name
      FROM users
      WHERE is_active = true
      ORDER BY FIELD(role_id, 5, 2, 3, 4, 6, 12), username
    `);

    console.log('\n📊 Updated User Roles:');
    updatedUsers.forEach(user => {
      const roleName = getRoleDisplayName(user.role_id);
      console.log(`✅ ${user.username}: ${roleName} (Role ${user.role_id}) - ${user.full_name}`);
    });

    // Summary
    const roleCounts = {};
    updatedUsers.forEach(user => {
      roleCounts[user.role_id] = (roleCounts[user.role_id] || 0) + 1;
    });

    console.log('\n📈 Role Distribution Summary:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      const roleName = getRoleDisplayName(parseInt(role));
      console.log(`• ${roleName} (Role ${role}): ${count} users`);
    });

    console.log('\n🎉 THEMIS Role synchronization completed successfully!');
    console.log('🔑 Ready for login testing with new role system.');

  } catch (error) {
    console.error('❌ Role synchronization failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

function getRoleDisplayName(role) {
  const roleNames = {
    5: 'IT_ADMIN',
    2: 'CAPTAIN',
    3: 'SECRETARY',
    4: 'CLERK',
    6: 'BLOTTER_OFFICER',
    12: 'RESIDENT'
  };
  return roleNames[role] || `UNKNOWN_ROLE_${role}`;
}

// Execute the role synchronization
if (require.main === module) {
  updateUserRoles()
    .then(() => {
      console.log('\n✅ THEMIS Role synchronization completed. Ready for verification.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Role synchronization failed:', error.message);
      process.exit(1);
    });
}

module.exports = { updateUserRoles };
