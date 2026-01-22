const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function getAdminToken() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    username: 'testadmin',
    password: 'password'
  });
  return response.data.token;
}

async function getOfficerToken() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'officer',
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.log('⚠️ Officer login failed, using admin token for officer tests');
    return null;
  }
}

async function testBlotterSystem() {
  console.log('🧪 TESTING BLOTTER SYSTEM APIS\n');

  try {
    const adminToken = await getAdminToken();
    const officerToken = await getOfficerToken();
    
    const adminHeaders = { 
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    console.log('✅ Admin login successful');
    if (officerToken) {
      console.log('✅ Officer login successful');
    }

    let testsPassed = 0;
    let totalTests = 0;

    // Test 1: Get blotter list (admin access)
    console.log('\n1. Testing blotter list (admin access):');
    totalTests++;
    try {
      const response = await axios.get(`${BASE_URL}/api/blotter`, { headers: adminHeaders });
      console.log(`✅ Blotter list: ${response.status} (${typeof response.data === 'object' ? 'object data' : Array.isArray(response.data) ? response.data.length + ' items' : 'unknown'})`);
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log(`   Found ${response.data.data.length} blotter cases`);
          response.data.data.slice(0, 3).forEach((blotter, index) => {
            console.log(`   ${index + 1}. Case: ${blotter.case_number || 'N/A'} - ${blotter.complainant_name || 'N/A'} (${blotter.status})`);
          });
        }
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ Blotter list failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Test 2: Create blotter entry (admin access)
    console.log('\n2. Testing blotter creation:');
    totalTests++;
    try {
      const sampleBlotter = {
        case_number: 'BLOT-2026-01-0001',
        complainant_name: 'Test Complainant',
        respondent_name: 'Test Respondent',
        incident_type: 'Civil Dispute',
        incident_date: '2026-01-22',
        incident_time: '14:00:00',
        location_address: 'Test Address',
        sitio_id: 1,
        description: 'Testing blotter creation functionality',
        severity: 'Medium',
        status: 'Pending'
      };

      const response = await axios.post(`${BASE_URL}/api/blotter`, sampleBlotter, { headers: adminHeaders });
      console.log(`✅ Blotter creation: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      testsPassed++;
      
      // Test 3: Update the created blotter entry
      if (response.data && response.data.id) {
        const blotterId = response.data.id;
        console.log('\n3. Testing blotter update:');
        totalTests++;
        try {
          const updateData = {
            status: 'Scheduled',
            notes: 'Scheduled for hearing',
            schedule_date: '2026-01-25'
          };

          const updateResponse = await axios.put(`${BASE_URL}/api/blotter/${blotterId}`, updateData, { headers: adminHeaders });
          console.log(`✅ Blotter update: ${updateResponse.status}`);
          testsPassed++;
        } catch (error) {
          console.log(`❌ Blotter update failed: ${error.response?.status || 'ERROR'}`);
          if (error.response?.data) {
            console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Blotter creation failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Test 4: Get blotter requests (resident complaints)
    console.log('\n4. Testing blotter requests:');
    totalTests++;
    try {
      const response = await axios.get(`${BASE_URL}/api/blotter-requests`, { headers: adminHeaders });
      console.log(`✅ Blotter requests: ${response.status} (${Array.isArray(response.data) ? response.data.length + ' items' : 'object data'})`);
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        response.data.slice(0, 3).forEach((request, index) => {
          console.log(`   ${index + 1}. ${request.complainant_name || 'N/A'} - ${request.incident_type || 'N/A'} (${request.status})`);
        });
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ Blotter requests failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Test 5: Test case management endpoints
    console.log('\n5. Testing case management:');
    totalTests++;
    try {
      const response = await axios.get(`${BASE_URL}/api/case-management/cases`, { headers: adminHeaders });
      console.log(`✅ Case management: ${response.status} (${typeof response.data === 'object' ? 'object data' : Array.isArray(response.data) ? response.data.length + ' items' : 'unknown'})`);
      
      if (response.data && typeof response.data === 'object') {
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ Case management failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Test 6: Test blotter participants
    console.log('\n6. Testing blotter participants:');
    totalTests++;
    try {
      const response = await axios.get(`${BASE_URL}/api/blotter/participants`, { headers: adminHeaders });
      console.log(`✅ Blotter participants: ${response.status} (${Array.isArray(response.data) ? response.data.length + ' items' : 'object data'})`);
      
      if (Array.isArray(response.data)) {
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ Blotter participants failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }

    // Test 7: Check for specific case formats and validation
    console.log('\n7. Testing case number format validation:');
    totalTests++;
    try {
      // Test invalid case number
      const invalidCase = {
        case_number: 'INVALID-FORMAT',
        complainant_name: 'Test',
        incident_type: 'Test',
        incident_date: '2026-01-22',
        description: 'Testing validation'
      };

      const response = await axios.post(`${BASE_URL}/api/blotter`, invalidCase, { headers: adminHeaders });
      console.log(`❌ Invalid case creation should fail but got: ${response.status}`);
      // We expect this to fail, so if it succeeds, that's actually a test failure
      
    } catch (error) {
      if (error.response && (error.response.status === 400 || error.response.status === 422)) {
        console.log(`✅ Case number validation working: ${error.response.status}`);
        testsPassed++;
      } else {
        console.log(`❌ Unexpected validation response: ${error.response?.status || 'ERROR'}`);
      }
    }

    console.log(`\n📊 BLOTTER SYSTEM TEST RESULTS: ${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
      console.log('🎉 ALL BLOTTER SYSTEM TESTS PASSED!');
    } else {
      const successRate = Math.round((testsPassed / totalTests) * 100);
      console.log(`⚠️ ${totalTests - testsPassed} TESTS FAILED. Success rate: ${successRate}%`);
    }

  } catch (error) {
    console.log('❌ Blotter system testing failed:', error.message);
  }
}

// Run tests
if (require.main === module) {
  testBlotterSystem()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testBlotterSystem };