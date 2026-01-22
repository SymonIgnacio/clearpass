const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

// Test user with working credentials
const adminUser = { username: 'testadmin', password: 'password' };

async function testAPIEndpoints() {
  console.log('🧪 TESTING AVAILABLE API ENDPOINTS\n');

  try {
    // Login first
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, adminUser);
    
    if (loginResponse.data && loginResponse.data.token) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Test available endpoints
      const endpoints = [
        '/api/admin/users',
        '/api/admin/roles', 
        '/api/admin/staff',
        '/api/residents',
        '/api/blotter',
        '/api/certificates',
        '/api/documents/requests'
      ];

      console.log('\n2. Testing API endpoints:');
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${BASE_URL}${endpoint}`, { headers, timeout: 3000 });
          console.log(`✅ ${endpoint} - ${response.status} (${Array.isArray(response.data) ? response.data.length : 'object'} items)`);
        } catch (error) {
          const status = error.response?.status || 'ERROR';
          console.log(`❌ ${endpoint} - ${status}`);
          if (error.response?.status === 401) {
            console.log(`   Authentication issue: ${error.response.data?.error || 'Unauthorized'}`);
          }
          if (error.response?.status === 403) {
            console.log(`   Permission denied: ${error.response.data?.error || 'Forbidden'}`);
          }
          if (error.response?.status === 404) {
            console.log(`   Endpoint not found`);
          }
        }
      }

    } else {
      console.log('❌ Login failed - no token received');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
  }
}

testAPIEndpoints();