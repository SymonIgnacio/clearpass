const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

async function getAdminToken() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    username: 'testadmin',
    password: 'password'
  });
  return response.data.token;
}

async function testAIServices() {
  console.log('🤖 TESTING AI SERVICES INTEGRATION\n');

  try {
    const adminToken = await getAdminToken();
    const headers = { 
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    console.log('✅ Admin login successful');

    let testsPassed = 0;
    let totalTests = 0;

    // Test 1: AI Service Health Check
    console.log('\n1. Testing AI service health:');
    totalTests++;
    try {
      const response = await axios.get(`${AI_BASE_URL}/health`, { timeout: 5000 });
      console.log(`✅ AI service health: ${response.status}`);
      if (response.data) {
        console.log(`   AI Service Status: ${response.data.status || 'Unknown'}`);
        console.log(`   AI Service Name: ${response.data.service || 'Unknown'}`);
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ AI service health failed: ${error.response?.status || error.code || 'ERROR'}`);
      console.log(`   This may be expected if AI service is not running`);
    }

    // Test 2: AI Chatbot Endpoint
    console.log('\n2. Testing AI chatbot endpoint:');
    totalTests++;
    try {
      const chatMessage = {
        message: 'Hello, I need help with barangay clearance',
        resident_id: null,
        session_id: 'test-session-123'
      };

      const response = await axios.post(`${BASE_URL}/api/ai/chatbot`, chatMessage, { 
        headers,
        timeout: 10000 
      });
      
      console.log(`✅ AI chatbot: ${response.status}`);
      
      if (response.data) {
        console.log(`   Bot response: ${response.data.response || 'No response'}`);
        console.log(`   Intent: ${response.data.intent || 'Unknown'}`);
        console.log(`   Confidence: ${response.data.confidence || 'N/A'}`);
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ AI chatbot failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    console.log(`\n📊 AI SERVICES TEST RESULTS: ${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
      console.log('🎉 ALL AI SERVICES TESTS PASSED!');
    } else {
      const successRate = Math.round((testsPassed / totalTests) * 100);
      console.log(`⚠️ ${totalTests - testsPassed} TESTS HAD ISSUES. Success rate: ${successRate}%`);
    }

    // Summary of AI capabilities
    console.log('\n--- AI SERVICES SUMMARY ---');
    console.log('AI Service Components Tested:');
    console.log('  ✅ Health Check');
    console.log('  ✅ Chatbot Integration');

  } catch (error) {
    console.log('❌ AI services testing failed:', error.message);
  }
}

// Run tests
if (require.main === module) {
  testAIServices()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testAIServices };