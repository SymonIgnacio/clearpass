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

async function checkUsers() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    console.log('🔍 Checking current users in database...\n');

    const [users] = await connection.execute(
      'SELECT id, username, full_name, role, password_hash, is_active, created_at FROM users ORDER BY username'
    );

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`📊 Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.role})`);
      console.log(`   Full Name: ${user.full_name || 'No name'}`);
      console.log(`   Password Hash: ${user.password_hash ? user.password_hash.substring(0, 32) + '...' : 'No password'}`);
      console.log(`   Active: ${user.is_active ? '✅' : '❌'}`);
      console.log(`   Created: ${user.created_at}\n`);
    });

    console.log('🎯 Expected staff users for hybrid authentication:');
    console.log('- captain (admin123)');
    console.log('- secretary (admin123)');
    console.log('- clerk (admin123)');
    console.log('- superadmin (admin123)');

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUsers();
