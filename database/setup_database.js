// Database setup script for Barangay Management System
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function setupDatabase() {
  let connection;
  
  try {
    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS barangay_batia');
    console.log('Database "barangay_batia" created or already exists');

    // Use the database
    await connection.query('USE barangay_batia');
    console.log('Using database "barangay_batia"');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    console.log('Database schema created successfully');

    // Read and execute mock data
    const mockDataPath = path.join(__dirname, 'mock_data.sql');
    const mockDataSQL = await fs.readFile(mockDataPath, 'utf8');
    
    // Split mock data into individual statements
    const dataStatements = mockDataSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of dataStatements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    console.log('Mock data inserted successfully');

    // Verify setup by checking table counts
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`\nDatabase setup complete! Created ${tables.length} tables:`);
    
    for (const table of tables) {
      const tableName = table[`Tables_in_barangay_batia`];
      const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`- ${tableName}: ${count[0].count} records`);
    }

    console.log('\n✅ Barangay Management System database is ready!');
    console.log('📊 Database: barangay_batia');
    console.log('🏠 Total Residents: ~48,000 (sample data provided)');
    console.log('📍 Sitios: 4 (Batia Proper, Northville 5, St. Martha, AFP/PNP)');
    console.log('📋 Certificate Types: 8 available');
    console.log('👥 User Roles: Admin, Captain, Secretary, Clerk, Blotter Officer, Issuance Officer, Resident');

  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };