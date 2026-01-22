const http = require('http');

// Simple fetch implementation for the test since node-fetch/axios might not be available or configured
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest() {
  console.log('🧪 Starting CSRF Test...');

  try {
    // 1. Get CSRF Token
    console.log('\n1. Fetching CSRF Token...');
    const tokenRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/csrf-token',
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });

    console.log('Status:', tokenRes.statusCode);
    
    if (!tokenRes.data || !tokenRes.data.csrfToken) {
      console.error('❌ Failed to get CSRF token');
      process.exit(1);
    }

    const csrfToken = tokenRes.data.csrfToken;
    console.log('Token received:', csrfToken.substring(0, 10) + '...');
    
    // Extract cookies
    const cookies = tokenRes.headers['set-cookie'];
    if (!cookies) {
      console.error('❌ No Set-Cookie header received!');
      process.exit(1);
    }
    console.log('Cookies received:', cookies);

    // Parse _csrf cookie specifically
    const csrfCookie = cookies.find(c => c.startsWith('_csrf='));
    if (!csrfCookie) {
      console.error('❌ _csrf cookie missing from Set-Cookie');
      process.exit(1);
    }

    // 2. Try POST with token and cookie
    console.log('\n2. Attempting POST to /api/certificates with token and cookie...');
    
    // We expect 401/403 (Auth error) NOT 403 (CSRF error)
    // because we are not logged in, but we want to pass the CSRF check.
    
    const postRes = await request({
      hostname: '127.0.0.1',
      port: 3002,
      path: '/api/certificates',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookies.join('; ')
      }
    }, {
      test: 'data'
    });

    console.log('POST Status:', postRes.statusCode);
    console.log('POST Response:', postRes.data);

    if (postRes.data && postRes.data.code === 'EBADCSRFTOKEN') {
      console.error('❌ CSRF Check FAILED: Invalid CSRF token error received');
    } else if (postRes.statusCode === 403 && postRes.data && postRes.data.message === 'ForbiddenError: invalid csrf token') {
       console.error('❌ CSRF Check FAILED: ForbiddenError received');
    } else {
      console.log('✅ CSRF Check PASSED (Server accepted the token)');
      if (postRes.statusCode === 401 || postRes.statusCode === 403) {
        console.log('   (Received expected Auth error, meaning CSRF middleware was passed)');
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

runTest();
