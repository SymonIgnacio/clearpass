const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function getAdminToken() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    username: 'testadmin',
    password: 'password'
  });
  return response.data.token;
}

async function getCSRFToken(adminToken) {
  try {
    // Get a page that should have CSRF token
    const response = await axios.get(`${BASE_URL}/api/certificates`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      timeout: 5000
    });
    
    // Extract CSRF token from cookies
    const cookies = response.headers['set-cookie'];
    if (cookies && cookies.length > 0) {
      const csrfCookie = cookies.find(cookie => cookie.includes('csrfToken'));
      if (csrfCookie) {
        const match = csrfCookie.match(/csrfToken=([^;]+)/);
        return match ? match[1] : null;
      }
    }
    return null;
  } catch (error) {
    console.log('Error getting CSRF token:', error.message);
    return null;
  }
}

async function testCertificateCreationWithCSRF() {
  console.log('🧪 TESTING CERTIFICATE CREATION WITH CSRF TOKEN\n');

  try {
    const adminToken = await getAdminToken();
    const csrfToken = await getCSRFToken(adminToken);
    
    console.log('Admin token obtained');
    console.log('CSRF token obtained:', csrfToken ? 'Yes' : 'No');

    if (csrfToken) {
      const headers = { 
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      };

      const certificateData = {
        resident_id: '1',
        certificate_type_id: 1,
        purpose: 'Testing certificate creation with CSRF token',
        issued_by: 'Test Admin',
        fee: 0
      };

      const response = await axios.post(`${BASE_URL}/api/certificates`, certificateData, { 
        headers,
        timeout: 5000 
      });

      console.log('✅ Certificate creation with CSRF:', response.status);
      if (response.data && response.data.id) {
        console.log('   Certificate ID:', response.data.id);
        console.log('   Control Number:', response.data.control_no || 'N/A');
        return true;
      } else {
        console.log('   Response:', JSON.stringify(response.data, null, 2));
      }
    } else {
      console.log('⚠️ Could not obtain CSRF token');
    }
  } catch (error) {
    console.log('❌ Certificate creation with CSRF failed:', error.response?.status || 'ERROR');
    if (error.response?.data) {
      console.log('   Error:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  return false;
}

// Run test
if (require.main === module) {
  testCertificateCreationWithCSRF()
    .then(success => {
      console.log(success ? '\n✅ Certificate creation test PASSED!' : '\n❌ Certificate creation test FAILED!');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testCertificateCreationWithCSRF };