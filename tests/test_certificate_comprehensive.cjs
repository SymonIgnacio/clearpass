const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function getAdminToken() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    username: 'testadmin',
    password: 'password'
  });
  return response.data.token;
}

async function getResidentToken() {
  // Try to create/get a resident user first
  try {
    // Test with existing resident user
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'resident',
      password: 'password'  // Try common password
    });
    return response.data.token;
  } catch (error) {
    console.log('⚠️ Resident login not available, using admin for resident tests');
    return null;
  }
}

async function testCertificateServices() {
  console.log('🧪 COMPREHENSIVE CERTIFICATE SERVICES TESTING\n');

  try {
    const adminToken = await getAdminToken();
    const residentToken = await getResidentToken();
    
    const headers = { 
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    console.log('✅ Admin login successful');

    let testsPassed = 0;
    let totalTests = 0;

    // Test 1: Get certificate types (should work with resident token)
    console.log('\n1. Testing certificate types (resident access):');
    totalTests++;
    try {
      const testHeaders = residentToken ? 
        { Authorization: `Bearer ${residentToken}`, 'Content-Type': 'application/json' } :
        headers;
        
      const response = await axios.get(`${BASE_URL}/api/certificate-requests/types`, { 
        headers: testHeaders,
        timeout: 5000 
      });
      
      console.log(`✅ Certificate types: ${response.status} (${Array.isArray(response.data) ? response.data.length : 'object'} items)`);
      if (Array.isArray(response.data)) {
        response.data.slice(0, 3).forEach((type, index) => {
          console.log(`   ${index + 1}. ${type.name || 'N/A'} - ₱${type.fee || 0} (${type.requires_id_photo ? 'ID Photo Required' : 'No Photo Required'})`);
        });
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ Certificate types failed: ${error.response?.status || 'ERROR'}`);
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // Test 2: Get certificate templates (resident access)
    console.log('\n2. Testing certificate templates (resident access):');
    totalTests++;
    try {
      const testHeaders = residentToken ? 
        { Authorization: `Bearer ${residentToken}`, 'Content-Type': 'application/json' } :
        headers;
        
      const response = await axios.get(`${BASE_URL}/api/certificate-requests/templates`, { 
        headers: testHeaders,
        timeout: 5000 
      });
      
      console.log(`✅ Certificate templates: ${response.status} (${Array.isArray(response.data) ? response.data.length : 'object'} items)`);
      if (Array.isArray(response.data)) {
        response.data.slice(0, 3).forEach((template, index) => {
          console.log(`   ${index + 1}. ${template.name || 'N/A'} (${template.template_path || 'No Path'})`);
        });
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ Certificate templates failed: ${error.response?.status || 'ERROR'}`);
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // Test 3: Get all certificate requests (admin access)
    console.log('\n3. Testing all certificate requests (admin access):');
    totalTests++;
    try {
      const response = await axios.get(`${BASE_URL}/api/certificate-requests/admin/all`, { headers });
      console.log(`✅ All certificate requests: ${response.status} (${Array.isArray(response.data) ? response.data.length : 'object'} items)`);
      
      if (Array.isArray(response.data)) {
        console.log('   Sample requests:');
        response.data.slice(0, 3).forEach((req, index) => {
          console.log(`   ${index + 1}. ${req.full_name || 'N/A'} - ${req.certificate_type || 'N/A'} (${req.status})`);
        });
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ All certificate requests failed: ${error.response?.status || 'ERROR'}`);
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // Test 4: Test certificate creation (admin can create directly)
    console.log('\n4. Testing certificate creation (admin access):');
    totalTests++;
    try {
      const sampleCertificate = {
        resident_id: '1', // Use a sample resident ID
        certificate_type_id: 1,
        purpose: 'Testing certificate generation functionality',
        issued_by: 'Test Admin',
        fee: 0
      };

      const response = await axios.post(`${BASE_URL}/api/certificates`, sampleCertificate, { headers });
      console.log(`✅ Certificate creation: ${response.status}`);
      if (response.data && response.data.id) {
        console.log(`   Certificate ID: ${response.data.id}`);
        console.log(`   Control Number: ${response.data.control_no || 'N/A'}`);
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ Certificate creation failed: ${error.response?.status || 'ERROR'}`);
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // Test 5: Get certificates list
    console.log('\n5. Testing certificates list:');
    totalTests++;
    try {
      const response = await axios.get(`${BASE_URL}/api/certificates`, { headers });
      console.log(`✅ Certificates list: ${response.status} (${Array.isArray(response.data) ? response.data.length : 'object'} items)`);
      
      if (Array.isArray(response.data)) {
        response.data.slice(0, 3).forEach((cert, index) => {
          console.log(`   ${index + 1}. ${cert.control_no || 'N/A'} - ${cert.resident_name || 'N/A'} (${cert.certificate_type})`);
        });
        testsPassed++;
      }
    } catch (error) {
      console.log(`❌ Certificates list failed: ${error.response?.status || 'ERROR'}`);
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    // Test 6: Test request status update
    console.log('\n6. Testing request status update:');
    totalTests++;
    try {
      // Get a request to update
      const requestsResponse = await axios.get(`${BASE_URL}/api/certificate-requests/admin/all`, { headers });
      
      if (Array.isArray(requestsResponse.data) && requestsResponse.data.length > 0) {
        const requestId = requestsResponse.data[0].id;
        const updateResponse = await axios.put(
          `${BASE_URL}/api/certificate-requests/${requestId}/status`,
          { status: 'Approved', notes: 'Approved for testing purposes' },
          { headers }
        );
        console.log(`✅ Request status update: ${updateResponse.status}`);
        if (updateResponse.data && updateResponse.data.success) {
          console.log(`   Request ${requestId} status updated to Approved`);
          testsPassed++;
        }
      } else {
        console.log('⚠️ No certificate requests found to test status update');
      }
    } catch (error) {
      console.log(`❌ Request status update failed: ${error.response?.status || 'ERROR'}`);
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    console.log(`\n📊 CERTIFICATE SERVICES TEST RESULTS: ${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
      console.log('🎉 ALL CERTIFICATE SERVICE TESTS PASSED!');
    } else {
      const successRate = Math.round((testsPassed / totalTests) * 100);
      console.log(`⚠️ ${totalTests - testsPassed} TESTS FAILED. Success rate: ${successRate}%`);
    }

  } catch (error) {
    console.log('❌ Certificate services testing failed:', error.message);
  }
}

// Run tests
if (require.main === module) {
  testCertificateServices()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testCertificateServices };