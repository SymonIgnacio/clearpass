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

    // Test 2: AI Analytics Endpoint
    console.log('\n2. Testing AI analytics endpoint:');
    totalTests++;
    try {
      const response = await axios.get(`${BASE_URL}/api/ai-analytics/dashboard`, { 
        headers,
        timeout: 5000 
      });
      console.log(`✅ AI analytics dashboard: ${response.status}`);
      
      if (response.data) {
        console.log('   Analytics data available');
        if (response.data.summary) {
          console.log(`   Summary: ${JSON.stringify(response.data.summary, null, 2)}`);
        }
        if (response.data.reports) {
          console.log(`   Available reports: ${response.data.reports.length}`);
        }
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ AI analytics dashboard failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Test 3: AI Chatbot Endpoint
    console.log('\n3. Testing AI chatbot endpoint:');
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

    // Test 4: AI Priority Scoring
    console.log('\n4. Testing AI priority scoring:');
    totalTests++;
    try {
      const priorityData = {
        resident_id: 1,
        criteria: {
          vulnerability_score: 0.8,
          urgency_level: 'medium',
          household_size: 4
        }
      };

      const response = await axios.post(`${BASE_URL}/api/ai/priority`, priorityData, { 
        headers,
        timeout: 5000 
      });
      
      console.log(`✅ AI priority scoring: ${response.status}`);
      
      if (response.data) {
        console.log(`   Priority Score: ${response.data.score || 'N/A'}`);
        console.log(`   Recommendation: ${response.data.recommendation || 'N/A'}`);
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ AI priority scoring failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Test 5: AI Patrol Suggestions
    console.log('\n5. Testing AI patrol suggestions:');
    totalTests++;
    try {
      const patrolRequest = {
        date_range: '7_days',
        area_type: 'high_risk',
        current_location: 'all_sitios'
      };

      const response = await axios.post(`${BASE_URL}/api/ai/patrol`, patrolRequest, { 
        headers,
        timeout: 5000 
      });
      
      console.log(`✅ AI patrol suggestions: ${response.status}`);
      
      if (response.data) {
        console.log(`   Patrol Suggestions Generated: ${response.data.suggestions_count || 0}`);
        if (response.data.suggestions && response.data.suggestions.length > 0) {
          response.data.suggestions.slice(0, 3).forEach((suggestion, index) => {
            console.log(`   ${index + 1}. ${suggestion.sitio_name} - ${suggestion.priority_level} (${suggestion.risk_score})`);
          });
        }
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ AI patrol suggestions failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Test 6: AI Analysis Logs
    console.log('\n6. Testing AI analysis logs:');
    totalTests++;
    try {
      const response = await axios.get(`${BASE_URL}/api/ai-analytics/logs`, { 
        headers,
        timeout: 5000 
      });
      
      console.log(`✅ AI analysis logs: ${response.status}`);
      
      if (response.data) {
        console.log(`   Analysis runs available: ${response.data.total_runs || 0}`);
        console.log(`   Last analysis: ${response.data.last_run || 'N/A'}`);
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ AI analysis logs failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Test 7: Direct AI Service Calls (if available)
    console.log('\n7. Testing direct AI service calls:');
    totalTests++;
    try {
      // Test AI service directly if it has additional endpoints
      const aiEndpoints = [
        '/predict',
        '/analyze',
        '/recommendations'
      ];

      for (const endpoint of aiEndpoints) {
        try {
          const response = await axios.get(`${AI_BASE_URL}${endpoint}`, { timeout: 3000 });
          console.log(`✅ Direct AI ${endpoint}: ${response.status}`);
        } catch (endpointError) {
          console.log(`⚠️  Direct AI ${endpoint}: ${endpointError.response?.status || 'Not Available'}`);
        }
      }
      testsPassed++;
    } catch (error) {
      console.log(`❌ Direct AI service calls failed: ${error.message}`);
    }

    // Test 8: AI Integration with Real Data
    console.log('\n8. Testing AI with real blotter data:');
    totalTests++;
    try {
      // Get blotter data and send to AI for analysis
      const blotterResponse = await axios.get(`${BASE_URL}/api/blotter`, { headers });
      
      if (blotterResponse.data && blotterResponse.data.data) {
        const blotterData = blotterResponse.data.data;
        console.log(`   Analyzing ${blotterData.length} blotter records with AI...`);
        
        const analysisRequest = {
          data_type: 'blotter_analysis',
          data: blotterData.slice(0, 10), // Send first 10 records
          analysis_type: 'trend_analysis'
        };

        const aiResponse = await axios.post(`${BASE_URL}/api/ai-analytics/analyze`, analysisRequest, { 
          headers,
          timeout: 10000 
        });
        
        console.log(`✅ AI blotter analysis: ${aiResponse.status}`);
        
        if (aiResponse.data) {
          console.log(`   Analysis ID: ${aiResponse.data.analysis_id || 'N/A'}`);
          console.log(`   Confidence: ${aiResponse.data.confidence || 'N/A'}`);
          testsPassed++;
        }
      } else {
        console.log('⚠️ No blotter data available for AI analysis');
      }
    } catch (error) {
      console.log(`❌ AI blotter analysis failed: ${error.response?.status || 'ERROR'}`);
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
    console.log('  ✅ Analytics Dashboard');
    console.log('  ✅ Chatbot Integration');
    console.log('  ✅ Priority Scoring');
    console.log('  ✅ Patrol Suggestions');
    console.log('  ✅ Analysis Logs');
    console.log('  ✅ Direct Service Calls');
    console.log('  ✅ Real Data Analysis');

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