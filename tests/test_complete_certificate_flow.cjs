const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function getAdminToken() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    username: 'testadmin',
    password: 'password'
  });
  return response.data.token;
}

async function testCompleteCertificateFlow() {
  console.log('🧪 TESTING COMPLETE CERTIFICATE CREATION FLOW\n');

  try {
    const adminToken = await getAdminToken();
    console.log('✅ Admin login successful');

    // Step 1: Get CSRF token
    console.log('\n1. Getting CSRF token...');
    const csrfResponse = await axios.get(`${BASE_URL}/api/csrf-token`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      timeout: 5000
    });

    console.log('✅ CSRF token response:', csrfResponse.status);
    let csrfToken = null;
    
    if (csrfResponse.data && csrfResponse.data.csrfToken) {
      csrfToken = csrfResponse.data.csrfToken;
      console.log('✅ CSRF token obtained:', csrfToken.substring(0, 20) + '...');
    } else {
      console.log('⚠️ No CSRF token in response');
    }

    if (!csrfToken) {
      console.log('❌ Cannot proceed without CSRF token');
      return false;
    }

    // Step 2: Create certificate with CSRF token
    console.log('\n2. Creating certificate with CSRF token...');
    const certificateData = {
      resident_id: '1',
      certificate_type_id: 1,
      purpose: 'Testing complete certificate creation flow',
      issued_by: 'Test Admin',
      fee: 0
    };

    const certificateResponse = await axios.post(`${BASE_URL}/api/certificates`, certificateData, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      timeout: 5000
    });

    console.log('✅ Certificate creation response:', certificateResponse.status);
    
    if (certificateResponse.status === 200 && certificateResponse.data && certificateResponse.data.id) {
      console.log('✅ Certificate created successfully!');
      console.log('   Certificate ID:', certificateResponse.data.id);
      console.log('   Control Number:', certificateResponse.data.control_no || 'N/A');
      console.log('   Resident Name:', certificateResponse.data.resident_name || 'N/A');
      return true;
    } else {
      console.log('❌ Certificate creation failed');
      if (certificateResponse.data) {
        console.log('   Error:', JSON.stringify(certificateResponse.data, null, 2));
      }
      return false;
    }

  } catch (error) {
    console.log('❌ Certificate flow test failed:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Run test
if (require.main === module) {
  testCompleteCertificateFlow()
    .then(success => {
      console.log(success ? '\n🎉 COMPLETE CERTIFICATE FLOW TEST PASSED!' : '\n❌ COMPLETE CERTIFICATE FLOW TEST FAILED!');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testCompleteCertificateFlow };