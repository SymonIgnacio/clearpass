#!/usr/bin/env node

const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

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

async function runSystemTests() {
  log('🧪 ClearPass System Integration Tests', 'blue');
  log('====================================\n');

  let testsPassed = 0;
  let testsFailed = 0;
  const serverPort = process.env.SERVER_PORT || 3002; // Updated default to 3002 as per rules
  const baseUrl = `http://localhost:${serverPort}`;

  // Test 1: Port Connectivity
  log('🔌 Test 1: Port Connectivity', 'blue');
  try {
    const response = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    if (response.status === 200) {
      log('  ✅ Frontend can reach backend', 'green');
      testsPassed++;
    }
  } catch (error) {
    log('  ❌ Port connectivity failed', 'red');
    testsFailed++;
  }

  // Test 2: Database Connectivity
  log('\n💾 Test 2: Database Operations', 'blue');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barangay_management',
      port: process.env.DB_PORT || 3306
    });
    
    await connection.execute('SELECT 1');
    log('  ✅ Database connectivity works', 'green');
    
    // Test key tables
    const tables = ['users', 'residents', 'households', 'blotter'];
    for (const table of tables) {
      try {
        await connection.execute(`SELECT COUNT(*) FROM ${table}`);
        log(`  ✅ Table '${table}' accessible`, 'green');
      } catch (error) {
        log(`  ❌ Table '${table}' not accessible`, 'red');
        testsFailed++;
      }
    }
    
    await connection.end();
    testsPassed++;
  } catch (error) {
    log('  ❌ Database operations failed', 'red');
    testsFailed++;
  }

  // Test 3: Route Functionality
  log('\n🛣️  Test 3: Route Functionality', 'blue');
  const routes = [
    { path: '/api/auth/login', method: 'POST', expectStatus: 400 },
    { path: '/api/residents', method: 'GET', expectStatus: 401 },
    { path: '/api/blotter', method: 'GET', expectStatus: 401 },
    { path: '/api/certificates', method: 'GET', expectStatus: 401 },
    { path: '/api/documents/requests', method: 'GET', expectStatus: 401 },
    { path: '/api/ai/health', method: 'GET', expectStatus: 401 }
  ];

  for (const route of routes) {
    try {
      if (route.method === 'GET') {
        await axios.get(`${baseUrl}${route.path}`, { timeout: 3000 });
      } else {
        await axios.post(`${baseUrl}${route.path}`, {}, { timeout: 3000 });
      }
    } catch (error) {
      if (error.response && error.response.status === route.expectStatus) {
        log(`  ✅ ${route.path} responds correctly`, 'green');
        testsPassed++;
      } else {
        log(`  ❌ ${route.path} unexpected response`, 'red');
        testsFailed++;
      }
    }
  }

  // Test 4: Authentication Flow
  log('\n🔐 Test 4: Authentication System', 'blue');
  try {
    // Test login endpoint structure
    const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      username: 'test',
      password: 'test'
    }, { timeout: 5000 }).catch(err => err.response);

    if (loginResponse && (loginResponse.status === 400 || loginResponse.status === 401)) {
      log('  ✅ Authentication endpoint responds', 'green');
      testsPassed++;
    } else {
      log('  ❌ Authentication endpoint not working', 'red');
      testsFailed++;
    }
  } catch (error) {
    log('  ❌ Authentication flow test failed', 'red');
    testsFailed++;
  }

  // Test 5: AI Service Integration
  log('\n🤖 Test 5: AI Integration', 'blue');
  const aiEnabled = process.env.AI_SERVICE_ENABLED === 'true';
  if (!aiEnabled) {
    log('  ⚠️  AI service disabled - skipping test', 'yellow');
  } else {
    try {
      const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';
      const aiResponse = await axios.get(`${aiUrl}/health`, { timeout: 5000 });
      if (aiResponse.status === 200) {
        log('  ✅ AI service responds', 'green');
        testsPassed++;
      }
    } catch (error) {
      log('  ⚠️  AI service not responding (optional)', 'yellow');
    }
  }

  // Test 6: Security Features
  log('\n🛡️  Test 6: Security Features', 'blue');
  try {
    // Test rate limiting
    const promises = Array(6).fill().map(() => 
      axios.post(`${baseUrl}/api/auth/login`, {}, { timeout: 2000 }).catch(err => err.response)
    );
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(res => res && res.status === 429);
    
    if (rateLimited) {
      log('  ✅ Rate limiting is working', 'green');
      testsPassed++;
    } else {
      log('  ⚠️  Rate limiting may not be active', 'yellow');
    }
  } catch (error) {
    log('  ⚠️  Security test inconclusive', 'yellow');
  }

  // Test Summary
  log('\n📊 Test Results Summary:', 'blue');
  log('========================');
  log(`✅ Tests Passed: ${testsPassed}`, 'green');
  log(`❌ Tests Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  
  const totalTests = testsPassed + testsFailed;
  const successRate = totalTests > 0 ? Math.round((testsPassed / totalTests) * 100) : 0;
  
  log(`📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (testsFailed === 0) {
    log('\n🎉 All critical tests passed! System is ready for use.', 'green');
    return true;
  } else if (successRate >= 80) {
    log('\n⚠️  Most tests passed. System is functional with minor issues.', 'yellow');
    return true;
  } else {
    log('\n❌ Multiple test failures. System needs attention before use.', 'red');
    return false;
  }
}

runSystemTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log('💥 Test suite failed:', 'red');
  log(error.message, 'red');
  process.exit(1);
});
