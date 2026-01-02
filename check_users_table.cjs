const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsersTable() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management'
  });

  try {
    console.log('🔍 Checking users table structure...\n');

    // Get table structure
    const [columns] = await db.execute('DESCRIBE users');
    console.log('Users table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? `KEY(${col.Key})` : ''}`);
    });

    console.log('\n📊 Sample user data:');
    const [users] = await db.execute('SELECT id, username, role FROM users LIMIT 5');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

checkUsersTable();
