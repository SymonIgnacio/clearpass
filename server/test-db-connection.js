const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[EMPTY]');
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_PORT:', process.env.DB_PORT);

  try {
    // First, try to connect without specifying a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
    });

    console.log('✅ Connected to MySQL server successfully!');

    // Check if database exists
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === process.env.DB_NAME);
    
    if (dbExists) {
      console.log('✅ Database exists:', process.env.DB_NAME);
    } else {
      console.log('❌ Database does not exist:', process.env.DB_NAME);
      console.log('Creating database...');
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
      console.log('✅ Database created successfully!');
    }

    await connection.end();
    
    // Now test connection to the specific database
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barangay_management',
      port: process.env.DB_PORT || 3306,
    });

    console.log('✅ Connected to database successfully!');
    await dbConnection.end();

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🔧 Possible solutions:');
      console.log('1. Set a password for MySQL root user in XAMPP');
      console.log('2. Or update DB_PASSWORD in .env file');
      console.log('3. Or check if MySQL service is running in XAMPP');
    }
  }
}

testConnection();