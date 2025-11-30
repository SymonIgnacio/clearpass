const knex = require('./server/knexfile')[process.env.NODE_ENV || 'development'];
const db = require('knex')(knex);
const bcrypt = require('bcryptjs');

async function addTestUsers() {
  try {
    console.log('Adding test users to database...');

    // Hash passwords
    const captainHash = await bcrypt.hash('captain', 10);
    const secretaryHash = await bcrypt.hash('secretary', 10);
    const clerkHash = await bcrypt.hash('clerk', 10);
    const superAdminHash = await bcrypt.hash('superadmin123', 10);

    // Clear existing users first
    await db('users').del();
    console.log('Cleared existing users');

    // Add test users
    const users = [
      {
        username: 'captain',
        password_hash: captainHash,
        role: 'captain',
        email: 'captain@barangay.gov.ph',
        full_name: 'Barangay Captain',
        is_active: true
      },
      {
        username: 'secretary',
        password_hash: secretaryHash,
        role: 'secretary',
        email: 'secretary@barangay.gov.ph',
        full_name: 'Barangay Secretary',
        is_active: true
      },
      {
        username: 'clerk',
        password_hash: clerkHash,
        role: 'clerk',
        email: 'clerk@barangay.gov.ph',
        full_name: 'Barangay Clerk',
        is_active: true
      },
      {
        username: 'superadmin',
        password_hash: superAdminHash,
        role: 'admin',
        email: 'superadmin@barangay.gov.ph',
        full_name: 'Super Administrator',
        is_active: true
      }
    ];

    await db('users').insert(users);
    console.log('✅ Successfully added test users!');

    // Verify users were added
    const addedUsers = await db('users').select('id', 'username', 'role', 'full_name');
    console.log('Users in database:');
    addedUsers.forEach(user => {
      console.log(`  👤 ${user.username}: ${user.role} - ${user.full_name}`);
    });

    console.log('\n🔐 Login Credentials:');
    console.log('  captain / captain');
    console.log('  secretary / secretary');
    console.log('  clerk / clerk');
    console.log('  superadmin / superadmin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding users:', error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

addTestUsers();
