/**
 * THEMIS TRINITY USER SEEDING
 * Seeds the required "Themis Trinity" + Captain + Blotter Officer accounts
 *
 * Required Accounts:
 * - superadmin (IT Admin)
 * - secretary (Secretary)
 * - clerk (Clerk)
 * - captain (Captain)
 * - officer (Blotter Officer)
 *
 * Password: admin123 (bcrypt hashed)
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

async function seedThemisUsers() {
  let connection;

  try {
    console.log('🔧 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);

    console.log('👥 Seeding THEMIS Trinity users...\n');

    // Hash the standard password (admin123)
    const saltRounds = 10;
    const plainPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    console.log('🔐 Generated bcrypt hash for password "admin123"');

    // Define the THEMIS Trinity + required staff accounts
    const themisUsers = [
      {
        username: 'superadmin',
        role_name: 'IT Admin',
        email: 'superadmin@barangay.gov.ph',
        full_name: 'System Administrator',
        position: 'System Administrator',
        description: 'IT Admin account with full system access'
      },
      {
        username: 'secretary',
        role_name: 'Secretary',
        email: 'secretary@barangay.gov.ph',
        full_name: 'Barangay Secretary',
        position: 'Barangay Secretary',
        description: 'Barangay Secretary account for document management'
      },
      {
        username: 'clerk',
        role_name: 'Clerk',
        email: 'clerk@barangay.gov.ph',
        full_name: 'Administrative Clerk',
        position: 'Administrative Clerk',
        description: 'Clerk account for certificate processing'
      },
      {
        username: 'captain',
        role_name: 'Captain',
        email: 'captain@barangay.gov.ph',
        full_name: 'Barangay Captain',
        position: 'Barangay Captain',
        description: 'Barangay Captain account with approval authority'
      },
      {
        username: 'officer',
        role_name: 'Blotter Officer',
        email: 'officer@barangay.gov.ph',
        full_name: 'Chief Tanod',
        position: 'Chief Tanod',
        description: 'Blotter Officer account for incident reporting'
      }
    ];

    console.log('📝 Inserting/updating THEMIS users...\n');

    // Insert/update each user
    for (const user of themisUsers) {
      const [result] = await connection.execute(`
        INSERT INTO users (
          username,
          password_hash,
          role_id,
          email,
          full_name,
          contact_number,
          position,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          ?,
          ?,
          (SELECT id FROM roles WHERE role_name = ?),
          ?,
          ?,
          '',
          ?,
          1,
          NOW(),
          NOW()
        )
        ON DUPLICATE KEY UPDATE
          password_hash = VALUES(password_hash),
          role_id = VALUES(role_id),
          email = VALUES(email),
          full_name = VALUES(full_name),
          position = VALUES(position),
          is_active = VALUES(is_active),
          updated_at = NOW()
      `, [
        user.username,
        hashedPassword,
        user.role_name,
        user.email,
        user.full_name,
        user.position
      ]);

      const action = result.affectedRows === 1 && result.insertId > 0 ? 'Created' : 'Updated';
      console.log(`✅ ${action}: ${user.username} (${user.role_name})`);
    }

    console.log('\n🎉 THEMIS Trinity seeding completed successfully!');
    console.log('\n📋 Seeded Accounts:');
    themisUsers.forEach(user => {
      console.log(`• ${user.username} - ${user.role_name} (${user.position})`);
    });

    console.log('\n🔑 Login Credentials:');
    console.log('Username: [username above]');
    console.log('Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change default passwords after first login!');

    // Verify the seeded users
    console.log('\n🔍 Verifying seeded users...');
    const [verificationRows] = await connection.execute(`
      SELECT
        u.username,
        r.role_name,
        u.full_name,
        u.position,
        u.email,
        u.is_active
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username IN ('superadmin', 'secretary', 'clerk', 'captain', 'officer')
      ORDER BY r.hierarchy_level DESC
    `);

    console.log('\n📊 Verification Results:');
    verificationRows.forEach(row => {
      console.log(`✅ ${row.username} (${row.role_name}) - ${row.full_name} - ${row.is_active ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('❌ User seeding failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Execute the seeding
if (require.main === module) {
  seedThemisUsers()
    .then(() => {
      console.log('\n✅ THEMIS Trinity seeding completed. Ready for verification.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error.message);
      process.exit(1);
    });
}

module.exports = { seedThemisUsers };
