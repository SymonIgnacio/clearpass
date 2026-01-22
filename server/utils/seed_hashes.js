const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bmw_barangay_batia',
  port: process.env.DB_PORT || 3306,
};

async function seedUserHashes() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    const password = process.env.SEED_HASH_PASSWORD;
    if (!password) {
      throw new Error('SEED_HASH_PASSWORD is required');
    }
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    console.log('\n🔐 Updating user passwords...');
    console.log(`   Hash: ${hash.substring(0, 20)}...`);

    // Get all staff users (non-resident users)
    const [users] = await connection.execute(
      `SELECT u.id, u.username, r.role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role = r.id 
       WHERE r.role_name != 'Resident' OR r.role_name IS NULL`
    );

    for (const user of users) {
      await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
      console.log(`   ✅ Updated ${user.username} (${user.role_name || 'No Role'})`);
    }

    console.log('\n✅ Password hashes updated successfully!');
    console.log('\n📋 Updated accounts:');
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role_name || 'No Role'})`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seedUserHashes();
