const fetch = require('node-fetch');

// Test officer login function
async function testOfficerLogin() {
  try {
    console.log('Testing officer login for superadmin...');

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

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const data = await response.json();
    console.log('Response data:');

    if (response.ok) {
      console.log('SUCCESS: Login successful!');
      console.log('Token:', data.token ? 'Present' : 'Missing');
      console.log('User:', JSON.stringify(data.user, null, 2));
    } else {
      console.log('FAILED: Login failed!');
      console.log('Error:', data.error || data.message || 'Unknown error');
    }

  } catch (error) {
    console.log('NETWORK ERROR:', error.message);
  }
}

testOfficerLogin();
