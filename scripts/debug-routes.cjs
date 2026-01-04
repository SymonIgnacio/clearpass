const http = require('http');

console.log('🔍 Route Debugging Test');
console.log('=======================\n');

function testRoute(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      timeout: 3000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`${path}: ${res.statusCode} - ${res.statusMessage}`);
        if (res.statusCode === 404) {
          console.log(`  Headers: ${JSON.stringify(res.headers)}`);
        }
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`${path}: ERROR - ${err.message}`);
      resolve();
    });
    
    req.on('timeout', () => {
      console.log(`${path}: TIMEOUT`);
      resolve();
    });
    
    req.end();
  });
}

async function debugRoutes() {
  const routes = [
    '/health',
    '/api/auth/login',
    '/api/residents',
    '/api/blotter',
    '/api/certificates',
    '/api/documents/requests',
    '/api/users',
    '/api/admin/stats',
    '/api/ai/health'
  ];
  
  for (const route of routes) {
    await testRoute(route);
  }
  
  console.log('\n✅ Route debugging complete');
}

debugRoutes();