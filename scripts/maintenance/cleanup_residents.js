const knex = require('./server/knexfile')[process.env.NODE_ENV || 'development'];
const db = require('knex')(knex);

async function cleanupResidents() {
  try {
    console.log('🧹 Cleaning up resident users from database...');

    // Delete all resident users
    const deleted = await db('users')
      .where('role', 'resident')
      .whereNotNull('firebase_uid')
      .del();

    console.log(`✅ Deleted ${deleted} resident user(s) from database`);

    // Show remaining users
    const remainingUsers = await db('users')
      .select('id', 'username', 'full_name', 'role', 'firebase_uid')
      .orderBy('id');

    console.log('\n📊 Remaining users in database:');
    remainingUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.role}) - Firebase UID: ${user.firebase_uid || 'None'}`);
    });

    // Verify only staff remain
    const staffOnly = remainingUsers.filter(user =>
      ['admin', 'captain', 'secretary', 'clerk'].includes(user.role)
    );

    console.log(`\n✅ Staff users remaining: ${staffOnly.length}`);
    console.log(`❌ Resident users remaining: ${remainingUsers.length - staffOnly.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupResidents();
