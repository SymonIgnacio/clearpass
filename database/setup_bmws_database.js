#!/usr/bin/env node

/**
 * BMWs Database Setup Script
 * Creates and initializes the bmw_barangay_batia database
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupBMWSDatabase() {
  let connection;

  try {
    console.log('🚀 Setting up BMWs Database...');

    // First connect without specifying database to create it
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS bmw_barangay_batia');
    console.log('✅ Database bmw_barangay_batia created/verified');

    // Close first connection
    await connection.end();

    // Now connect to the specific database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'bmw_barangay_batia',
      multipleStatements: true
    });

    console.log('✅ Connected to bmw_barangay_batia database');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing schema.sql...');

    // Execute the entire schema at once using multipleStatements
    await connection.execute(schemaSQL);

    console.log('✅ Schema executed successfully');

    // Verify tables were created
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = 'bmw_barangay_batia'
      ORDER BY TABLE_NAME
    `);

    console.log('📊 Tables created:');
    tables.forEach(table => {
      console.log(`  ✓ ${table.TABLE_NAME}`);
    });

    // Verify initial data
    const [sitios] = await connection.execute('SELECT COUNT(*) as count FROM sitios');
    const [residents] = await connection.execute('SELECT COUNT(*) as count FROM residents');
    const [officials] = await connection.execute('SELECT COUNT(*) as count FROM officials');
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');

    console.log('\n📈 Initial data loaded:');
    console.log(`  • Sitios: ${sitios[0].count}`);
    console.log(`  • Residents: ${residents[0].count}`);
    console.log(`  • Officials: ${officials[0].count}`);
    console.log(`  • Users: ${users[0].count}`);

    console.log('\n🎉 BMWs Database setup completed successfully!');
    console.log('\n🔧 Next steps:');
    console.log('  1. Start the backend server: node server/index.js');
    console.log('  2. Start the frontend: npm run dev');
    console.log('  3. Start the AI service: cd ai_engine && python suggestion_engine.py');
    console.log('\n📱 Access the application at: http://localhost:5173');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupBMWSDatabase();
