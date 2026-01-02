const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('🔐 Testing officer login...');

    const response = await fetch('http://localhost:3001/api/auth/officer-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'captain',
        password: 'admin123'
      })
    });

    const result = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));

    if (response.ok && result.token) {
      console.log('✅ Login successful! Token received.');

      // Test token decoding
      const token = result.token;
      const parts = token.split('.');
      if (parts.length === 3) {
        console.log('✅ Token format is valid JWT');

        // Try to decode the payload
        try {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
          const decoded = Buffer.from(paddedBase64, 'base64').toString();
          const payload = JSON.parse(decoded);

          console.log('✅ Token payload decoded successfully:');
          console.log('   User ID:', payload.id);
          console.log('   Username:', payload.username);
          console.log('   Role:', payload.role);
          console.log('   Expires:', payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiry');

        } catch (decodeError) {
          console.error('❌ Token decode failed:', decodeError.message);
        }

      } else {
        console.error('❌ Invalid JWT format');
      }

    } else {
      console.error('❌ Login failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testLogin();
