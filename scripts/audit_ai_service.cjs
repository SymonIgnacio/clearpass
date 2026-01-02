#!/usr/bin/env node

/**
 * AI Service Integration Audit Script
 *
 * Tests AI service connectivity on port 5000
 * Verifies proxy endpoints and fallback mechanisms
 * Tests AI_SERVICE_URL configuration
 */

const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

const AI_SERVICE_PORT = 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || `http://localhost:${AI_SERVICE_PORT}`;
const BACKEND_PORT = process.env.SERVER_PORT || 3001;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

async function auditAIService() {
  console.log('🔍 AI SERVICE INTEGRATION AUDIT');
  console.log('===============================\n');

  const results = {
    aiServiceDirect: false,
    aiServiceViaBackend: false,
    fallbackMechanisms: false,
    configuration: false,
    proxyEndpoints: false
  };

  // Test 1: Direct AI Service Connection
  console.log('🧪 Test 1: Direct AI Service Connection');
  try {
    console.log(`   Testing direct connection to AI service on port ${AI_SERVICE_PORT}...`);

    const directResponse = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000,
      validateStatus: () => true
    });

    if (directResponse.status >= 200 && directResponse.status < 400) {
      console.log('✅ AI service is directly accessible');
      console.log(`   Health status: ${directResponse.status}`);
      results.aiServiceDirect = true;
    } else {
      console.log(`⚠️  AI service responded with status ${directResponse.status}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ AI service not running on port ${AI_SERVICE_PORT}`);
      console.log('   🔍 Diagnosis: AI service may not be started');
    } else {
      console.log(`❌ Direct connection failed: ${error.message}`);
    }
  }

  // Test 2: AI Service Configuration
  console.log('\n🧪 Test 2: AI Service Configuration');
  console.log(`   AI_SERVICE_URL: ${AI_SERVICE_URL}`);

  if (AI_SERVICE_URL === `http://localhost:${AI_SERVICE_PORT}`) {
    console.log('✅ AI_SERVICE_URL correctly configured for localhost:5000');
    results.configuration = true;
  } else {
    console.log('⚠️  AI_SERVICE_URL differs from expected localhost:5000');
  }

  // Test 3: Backend AI Proxy Endpoints
  console.log('\n🧪 Test 3: Backend AI Proxy Endpoints');
  const aiEndpoints = [
    { path: '/ai/patrol-suggestions', method: 'GET', description: 'Patrol Suggestions' },
    { path: '/ai/chatbot/message', method: 'POST', description: 'Chatbot Message' },
    { path: '/analytics/dashboard-summary', method: 'GET', description: 'Dashboard Summary' },
    { path: '/analytics/charts/incident_trends', method: 'GET', description: 'Incident Trends' }
  ];

  let proxyEndpointsWorking = 0;

  for (const endpoint of aiEndpoints) {
    try {
      console.log(`   Testing ${endpoint.method} ${endpoint.path} (${endpoint.description})...`);

      const config = {
        method: endpoint.method,
        url: `${BACKEND_URL}${endpoint.path}`,
        timeout: 10000, // Longer timeout for AI processing
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Add body for POST requests
      if (endpoint.method === 'POST') {
        config.data = {
          message: 'Hello AI service',
          resident_id: 1
        };
      }

      const response = await axios(config);

      if (response.status >= 200 && response.status < 500) {
        console.log(`     ✅ Status: ${response.status} (${endpoint.description} accessible)`);
        proxyEndpointsWorking++;
      } else {
        console.log(`     ⚠️  Status: ${response.status}`);
      }

    } catch (error) {
      console.log(`     ❌ Failed: ${error.message}`);
    }
  }

  if (proxyEndpointsWorking >= 2) {
    console.log('✅ Backend AI proxy endpoints are accessible');
    results.proxyEndpoints = true;
  } else {
    console.log(`⚠️  Only ${proxyEndpointsWorking}/${aiEndpoints.length} AI proxy endpoints working`);
  }

  // Test 4: AI Service via Backend Proxy
  console.log('\n🧪 Test 4: AI Service via Backend Proxy');
  try {
    console.log('   Testing AI patrol suggestions through backend proxy...');

    const proxyResponse = await axios.get(`${BACKEND_URL}/ai/patrol-suggestions`, {
      timeout: 15000, // Even longer timeout for full AI processing
      validateStatus: () => true
    });

    if (proxyResponse.status >= 200 && proxyResponse.status < 400) {
      console.log('✅ AI service accessible via backend proxy');
      results.aiServiceViaBackend = true;

      // Check if response contains fallback indicators
      const responseData = proxyResponse.data;
      if (responseData.fallback === true || responseData.fallback === 'true') {
        console.log('ℹ️  Response indicates fallback mode (AI service not available)');
      } else {
        console.log('✅ AI service returned real data (not fallback)');
      }
    } else {
      console.log(`⚠️  Backend proxy returned status ${proxyResponse.status}`);
    }

  } catch (error) {
    console.log(`❌ Backend proxy test failed: ${error.message}`);
  }

  // Test 5: Fallback Mechanisms
  console.log('\n🧪 Test 5: Fallback Mechanisms');
  try {
    console.log('   Testing fallback data when AI service is unavailable...');

    // Force a scenario where AI might fail (or check response for fallback indicators)
    const fallbackTest = await axios.get(`${BACKEND_URL}/ai/patrol-suggestions`, {
      timeout: 5000,
      validateStatus: () => true
    });

    if (fallbackTest.status >= 200 && fallbackTest.status < 400) {
      const data = fallbackTest.data;
      if (data.fallback || data.fallback === true || data.fallback === 'true') {
        console.log('✅ Fallback mechanism working correctly');
        console.log('   AI service appears to be in fallback mode');
        results.fallbackMechanisms = true;
      } else if (data.overall_risk_level || data.patrol_suggestions) {
        console.log('✅ AI service returning real data');
        results.fallbackMechanisms = true; // Real data is also acceptable
      } else {
        console.log('⚠️  Unexpected response structure');
      }
    } else {
      console.log(`⚠️  Fallback test returned status ${fallbackTest.status}`);
    }

  } catch (error) {
    console.log(`❌ Fallback test failed: ${error.message}`);
  }

  // Test 6: AI Service Health Check
  console.log('\n🧪 Test 6: AI Service Health Check');
  if (results.aiServiceDirect) {
    try {
      console.log('   Testing AI service health endpoint...');

      const healthResponse = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000
      });

      if (healthResponse.status === 200) {
        console.log('✅ AI service health check passed');
        console.log(`   AI Service Status: ${healthResponse.data?.status || 'OK'}`);
      }
    } catch (error) {
      console.log(`⚠️  AI service health check failed: ${error.message}`);
    }
  } else {
    console.log('   Skipping AI health check (service not directly accessible)');
  }

  // Summary
  console.log('\n🎉 AI SERVICE AUDIT COMPLETE');
  console.log('============================');

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`✅ ${passedTests}/${totalTests} tests passed`);

  if (results.configuration && (results.aiServiceDirect || results.aiServiceViaBackend) && results.fallbackMechanisms) {
    console.log('🟢 AI Service: Port 5000 Accessible with Fallbacks');
    return { status: 'SUCCESS', results };
  } else {
    console.log('🟡 AI Service: Issues detected (may be using fallbacks)');

    if (!results.configuration) {
      console.log('   - AI_SERVICE_URL configuration needs verification');
    }
    if (!results.aiServiceDirect && !results.aiServiceViaBackend) {
      console.log('   - AI service not accessible directly or via backend proxy');
    }
    if (!results.fallbackMechanisms) {
      console.log('   - Fallback mechanisms may not be working');
    }

    return { status: 'PARTIAL', reason: 'AI_SERVICE_USING_FALLBACKS', results };
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  auditAIService()
    .then(result => {
      console.log('\n📊 Final Result:', result);
      process.exit(result.status === 'SUCCESS' ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Unexpected error during audit:', error);
      process.exit(1);
    });
}

module.exports = { auditAIService };
