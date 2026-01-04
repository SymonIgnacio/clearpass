#!/usr/bin/env node

const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkSystemHealth() {
  log('🏥 ClearPass System Health Check', 'blue');
  log('=================================\n');

  let overallHealth = true;

  // Check Server Health
  log('🖥️  Server Health Check:', 'blue');
  try {
    const serverPort = process.env.SERVER_PORT || 3001;
    const response = await axios.get(`http://localhost:${serverPort}/health`, {
      timeout: 5000
    });
    
    if (response.status === 200) {
      log('  ✅ Server is running and responding', 'green');
      log(`  📊 Server Status: ${response.data.status}`, 'green');
      log(`  🚀 Port: ${response.data.port}`, 'green');
    }
  } catch (error) {
    log('  ❌ Server is not responding', 'red');
    log(`  💡 Make sure server is running on port ${process.env.SERVER_PORT || 3001}`, 'yellow');
    overallHealth = false;
  }

  // Check Database Health
  log('\n💾 Database Health Check:', 'blue');
  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barangay_management',
      port: process.env.DB_PORT || 3306
    };

    const connection = await mysql.createConnection(dbConfig);
    
    // Test basic connectivity
    await connection.execute('SELECT 1');
    log('  ✅ Database connection successful', 'green');
    
    // Check key tables
    const keyTables = ['users', 'residents', 'households', 'blotter', 'certificates_log'];
    for (const table of keyTables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        log(`  ✅ Table '${table}': ${rows[0].count} records`, 'green');
      } catch (error) {
        log(`  ❌ Table '${table}': Not found or inaccessible`, 'red');
        overallHealth = false;
      }
    }
    
    await connection.end();
  } catch (error) {
    log('  ❌ Database connection failed', 'red');
    log(`  💡 Error: ${error.message}`, 'yellow');
    overallHealth = false;
  }

  // Check AI Service Health
  log('\n🤖 AI Service Health Check:', 'blue');
  const aiServiceEnabled = process.env.AI_SERVICE_ENABLED === 'true';
  
  if (!aiServiceEnabled) {
    log('  ⚠️  AI Service is disabled in configuration', 'yellow');
  } else {
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';
      const response = await axios.get(`${aiServiceUrl}/health`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        log('  ✅ AI Service is running and responding', 'green');
        log(`  🧠 Service: ${response.data.service}`, 'green');
      }
    } catch (error) {
      log('  ❌ AI Service is not responding', 'red');
      log('  💡 Start AI service: cd ai_service && python test_ai_service.py', 'yellow');
      // Don't mark as critical failure since AI is optional
    }
  }

  // Check Environment Configuration
  log('\n⚙️  Environment Configuration Check:', 'blue');
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
  let envHealthy = true;

  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      log(`  ✅ ${varName} is configured`, 'green');
    } else {
      log(`  ❌ ${varName} is missing`, 'red');
      envHealthy = false;
      overallHealth = false;
    }
  });

  if (envHealthy) {
    log('  ✅ All required environment variables are set', 'green');
  }

  // Check API Endpoints
  log('\n🌐 API Endpoints Health Check:', 'blue');
  const serverPort = process.env.SERVER_PORT || 3001;
  const baseUrl = `http://localhost:${serverPort}/api`;
  
  const endpoints = [
    { path: '/auth/login', method: 'POST', description: 'Authentication' },
    { path: '/residents', method: 'GET', description: 'Residents API' },
    { path: '/blotter', method: 'GET', description: 'Blotter API' },
    { path: '/certificates', method: 'GET', description: 'Certificates API' }
  ];

  for (const endpoint of endpoints) {
    try {
      if (endpoint.method === 'GET') {
        // For GET endpoints, we expect 401 (unauthorized) since we're not sending auth
        await axios.get(`${baseUrl}${endpoint.path}`, { timeout: 3000 });
      } else {
        // For POST endpoints, we expect 400 (bad request) for missing data
        await axios.post(`${baseUrl}${endpoint.path}`, {}, { timeout: 3000 });
      }
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 400)) {
        log(`  ✅ ${endpoint.description} endpoint is responding`, 'green');
      } else {
        log(`  ❌ ${endpoint.description} endpoint error: ${error.message}`, 'red');
        overallHealth = false;
      }
    }
  }

  // Overall Health Summary
  log('\n📊 Overall System Health:', 'blue');
  log('==========================');
  
  if (overallHealth) {
    log('✅ System is HEALTHY and ready for use!', 'green');
    log('🚀 All critical components are functioning properly', 'green');
    process.exit(0);
  } else {
    log('❌ System has HEALTH ISSUES that need attention', 'red');
    log('🔧 Please address the issues above before using the system', 'red');
    process.exit(1);
  }
}

// Run health check
checkSystemHealth().catch(error => {
  log('💥 Health check failed with error:', 'red');
  log(error.message, 'red');
  process.exit(1);
});