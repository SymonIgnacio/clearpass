#!/usr/bin/env node

/**
 * API Route Connectivity Audit Script
 *
 * Tests backend API connectivity from frontend perspective
 * Verifies CORS configuration for frontend on port 5174
 * Tests authentication endpoints and JWT flow
 */

const axios = require('axios');
require('dotenv').config({ path: '../server/.env' });

const BACKEND_PORT = process.env.SERVER_PORT || 3001;
const FRONTEND_PORT = 5174; // Target frontend port
const BASE_URL = `http://localhost:${BACKEND_PORT}`;

async function auditAPIRoutes() {
  console.log('🔍 API ROUTE CONNECTIVITY AUDIT');
  console.log('===============================\n');

  const results = {
    serverListening: false,
    corsConfiguration: false,
    authEndpoints: false,
    publicEndpoints: false,
    healthCheck: false
  };

  // Test 1: Server listening check
  console.log('🧪 Test 1: Backend Server Listening');
  try {
    console.log(`   Checking if server is listening on port ${BACKEND_PORT}...`);

    // Try to connect to health endpoint
    const healthResponse = await axios.get(`${BASE_URL}/health`, {
      timeout: 5000,
      validateStatus: () => true // Accept any status code
    });

    if (healthResponse.status >= 200 && healthResponse.status < 500) {
      console.log('✅ Server is listening and responding');
      console.log(`   Health status: ${healthResponse.status}`);
      results.serverListening = true;
      results.healthCheck = true;
    } else {
      console.log(`⚠️  Server responded with status ${healthResponse.status}`);
      results.serverListening = true;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ Server not listening on port ${BACKEND_PORT}`);
      console.log('   🔍 Diagnosis: Backend server may not be running');
      return { status: 'FAILED', reason: 'SERVER_NOT_LISTENING', results };
    } else {
      console.log(`⚠️  Unexpected connection error: ${error.message}`);
      results.serverListening = true; // Server is responding, just not with expected health endpoint
    }
  }

  // Test 2: CORS Configuration for Frontend
  console.log('\n🧪 Test 2: CORS Configuration');
  try {
    console.log(`   Testing CORS from frontend origin (port ${FRONTEND_PORT})...`);

    // Test preflight request (OPTIONS)
    const preflightResponse = await axios.options(`${BASE_URL}/api/auth/login`, {
      headers: {
        'Origin': `http://localhost:${FRONTEND_PORT}`,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      },
      timeout: 5000,
      validateStatus: () => true
    });

    console.log(`   Preflight response status: ${preflightResponse.status}`);

    // Check CORS headers
    const corsHeaders = {
      'access-control-allow-origin': preflightResponse.headers['access-control-allow-origin'],
      'access-control-allow-methods': preflightResponse.headers['access-control-allow-methods'],
      'access-control-allow-headers': preflightResponse.headers['access-control-allow-headers'],
      'access-control-allow-credentials': preflightResponse.headers['access-control-allow-credentials']
    };

    console.log('   CORS headers received:');
    Object.entries(corsHeaders).forEach(([header, value]) => {
      if (value) {
        console.log(`     ${header}: ${value}`);
      }
    });

    // Validate CORS allows frontend origin
    const allowedOrigin = corsHeaders['access-control-allow-origin'];
    if (allowedOrigin === '*' ||
        allowedOrigin === `http://localhost:${FRONTEND_PORT}` ||
        allowedOrigin === 'http://localhost:5174') {
      console.log('✅ CORS configuration allows frontend origin');
      results.corsConfiguration = true;
    } else {
      console.log(`❌ CORS does not allow frontend origin (allowed: ${allowedOrigin})`);
      console.log('   🔍 Diagnosis: Frontend on port 5174 may not be in CORS whitelist');
    }

  } catch (error) {
    console.log(`❌ CORS test failed: ${error.message}`);
    console.log('   🔍 Diagnosis: Backend may not be running or CORS not configured');
  }

  // Test 3: Public Endpoints
  console.log('\n🧪 Test 3: Public Endpoints');
  const publicEndpoints = [
    { path: '/api/certificate-types', method: 'GET', description: 'Certificate Types' },
    { path: '/api/templates/stats', method: 'GET', description: 'Template Stats' },
    { path: '/api/auth/login', method: 'POST', description: 'Login Endpoint' }
  ];

  let publicEndpointsWorking = 0;

  for (const endpoint of publicEndpoints) {
    try {
      console.log(`   Testing ${endpoint.method} ${endpoint.path} (${endpoint.description})...`);

      const config = {
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        timeout: 5000,
        validateStatus: () => true,
        headers: {
          'Origin': `http://localhost:${FRONTEND_PORT}`,
          'Content-Type': 'application/json'
        }
      };

      // Add body for POST requests
      if (endpoint.method === 'POST') {
        config.data = {
          username: 'test',
          password: 'test'
        };
      }

      const response = await axios(config);

      if (response.status >= 200 && response.status < 500) {
        console.log(`     ✅ Status: ${response.status} (${endpoint.description} accessible)`);
        publicEndpointsWorking++;
      } else {
        console.log(`     ⚠️  Unexpected status: ${response.status}`);
      }

    } catch (error) {
      console.log(`     ❌ Failed: ${error.message}`);
    }
  }

  if (publicEndpointsWorking >= 2) {
    console.log('✅ Public endpoints are accessible');
    results.publicEndpoints = true;
  } else {
    console.log(`⚠️  Only ${publicEndpointsWorking}/${publicEndpoints.length} public endpoints working`);
  }

  // Test 4: Authentication Flow
  console.log('\n🧪 Test 4: Authentication Flow');
  try {
    console.log('   Testing login with dummy credentials...');

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'nonexistent',
      password: 'wrongpassword'
    }, {
      timeout: 5000,
      validateStatus: () => true,
      headers: {
        'Origin': `http://localhost:${FRONTEND_PORT}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Login response status: ${loginResponse.status}`);

    // Check for expected authentication failure (should be 401 or similar)
    if (loginResponse.status === 401 || loginResponse.status === 400) {
      console.log('✅ Authentication endpoint responding correctly');
      results.authEndpoints = true;
    } else if (loginResponse.status >= 200 && loginResponse.status < 300) {
      console.log('⚠️  Authentication endpoint accepted invalid credentials');
    } else {
      console.log(`⚠️  Unexpected auth response: ${loginResponse.status}`);
    }

  } catch (error) {
    console.log(`❌ Authentication test failed: ${error.message}`);
  }

  // Test 5: API Route Accessibility
  console.log('\n🧪 Test 5: API Route Pattern Check');
  try {
    console.log('   Testing /api prefix routing...');

    // Try a non-existent API route to see if routing works
    const testResponse = await axios.get(`${BASE_URL}/api/nonexistent-endpoint`, {
      timeout: 5000,
      validateStatus: () => true,
      headers: {
        'Origin': `http://localhost:${FRONTEND_PORT}`
      }
    });

    if (testResponse.status === 404) {
      console.log('✅ API routing is working (404 for non-existent endpoint)');
    } else {
      console.log(`⚠️  Unexpected response for non-existent endpoint: ${testResponse.status}`);
    }

  } catch (error) {
    console.log(`❌ API routing test failed: ${error.message}`);
  }

  // Summary
  console.log('\n🎉 API AUDIT COMPLETE');
  console.log('=====================');

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`✅ ${passedTests}/${totalTests} tests passed`);

  if (results.serverListening && results.corsConfiguration && results.publicEndpoints) {
    console.log('🟢 API Config: Ports Match & CORS Working');
    return { status: 'SUCCESS', results };
  } else {
    console.log('🔴 API Config: Issues detected');

    if (!results.corsConfiguration) {
      console.log('   - CORS configuration needs to allow localhost:5174');
    }
    if (!results.serverListening) {
      console.log('   - Backend server not running on port 3001');
    }
    if (!results.publicEndpoints) {
      console.log('   - Public API endpoints not accessible');
    }

    return { status: 'FAILED', reason: 'API_CONFIGURATION_ISSUES', results };
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  auditAPIRoutes()
    .then(result => {
      console.log('\n📊 Final Result:', result);
      process.exit(result.status === 'SUCCESS' ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Unexpected error during audit:', error);
      process.exit(1);
    });
}

module.exports = { auditAPIRoutes };
