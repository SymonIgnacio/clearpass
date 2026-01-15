const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

const dbName = process.env.DB_NAME_TEST || 'barangay_management_test';

async function nukeTestDb() {
  console.log(`Nuking database '${dbName}'...`);
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
  });

  await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
  console.log(`Database '${dbName}' dropped.`);
  
  await connection.query(`CREATE DATABASE ${dbName}`);
  console.log(`Database '${dbName}' recreated.`);
  
  await connection.end();
}

nukeTestDb().catch(console.error);
