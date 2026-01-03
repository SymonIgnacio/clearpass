const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../server/.env' });

async function checkUsersStructure() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management'
  };

  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔍 Checking users table structure...');

    const [columns] = await connection.execute('DESCRIBE users');
    console.log('\n📋 Users table columns:');
    columns.forEach(col => {
      console.log(`• ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.Key ? `(${col.Key})` : ''}`);
    });

    console.log('\n📊 Current users data:');
    const [users] = await connection.execute('SELECT * FROM users LIMIT 10');
    users.forEach(user => {
      console.log(`• ID: ${user.id}, Username: ${user.username}, Role: ${user.role || 'NO ROLE COLUMN'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUsersStructure();
