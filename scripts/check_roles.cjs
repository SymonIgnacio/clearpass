const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../server/.env' });

async function checkRoles() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management'
  });

  try {
    console.log('🔍 Checking roles table...\n');

    const [roles] = await db.execute('SELECT * FROM roles ORDER BY id');
    console.log('Current roles:');
    roles.forEach(role => {
      console.log(`  ID ${role.id}: ${role.role_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

checkRoles();
