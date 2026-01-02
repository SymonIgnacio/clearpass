/**
 * THEMIS OFFICER LOGIN TEST
 * Tests the officer login functionality with the updated role system
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

async function testOfficerLogin() {
  console.log('🧪 THEMIS: Testing Officer Login with New Role System...\n');

  // Test credentials
  const testUsers = [
    { username: 'superadmin', password: 'admin123', expectedRole: 5, expectedName: 'IT Admin' },
    { username: 'captain', password: 'admin123', expectedRole: 2, expectedName: 'Captain' },
    { username: 'secretary', password: 'admin123', expectedRole: 3, expectedName: 'Secretary' },
    { username: 'clerk', password: 'admin123', expectedRole: 4, expectedName: 'Clerk' },
    { username: 'officer', password: 'admin123', expectedRole: 6, expectedName: 'Blotter Officer' }
  ];

  for (const testUser of testUsers) {
    console.log(`🔐 Testing login for ${testUser.username}...`);

    try {
      const response = await fetch(`${API_BASE}/api/auth/officer-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ ${testUser.username} login successful!`);
        console.log(`   Role: ${result.user.role} (${result.user.role === testUser.expectedRole ? '✓' : '✗'})`);
        console.log(`   Full Name: ${result.user.full_name}`);
        console.log(`   Token received: ${result.token ? '✓' : '✗'}\n`);
      } else {
        console.log(`❌ ${testUser.username} login failed: ${result.error}\n`);
      }

    } catch (error) {
      console.log(`❌ ${testUser.username} login error: ${error.message}\n`);
    }
  }

  console.log('🎯 THEMIS Officer Login Test Complete!');
  console.log('\n📋 Expected Results:');
  console.log('• superadmin: Role 5 (IT Admin) - Universal Access');
  console.log('• captain: Role 2 (Captain)');
  console.log('• secretary: Role 3 (Secretary)');
  console.log('• clerk: Role 4 (Clerk)');
  console.log('• officer: Role 6 (Blotter Officer)');
}

// Execute the test
testOfficerLogin()
  .then(() => {
    console.log('\n✅ Officer login test completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Officer login test failed:', error.message);
    process.exit(1);
  });
