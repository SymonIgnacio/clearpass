#!/usr/bin/env node

/**
 * Database Connection Audit Script
 *
 * Tests database connectivity using exact knexfile configuration
 * Verifies both Railway DATABASE_URL and legacy environment variables
 * Distinguishes between "Access Denied" and "ECONNREFUSED" errors
 */

const mysql = require('mysql2/promise');
const knex = require('knex');
require('dotenv').config({ path: '../server/.env' });

// Database configuration function (same as server/knexfile.js)
function getDatabaseConfig() {
  // Prefer Railway's DATABASE_URL if available
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1), // Remove leading slash
      port: parseInt(url.port) || 3306,
    };
  }

  // Fallback to individual environment variables (legacy support)
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management',
    port: process.env.DB_PORT || 3306,
  };
}

async function auditDatabaseConnection() {
  console.log('🔍 DATABASE CONNECTION AUDIT');
  console.log('==============================\n');

  // Environment variable validation
  console.log('📋 Environment Variables Check:');
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
  const optionalVars = ['DB_PASSWORD', 'DATABASE_URL'];

  const missingRequired = requiredVars.filter(varName =>
    !process.env[varName] || process.env[varName] === null || process.env[varName] === undefined
  );

  if (missingRequired.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingRequired.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n🔧 Please create server/.env with required variables.\n');
    return { status: 'FAILED', reason: 'Missing required environment variables' };
  }

  console.log('✅ Required environment variables present');

  // Display configuration (masking password)
  const config = getDatabaseConfig();
  console.log('\n🔧 Database Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   Has Password: ${!!config.password}`);

  // Test 1: Basic MySQL connection
  console.log('\n🧪 Test 1: Basic MySQL Connection');
  let connection;
  try {
    console.log('   Connecting to MySQL...');
    connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      port: config.port,
      connectTimeout: 10000
    });

    console.log('✅ Basic connection successful');
  } catch (error) {
    console.log(`❌ Basic connection failed: ${error.code} - ${error.message}`);

    if (error.code === 'ECONNREFUSED') {
      console.log('   🔍 Diagnosis: MySQL server not running or wrong host/port');
      return { status: 'FAILED', reason: 'ECONNREFUSED - Server not accessible' };
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('   🔍 Diagnosis: Invalid username/password or insufficient privileges');
      return { status: 'FAILED', reason: 'ACCESS_DENIED - Authentication failed' };
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('   🔍 Diagnosis: Database does not exist');
      return { status: 'FAILED', reason: 'BAD_DB - Database not found' };
    } else {
      console.log(`   🔍 Diagnosis: Unexpected error (${error.code})`);
      return { status: 'FAILED', reason: `UNKNOWN_ERROR - ${error.code}` };
    }
  }

  // Test 2: Simple query execution
  console.log('\n🧪 Test 2: Query Execution');
  try {
    console.log('   Executing SELECT 1 + 1 AS result...');
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');

    if (rows.length > 0 && rows[0].result === 2) {
      console.log('✅ Query executed successfully');
      console.log(`   Result: ${rows[0].result}`);
    } else {
      console.log('❌ Unexpected query result');
      return { status: 'FAILED', reason: 'QUERY_FAILED - Unexpected result' };
    }
  } catch (error) {
    console.log(`❌ Query execution failed: ${error.message}`);
    return { status: 'FAILED', reason: 'QUERY_EXECUTION_FAILED' };
  }

  // Test 3: Database schema check
  console.log('\n🧪 Test 3: Database Schema Check');
  try {
    console.log('   Checking for essential tables...');
    const [tables] = await connection.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ? AND table_name IN ('users', 'residents', 'blotter')
      ORDER BY table_name
    `, [config.database]);

    const foundTables = tables.map(row => row.TABLE_NAME || row.table_name);
    console.log(`   Found tables: ${foundTables.join(', ')}`);

    const essentialTables = ['users', 'residents', 'blotter'];
    const missingTables = essentialTables.filter(table => !foundTables.includes(table));

    if (missingTables.length > 0) {
      console.log(`⚠️  Missing essential tables: ${missingTables.join(', ')}`);
      console.log('   Note: This may be normal if migrations haven\'t run yet');
    } else {
      console.log('✅ All essential tables present');
    }
  } catch (error) {
    console.log(`❌ Schema check failed: ${error.message}`);
    console.log('   Note: This may be expected if database is not fully set up');
  }

  // Test 4: Knex.js connection test
  console.log('\n🧪 Test 4: Knex.js Compatibility');
  try {
    console.log('   Testing Knex.js connection...');
    const knexConfig = {
      client: 'mysql2',
      connection: config,
      pool: { min: 1, max: 5 }
    };

    const knexInstance = knex(knexConfig);
    const result = await knexInstance.raw('SELECT VERSION() as version');
    console.log('✅ Knex.js connection successful');
    console.log(`   MySQL Version: ${result[0][0].version}`);

    await knexInstance.destroy();
  } catch (error) {
    console.log(`❌ Knex.js connection failed: ${error.message}`);
    return { status: 'FAILED', reason: 'KNEX_FAILED' };
  }

  // Cleanup
  if (connection) {
    await connection.end();
  }

  console.log('\n🎉 DATABASE AUDIT COMPLETE');
  console.log('==============================');
  console.log('✅ All database connectivity tests passed');
  console.log('🟢 DB: Connected');

  return { status: 'SUCCESS' };
}

// Run the audit if this script is executed directly
if (require.main === module) {
  auditDatabaseConnection()
    .then(result => {
      console.log('\n📊 Final Result:', result);
      process.exit(result.status === 'SUCCESS' ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Unexpected error during audit:', error);
      process.exit(1);
    });
}

module.exports = { auditDatabaseConnection };
