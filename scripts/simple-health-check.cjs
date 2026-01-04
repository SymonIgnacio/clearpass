const http = require('http');

console.log('🏥 ClearPass System Health Check');
console.log('=================================\n');

// Check if server is running
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Server is running and responding');
      console.log('📊 Server Status: healthy');
      console.log('🚀 Port: 3001');
      console.log('\n🎉 System is ready for testing!');
      process.exit(0);
    } else {
      console.log('❌ Server responded with error:', res.statusCode);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.log('❌ Server is not running');
  console.log('💡 Please start the server first: npm start');
  console.log('   Or run: cd server && npm run dev');
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Server request timed out');
  process.exit(1);
});

req.end();