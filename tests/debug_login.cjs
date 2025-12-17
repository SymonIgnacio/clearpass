const http = require('http');

function makeRequest(username, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      username: username,
      password: password
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/officer-login',
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
          console.log(`Response for ${username}:`, JSON.stringify(response, null, 2));
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          console.log(`Raw response for ${username}:`, data);
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`Request error for ${username}:`, e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function testLogin() {
  console.log('Testing captain login...');
  try {
    await makeRequest('captain', 'admin123');
  } catch (error) {
    console.log('Test failed:', error.message);
  }
}

testLogin();
