const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function getAdminToken() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    username: 'testadmin',
    password: 'password'
  });
  return response.data.token;
}

async function testCertificateEndpointsGranular() {
  console.log('🧪 TESTING CERTIFICATE ENDPOINTS IN DETAIL\n');

  try {
    const adminToken = await getAdminToken();
    const headers = { 
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    console.log('✅ Admin login successful');

    let testsPassed = 0;
    let totalTests = 0;

    // Test certificate endpoints
    const certificateEndpoints = [
      '/api/certificates',
      '/api/certificate-requests/admin/all',
      '/api/certificate-requests/types',
      '/api/certificate-requests/templates'
    ];

    for (const endpoint of certificateEndpoints) {
      totalTests++;
      console.log(`\nTesting ${endpoint}:`);
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, { 
          headers,
          timeout: 5000 
        });
        
        console.log(`✅ ${endpoint}: ${response.status} (${Array.isArray(response.data) ? response.data.length + ' items' : 'object data'})`);
        testsPassed++;
        
        // Show sample data
        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log('   Sample:', JSON.stringify(response.data[0], null, 2));
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status || 'ERROR'}`);
        if (error.response?.data) {
          console.log('   Error details:', JSON.stringify(error.response.data, null, 2));
        }
      }
    }

    // Test admin-only access (secretary, clerk should also work)
    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/roles',
      '/api/admin/staff'
    ];

    console.log('\n--- Testing Admin Endpoints ---');
    for (const endpoint of adminEndpoints) {
      totalTests++;
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, { 
          headers,
          timeout: 5000 
        });
        
        console.log(`✅ ${endpoint}: ${response.status} (${Array.isArray(response.data) ? response.data.length + ' items' : 'object data'})`);
        testsPassed++;
        
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status || 'ERROR'}`);
        if (error.response?.data) {
          console.log('   Error details:', JSON.stringify(error.response.data, null, 2));
        }
      }
    }

    console.log(`\n📊 CERTIFICATE ENDPOINTS TEST RESULTS: ${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
      console.log('🎉 ALL CERTIFICATE ENDPOINTS ACCESSIBLE!');
    } else {
      const successRate = Math.round((testsPassed / totalTests) * 100);
      console.log(`⚠️ ${totalTests - testsPassed} TESTS FAILED. Success rate: ${successRate}%`);
    }

    // Test certificate creation (this tests different flow)
    console.log('\n--- Testing Certificate Creation ---');
    totalTests++;
    try {
      const sampleCertificate = {
        resident_id: '1',
        certificate_type_id: 1,
        purpose: 'Testing certificate creation API',
        issued_by: 'Test Admin',
        fee_paid: 50
      };

      const response = await axios.post(`${BASE_URL}/api/certificates`, sampleCertificate, { 
        headers,
        timeout: 5000 
      });
      
      console.log(`✅ Certificate creation: ${response.status}`);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
      testsPassed++;
      
    } catch (error) {
      console.log(`❌ Certificate creation: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log('   Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }

    console.log(`\n📊 TOTAL CERTIFICATE TEST RESULTS: ${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
      console.log('🎉 ALL CERTIFICATE SERVICE TESTS PASSED!');
    } else {
      const successRate = Math.round((testsPassed / totalTests) * 100);
      console.log(`⚠️ ${totalTests - testsPassed} TESTS FAILED. Success rate: ${successRate}%`);
    }

  } catch (error) {
    console.log('❌ Certificate testing failed:', error.message);
  }
}

// Run tests
if (require.main === module) {
  testCertificateEndpointsGranular()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testCertificateEndpointsGranular };