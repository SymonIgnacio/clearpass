#!/usr/bin/env node

const axios = require('axios');

async function testCaptainReadOnly() {
  console.log('🔒 Testing Captain Read-Only Enforcement...\n');

  const baseURL = 'http://localhost:3002/api';
  
  try {
    // Test login as captain
    console.log('1. Logging in as captain...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: 'captain',
      password: 'captain123'
    });
    
    const token = loginResponse.data.data.user;
    console.log(`✅ Login successful - Role: ${token.role} (${token.role_name})`);
    
    // Get auth cookie
    const cookies = loginResponse.headers['set-cookie'];
    const authCookie = cookies?.find(cookie => cookie.startsWith('authToken='));
    
    if (!authCookie) {
      console.log('❌ No auth cookie found');
      return;
    }
    
    const headers = {
      'Cookie': authCookie,
      'Content-Type': 'application/json'
    };
    
    // Test GET request (should work)
    console.log('\n2. Testing GET request (should work)...');
    try {
      const getResponse = await axios.get(`${baseURL}/residents`, { headers });
      console.log('✅ GET request successful');
    } catch (error) {
      console.log(`❌ GET request failed: ${error.response?.status} ${error.response?.data?.error?.message}`);
    }
    
    // Test POST request (should be blocked)
    console.log('\n3. Testing POST request (should be blocked)...');
    try {
      const postResponse = await axios.post(`${baseURL}/blotter`, {
        Complainant_Details: { name: 'Test' },
        Incident_Type: 'Physical Injury',
        Narrative: 'Test case',
        Location_Sitio: 'Batia Proper'
      }, { headers });
      console.log('❌ POST request succeeded (should have been blocked!)');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ POST request correctly blocked (403 Forbidden)');
        console.log(`   Message: ${error.response.data.message || error.response.data.error?.message}`);
      } else {
        console.log(`⚠️  POST request failed with unexpected error: ${error.response?.status}`);
      }
    }
    
    // Test PUT request (should be blocked)
    console.log('\n4. Testing PUT request (should be blocked)...');
    try {
      const putResponse = await axios.put(`${baseURL}/residents/RES-123`, {
        first_name: 'Updated'
      }, { headers });
      console.log('❌ PUT request succeeded (should have been blocked!)');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ PUT request correctly blocked (403 Forbidden)');
      } else {
        console.log(`⚠️  PUT request failed with unexpected error: ${error.response?.status}`);
      }
    }
    
    console.log('\n🎉 Captain read-only enforcement test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.status === 401) {
      console.log('   Check if captain user exists with correct credentials');
    }
  }
}

// Only run if server is available
axios.get('http://localhost:3002/health')
  .then(() => testCaptainReadOnly())
  .catch(() => console.log('❌ Server not running on port 3002'));