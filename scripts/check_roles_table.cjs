const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../server/.env' });

async function checkRolesTable() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management'
  };

  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔍 Checking roles table...');

    // Check if roles table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'roles'");
    if (tables.length === 0) {
      console.log('❌ Roles table does not exist!');
      return;
    }

    const [columns] = await connection.execute('DESCRIBE roles');
    console.log('\n📋 Roles table columns:');
    columns.forEach(col => {
      console.log(`• ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.Key ? `(${col.Key})` : ''}`);
    });

    const [roles] = await connection.execute('SELECT * FROM roles ORDER BY id');
    console.log('\n📊 Roles data:');
    roles.forEach(role => {
      console.log(`• ID: ${role.id}, Name: ${role.role_name}, Hierarchy: ${role.hierarchy_level || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkRolesTable();
