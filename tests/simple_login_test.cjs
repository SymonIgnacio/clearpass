const http = require('http');

const BASE_URL = 'http://localhost:3001';
const endpoint = '/api/auth/officer-login';

function makeLoginRequest(username, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: username,
      password: password
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function testLogin(username, password) {
  console.log(`Testing login for ${username}...`);
  try {
    const result = await makeLoginRequest(username, password);
    console.log(`Status: ${result.status}`);
    if (result.status === 200) {
      console.log('✅ LOGIN SUCCESSFUL');
      console.log('Token received:', result.data.token ? 'YES' : 'NO');
    } else {
      console.log('❌ LOGIN FAILED');
      console.log('Response:', result.data);
    }
    console.log('---');
    return result.status === 200;
  } catch (error) {
    console.log('❌ REQUEST ERROR:', error.message);
    console.log('---');
    return false;
  }
}

async function runTests() {
  console.log('🧪 TESTING STAFF LOGIN AUTHENTICATION\n');

  const testUsers = [
    { username: 'superadmin', password: 'admin123' },
    { username: 'captain', password: 'admin123' },
    { username: 'secretary', password: 'admin123' },
    { username: 'clerk', password: 'admin123' }
  ];

  let passed = 0;
  let total = testUsers.length;

  for (const user of testUsers) {
    const success = await testLogin(user.username, user.password);
    if (success) passed++;
  }

  console.log(`\n📊 RESULTS: ${passed}/${total} logins successful`);

  if (passed === total) {
    console.log('🎉 ALL LOGIN TESTS PASSED!');
  } else {
    console.log('❌ SOME LOGIN TESTS FAILED');
  }
}

runTests().catch(console.error);
