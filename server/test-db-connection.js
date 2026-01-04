require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('\n🔍 Testing MySQL Connection...\n');
  console.log('Configuration:');
  console.log('  Host:', process.env.DB_HOST);
  console.log('  User:', process.env.DB_USER);
  console.log('  Password:', process.env.DB_PASSWORD ? '***SET***' : '(empty)');
  console.log('  Database:', process.env.DB_NAME);
  console.log('  Port:', process.env.DB_PORT);
  console.log('');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barangay_management',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connection successful!');
    
    const [rows] = await connection.execute('SELECT DATABASE() as db');
    console.log('✅ Connected to database:', rows[0].db);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 SOLUTIONS:');
    console.log('1. Check if XAMPP MySQL is running');
    console.log('2. Verify MySQL root password in phpMyAdmin');
    console.log('3. Update DB_PASSWORD in server/.env file');
    console.log('4. Or reset MySQL root password to blank\n');
    process.exit(1);
  }
}

testConnection();
