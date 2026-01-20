require('dotenv').config({ path: 'server/.env' });
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Testing DB Connection...');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '', // Handle empty password
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    console.log('✅ Connection Successful!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection Failed:', error.message);
    process.exit(1);
  }
}

testConnection();
