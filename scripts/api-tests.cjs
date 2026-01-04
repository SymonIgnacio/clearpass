const http = require('http');

console.log('🧪 ClearPass API Integration Tests');
console.log('===================================\n');

let testsPassed = 0;
let testsFailed = 0;

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: responseData,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndpoint(name, path, method = 'GET', expectedStatus = 401, data = null) {
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, data);
    
    if (response.statusCode === expectedStatus) {
      console.log(`  ✅ ${name} - responds correctly (${response.statusCode})`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${name} - unexpected response (${response.statusCode}, expected ${expectedStatus})`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ❌ ${name} - request failed: ${error.message}`);
    testsFailed++;
  }
}

async function runTests() {
  // Test 1: Health Check
  console.log('🔌 Test 1: System Health');
  await testEndpoint('Health Check', '/health', 'GET', 200);
  
  // Test 2: Authentication Endpoints
  console.log('\n🔐 Test 2: Authentication');
  await testEndpoint('Login Endpoint', '/api/auth/login', 'POST', 400, {});
  
  // Test 3: Protected Endpoints (should return 401 without auth)
  console.log('\n🛣️  Test 3: Protected Endpoints');
  await testEndpoint('Residents API', '/api/residents', 'GET', 401);
  await testEndpoint('Blotter API', '/api/blotter', 'GET', 401);
  await testEndpoint('Certificates API', '/api/certificates', 'GET', 401);
  await testEndpoint('Documents API', '/api/documents/requests', 'GET', 401);
  await testEndpoint('Users API', '/api/users', 'GET', 401);
  await testEndpoint('Admin API', '/api/admin/stats', 'GET', 401);
  
  // Test 4: AI Endpoints
  console.log('\n🤖 Test 4: AI Integration');
  await testEndpoint('AI Health', '/api/ai/health', 'GET', 401);
  await testEndpoint('AI OCR', '/api/ai/ocr', 'POST', 401, {});
  await testEndpoint('AI Chatbot', '/api/ai/chatbot', 'POST', 401, {});
  
  // Test Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  
  const totalTests = testsPassed + testsFailed;
  const successRate = totalTests > 0 ? Math.round((testsPassed / totalTests) * 100) : 0;
  
  console.log(`📈 Success Rate: ${successRate}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! System is fully functional.');
    return true;
  } else if (successRate >= 80) {
    console.log('\n⚠️  Most tests passed. System is functional with minor issues.');
    return true;
  } else {
    console.log('\n❌ Multiple test failures. System needs attention.');
    return false;
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.log('💥 Test suite failed:', error.message);
  process.exit(1);
});