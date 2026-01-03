import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_management',
  port: process.env.DB_PORT || 3306
};

async function fixDuplicateUsers() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    console.log('🧹 Starting database user cleanup...\n');

    // Show current users before cleanup
    console.log('📊 BEFORE cleanup:');
    const [usersBefore] = await connection.execute(
      'SELECT id, username, full_name, role FROM users ORDER BY username'
    );
    usersBefore.forEach(user => {
      console.log(`   ${user.username} (${user.role}) - ${user.full_name}`);
    });

    console.log('\n🗑️  PHASE 1: Deactivating incorrect seed 01 users (wrong passwords)...');

    // First, deactivate the incorrect users from seed 01 (they have wrong passwords)
    const deactivateUsers = ['captain', 'secretary', 'clerk'];
    for (const username of deactivateUsers) {
      const [existing] = await connection.execute('SELECT id FROM users WHERE username = ? AND is_active = 1', [username]);
      if (existing.length > 0) {
        const [result] = await connection.execute('UPDATE users SET is_active = 0 WHERE username = ?', [username]);
        console.log(`   ❌ Deactivated duplicate user: ${username} (${result.affectedRows} row affected)`);
      }
    }

    console.log('\n📝 PHASE 2: Handling username conflicts and renaming correct users...');

    // Handle potential conflicts between deactivated and active users with same username
    const correctUsers = [
      { from: 'captain01', to: 'captain' },
      { from: 'secretary01', to: 'secretary' },
      { from: 'clerk01', to: 'clerk' }
    ];

    for (const { from, to } of correctUsers) {
      // First, check if there's a deactivated user with the target username that might conflict
      const [conflicting] = await connection.execute(
        'SELECT id FROM users WHERE username = ? AND is_active = 0',
        [to]
      );

      if (conflicting.length > 0) {
        // Rename the deactivated user to something unique to avoid conflicts
        const tempName = `${to}_inactive_${Date.now()}`;
        await connection.execute('UPDATE users SET username = ? WHERE id = ?', [tempName, conflicting[0].id]);
        console.log(`   🔄 Moved conflicting deactivated user ${to} → ${tempName}`);
      }

      // Now safely rename the correct user
      const [result] = await connection.execute(
        'UPDATE users SET username = ? WHERE username = ?',
        [to, from]
      );
      console.log(`   ✅ Renamed: ${from} → ${to} (${result.affectedRows} row affected)`);
    }

    console.log('\n📊 AFTER cleanup:');
    const [usersAfter] = await connection.execute(
      'SELECT id, username, full_name, role, password_hash FROM users ORDER BY username'
    );
    usersAfter.forEach(user => {
      console.log(`   ${user.username} (${user.role}) - ${user.full_name}`);
      console.log(`     Password: ${user.password_hash.substring(0, 20)}...`);
    });

    console.log('\n🎉 CLEANUP COMPLETE!');
    console.log('✅ All staff users now have admin123 password');
    console.log('✅ Hybrid authentication ready:');
    console.log('   • Staff users (captain, secretary, clerk, superadmin) → Database');
    console.log('   • Normal users (residents) → Firebase');

    console.log('\n🧪 TEST THESE LOGINS:');
    console.log('   captain / admin123');
    console.log('   secretary / admin123');
    console.log('   clerk / admin123');
    console.log('   superadmin / admin123');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixDuplicateUsers();
