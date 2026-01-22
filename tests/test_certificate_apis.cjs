const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3002';

// Get admin token
async function getAdminToken() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    username: 'testadmin',
    password: 'password'
  });
  return response.data.token;
}

async function testCertificateAPIs() {
  console.log('🧪 TESTING CERTIFICATE SERVICES APIS\n');

  try {
    const token = await getAdminToken();
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('✅ Admin login successful');

    // Test 1: Get certificate types
    console.log('\n1. Testing certificate types endpoint:');
    try {
      const response = await axios.get(`${BASE_URL}/api/certificate-requests/types`, { headers });
      console.log(`✅ Certificate types: ${response.status} (${Array.isArray(response.data) ? response.data.length : 'object'} items)`);
      if (Array.isArray(response.data)) {
        response.data.forEach((type, index) => {
          console.log(`   ${index + 1}. ${type.name} - ₱${type.fee || 0}`);
        });
      }
    } catch (error) {
      console.log(`❌ Certificate types failed: ${error.response?.status || 'ERROR'}`);
    }

    // Test 2: Get certificate templates  
    console.log('\n2. Testing certificate templates endpoint:');
    try {
      const response = await axios.get(`${BASE_URL}/api/certificate-requests/templates`, { headers });
      console.log(`✅ Certificate templates: ${response.status} (${Array.isArray(response.data) ? response.data.length : 'object'} items)`);
      if (Array.isArray(response.data)) {
        response.data.forEach((template, index) => {
          console.log(`   ${index + 1}. ${template.name} (${template.template_path})`);
        });
      }
    } catch (error) {
      console.log(`❌ Certificate templates failed: ${error.response?.status || 'ERROR'}`);
    }

    // Test 3: Get certificate requests (admin view)
    console.log('\n3. Testing all certificate requests endpoint:');
    try {
      const response = await axios.get(`${BASE_URL}/api/certificate-requests/admin/all`, { headers });
      console.log(`✅ All certificate requests: ${response.status} (${Array.isArray(response.data) ? response.data.length : 'object'} items)`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log('   Sample requests:');
        response.data.slice(0, 3).forEach((req, index) => {
          console.log(`   ${index + 1}. ${req.full_name} - ${req.certificate_type} (${req.status})`);
        });
      }
    } catch (error) {
      console.log(`❌ All certificate requests failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data)}`);
      }
    }

    // Test 4: Create a certificate request
    console.log('\n4. Testing certificate request creation:');
    try {
      const sampleRequest = {
        certificate_type_id: 1,
        purpose: 'Testing certificate request functionality',
        full_name: 'Test User',
        contact_number: '09123456789',
        email: 'test@example.com'
      };

      const response = await axios.post(`${BASE_URL}/api/certificate-requests/submit`, sampleRequest, { headers });
      console.log(`✅ Certificate request created: ${response.status}`);
      console.log(`   Request ID: ${response.data.request_id || 'N/A'}`);
      console.log(`   Status: ${response.data.status || 'N/A'}`);
      
      // Test 5: Update request status (if creation successful)
      if (response.data.request_id) {
        console.log('\n5. Testing request status update:');
        try {
          const updateResponse = await axios.put(
            `${BASE_URL}/api/certificate-requests/${response.data.request_id}/status`,
            { status: 'Approved', notes: 'Approved for testing' },
            { headers }
          );
          console.log(`✅ Request status updated: ${updateResponse.status}`);
        } catch (error) {
          console.log(`❌ Status update failed: ${error.response?.status || 'ERROR'}`);
        }
      }
    } catch (error) {
      console.log(`❌ Certificate request creation failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data)}`);
      }
    }

    // Test 6: Test certificate generation endpoint
    console.log('\n6. Testing certificate generation:');
    try {
      // First get a certificate request to generate
      const requestsResponse = await axios.get(`${BASE_URL}/api/certificate-requests/admin/all`, { headers });
      if (Array.isArray(requestsResponse.data) && requestsResponse.data.length > 0) {
        const requestId = requestsResponse.data[0].id;
        const generateResponse = await axios.post(
          `${BASE_URL}/api/certificates/generate`,
          { request_id: requestId },
          { headers }
        );
        console.log(`✅ Certificate generation: ${generateResponse.status}`);
        if (generateResponse.data.file_path) {
          console.log(`   Generated file: ${generateResponse.data.file_path}`);
        }
      } else {
        console.log('⚠️ No certificate requests found to test generation');
      }
    } catch (error) {
      console.log(`❌ Certificate generation failed: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data)}`);
      }
    }

  } catch (error) {
    console.log('❌ Certificate API tests failed:', error.message);
  }
}

// Run tests
if (require.main === module) {
  testCertificateAPIs()
    .then(() => {
      console.log('\n🎯 Certificate services testing completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testCertificateAPIs };