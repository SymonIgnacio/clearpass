const http = require('http');

console.log('📋 ClearPass System Status Report');
console.log('==================================\n');

async function getSystemStatus() {
  // Test basic connectivity
  console.log('🔌 Basic Connectivity:');
  
  try {
    const healthCheck = await makeRequest('/health');
    if (healthCheck.statusCode === 200) {
      console.log('  ✅ Server is running and healthy');
      console.log('  🚀 Port: 3001');
    } else {
      console.log('  ❌ Server health check failed');
      return;
    }
  } catch (error) {
    console.log('  ❌ Server is not responding');
    return;
  }
  
  // Test working endpoints
  console.log('\\n✅ Working Endpoints:');
  const workingEndpoints = [];
  const brokenEndpoints = [];
  
  const testEndpoints = [
    { path: '/api/auth/login', method: 'POST', name: 'Authentication' },
    { path: '/api/residents', method: 'GET', name: 'Residents API' },
    { path: '/api/blotter', method: 'GET', name: 'Blotter API' },
    { path: '/api/certificates', method: 'GET', name: 'Certificates API' },
    { path: '/api/documents/requests', method: 'GET', name: 'Documents API' },
    { path: '/api/users', method: 'GET', name: 'Users API' },
    { path: '/api/admin/stats', method: 'GET', name: 'Admin API' },
    { path: '/api/ai/health', method: 'GET', name: 'AI Health API' }
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await makeRequest(endpoint.path, endpoint.method);
      if (response.statusCode === 401 || response.statusCode === 400 || response.statusCode === 200) {
        console.log(`  ✅ ${endpoint.name} - Responding correctly`);
        workingEndpoints.push(endpoint.name);
      } else if (response.statusCode === 404) {
        console.log(`  ❌ ${endpoint.name} - Route not found (404)`);
        brokenEndpoints.push(endpoint.name);
      } else {
        console.log(`  ⚠️  ${endpoint.name} - Unexpected response (${response.statusCode})`);
        brokenEndpoints.push(endpoint.name);
      }
    } catch (error) {
      console.log(`  ❌ ${endpoint.name} - Request failed`);
      brokenEndpoints.push(endpoint.name);
    }
  }
  
  // Summary
  console.log('\\n📊 System Summary:');
  console.log('==================');
  console.log(`✅ Working Endpoints: ${workingEndpoints.length}`);
  console.log(`❌ Broken Endpoints: ${brokenEndpoints.length}`);
  
  const totalEndpoints = workingEndpoints.length + brokenEndpoints.length;
  const functionalityScore = totalEndpoints > 0 ? Math.round((workingEndpoints.length / totalEndpoints) * 100) : 0;
  
  console.log(`📈 Functionality Score: ${functionalityScore}%`);
  
  // Status assessment
  console.log('\\n🎯 System Status:');
  if (functionalityScore >= 80) {
    console.log('🟢 GOOD - System is mostly functional');
  } else if (functionalityScore >= 50) {
    console.log('🟡 FAIR - System has partial functionality');
  } else {
    console.log('🔴 NEEDS WORK - System has significant issues');
  }
  
  // Recommendations
  console.log('\\n💡 Recommendations:');
  if (brokenEndpoints.length > 0) {
    console.log('  • Restart the server to load latest route changes');
    console.log('  • Check server logs for route loading errors');
    console.log('  • Verify all route files are properly exported');
  } else {
    console.log('  • System is functioning well');
    console.log('  • Ready for frontend integration testing');
  }
  
  console.log('\\n🏁 Testing Complete');
}

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
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
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Timeout')));
    
    if (method === 'POST') {
      req.write('{}');
    }
    
    req.end();
  });
}

getSystemStatus().catch(console.error);