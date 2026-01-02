const fetch = require('node-fetch');

async function testLogin() {
  console.log('🧪 Testing superadmin login...\n');

  try {
    const response = await fetch('http://localhost:3001/api/auth/officer-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'superadmin',
        password: 'admin123'
      })
    });

    const result = await response.json();

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log(`Role: ${result.user?.role}`);
      console.log(`Full Name: ${result.user?.full_name}`);
      console.log(`Token received: ${!!result.token}`);
    } else {
      console.log('\n❌ Login failed!');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testLogin();
