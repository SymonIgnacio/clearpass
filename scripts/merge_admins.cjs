/**
 * THEMIS ADMIN CONSOLIDATION
 * Eliminates redundancy between Superadmin and IT Admin entities
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

async function consolidateAdmins() {
  let connection;

  try {
    console.log('🔧 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);

    console.log('📊 Analyzing current admin entities...\n');

    // Phase 1: Analyze current state
    const [currentRoles] = await connection.execute(`
      SELECT id, role_name, hierarchy_level, description
      FROM roles
      WHERE role_name LIKE '%admin%' OR role_name LIKE '%super%'
    `);

    console.log('📋 Current admin roles:');
    currentRoles.forEach(role => {
      console.log(`  - ID ${role.id}: ${role.role_name} (Level ${role.hierarchy_level})`);
    });

    const [currentUsers] = await connection.execute(`
      SELECT u.id, u.username, u.role_id, r.role_name, u.full_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username LIKE '%admin%' OR r.role_name LIKE '%admin%' OR r.role_name LIKE '%super%'
    `);

    console.log('\n📋 Current admin users:');
    currentUsers.forEach(user => {
      console.log(`  - ID ${user.id}: ${user.username} (${user.role_name}) - ${user.full_name}`);
    });

    // Phase 2: Consolidate roles
    console.log('\n🔄 Phase 2: Consolidating roles...');

    // Ensure IT Admin role exists
    const [itAdminRole] = await connection.execute(`
      SELECT id FROM roles WHERE role_name = 'IT Admin'
    `);

    if (itAdminRole.length === 0) {
      // Rename Superadmin to IT Admin if it exists
      const [superadminRole] = await connection.execute(`
        SELECT id FROM roles WHERE role_name = 'Superadmin'
      `);

      if (superadminRole.length > 0) {
        await connection.execute(`
          UPDATE roles SET role_name = 'IT Admin' WHERE role_name = 'Superadmin'
        `);
        console.log('✅ Renamed Superadmin role to IT Admin');
      } else {
        // Create IT Admin role
        await connection.execute(`
          INSERT INTO roles (role_name, hierarchy_level, description, permissions)
          VALUES ('IT Admin', 6, 'System Administrator with full access', '["admin","manage_users","manage_system"]')
        `);
        console.log('✅ Created IT Admin role');
      }
    } else {
      console.log('✅ IT Admin role already exists');
    }

    // Remove redundant admin roles
    const [redundantRoles] = await connection.execute(`
      SELECT id, role_name FROM roles
      WHERE role_name IN ('Superadmin', 'System Admin', 'Admin', 'super_admin')
      AND role_name != 'IT Admin'
    `);

    if (redundantRoles.length > 0) {
      const redundantIds = redundantRoles.map(r => r.id);
      const redundantNames = redundantRoles.map(r => r.role_name);

      // Reassign users to IT Admin
      await connection.execute(`
        UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'IT Admin')
        WHERE role_id IN (${redundantIds.join(',')})
      `);

      // Delete redundant roles
      await connection.execute(`
        DELETE FROM roles WHERE id IN (${redundantIds.join(',')})
      `);

      console.log(`✅ Removed redundant roles: ${redundantNames.join(', ')}`);
    }

    // Phase 3: Consolidate users
    console.log('\n🔄 Phase 3: Consolidating users...');

    // Ensure superadmin user exists with IT Admin role
    const [superadminUser] = await connection.execute(`
      SELECT id FROM users WHERE username = 'superadmin'
    `);

    if (superadminUser.length === 0) {
      // Create superadmin user
      await connection.execute(`
        INSERT INTO users (username, password_hash, role_id, email, full_name, position, is_active)
        VALUES (
          'superadmin',
          '$2a$10$hashed_password_here',
          (SELECT id FROM roles WHERE role_name = 'IT Admin'),
          'superadmin@barangay.gov.ph',
          'System Administrator',
          'System Administrator',
          1
        )
      `);
      console.log('✅ Created superadmin user');
    } else {
      // Ensure existing superadmin has correct role
      await connection.execute(`
        UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'IT Admin')
        WHERE username = 'superadmin'
      `);
      console.log('✅ Updated superadmin user role');
    }

    // Remove any separate it_admin user
    const [itAdminUser] = await connection.execute(`
      SELECT id FROM users WHERE username = 'it_admin'
    `);

    if (itAdminUser.length > 0) {
      await connection.execute(`
        DELETE FROM users WHERE username = 'it_admin'
      `);
      console.log('✅ Removed redundant it_admin user');
    }

    // Phase 4: Verify consolidation
    console.log('\n✅ Phase 4: Verification...');

    const [finalRoles] = await connection.execute(`
      SELECT id, role_name, hierarchy_level, description
      FROM roles
      WHERE role_name LIKE '%admin%' OR role_name LIKE '%super%'
    `);

    const [finalUsers] = await connection.execute(`
      SELECT u.id, u.username, u.role_id, r.role_name, u.full_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username LIKE '%admin%' OR r.role_name LIKE '%admin%' OR r.role_name LIKE '%super%'
    `);

    console.log('\n🎉 CONSOLIDATION COMPLETE!');
    console.log('\n📊 Final Admin Entities:');
    console.log('📋 Roles:');
    finalRoles.forEach(role => {
      console.log(`  - ID ${role.id}: ${role.role_name} (Level ${role.hierarchy_level})`);
    });

    console.log('\n📋 Users:');
    finalUsers.forEach(user => {
      console.log(`  - ID ${user.id}: ${user.username} (${user.role_name}) - ${user.full_name}`);
    });

    console.log('\n✅ Standardization achieved:');
    console.log('  - ONE role: "IT Admin"');
    console.log('  - ONE user: "superadmin" (assigned to IT Admin role)');

  } catch (error) {
    console.error('❌ Consolidation failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Execute the consolidation
if (require.main === module) {
  consolidateAdmins()
    .then(() => {
      console.log('\n✅ Admin consolidation completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Consolidation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { consolidateAdmins };
