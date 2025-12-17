const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test credentials from seeds
const testUsers = {
  admin: { username: 'superadmin', password: 'admin123', role: 1 },
  clerk: { username: 'clerk', password: 'admin123', role: 2 },
  captain: { username: 'captain', password: 'admin123', role: 5 }
};

// Test endpoints
const testEndpoints = {
  adminDashboard: '/api/admin/dashboard',
  clerkClearances: '/api/clerk/clearances',
  officerCases: '/api/officer/cases',
  captainDashboard: '/api/captain/dashboard',
  residentProfile: '/api/resident/profile'
};

async function login(userType) {
  try {
    const user = testUsers[userType];
    const response = await axios.post(`${BASE_URL}/api/auth/officer-login`, {
      username: user.username,
      password: user.password
    });

    console.log(`✅ ${userType} login successful`);
    return response.data.token;
  } catch (error) {
    console.log(`❌ ${userType} login failed:`, error.response?.data?.error || error.message);
    return null;
  }
}

async function testEndpoint(token, endpoint, expectedStatus, description) {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === expectedStatus) {
      console.log(`✅ ${description}: ${response.status} (Expected: ${expectedStatus})`);
      return true;
    } else {
      console.log(`❌ ${description}: Got ${response.status}, Expected ${expectedStatus}`);
      return false;
    }
  } catch (error) {
    const status = error.response?.status || 'NETWORK_ERROR';
    if (status === expectedStatus) {
      console.log(`✅ ${description}: ${status} (Expected: ${expectedStatus})`);
      return true;
    } else {
      console.log(`❌ ${description}: Got ${status}, Expected ${expectedStatus}`);
      return false;
    }
  }
}

async function runPermissionTests() {
  console.log('🧪 TESTING RBAC PERMISSIONS ENFORCEMENT\n');

  // Login all test users
  const tokens = {};
  for (const userType of Object.keys(testUsers)) {
    tokens[userType] = await login(userType);
    if (!tokens[userType]) {
      console.log(`Skipping tests for ${userType} due to login failure\n`);
      continue;
    }
  }

  console.log('\n🔐 TESTING PERMISSION RESTRICTIONS:\n');

  let totalTests = 0;
  let passedTests = 0;

  // Test 1: Admin should access admin dashboard (200)
  if (tokens.admin) {
    totalTests++;
    if (await testEndpoint(tokens.admin, testEndpoints.adminDashboard, 200, 'Admin accessing admin dashboard')) {
      passedTests++;
    }
  }

  // Test 2: Clerk should NOT access admin dashboard (403)
  if (tokens.clerk) {
    totalTests++;
    if (await testEndpoint(tokens.clerk, testEndpoints.adminDashboard, 403, 'Clerk blocked from admin dashboard')) {
      passedTests++;
    }
  }

  // Test 3: Captain should NOT access admin dashboard (403)
  if (tokens.captain) {
    totalTests++;
    if (await testEndpoint(tokens.captain, testEndpoints.adminDashboard, 403, 'Captain blocked from admin dashboard')) {
      passedTests++;
    }
  }

  // Test 4: Clerk should access clerk clearances (200)
  if (tokens.clerk) {
    totalTests++;
    if (await testEndpoint(tokens.clerk, testEndpoints.clerkClearances, 200, 'Clerk accessing clerk clearances')) {
      passedTests++;
    }
  }

  // Test 5: Admin should NOT access clerk clearances (403)
  if (tokens.admin) {
    totalTests++;
    if (await testEndpoint(tokens.admin, testEndpoints.clerkClearances, 403, 'Admin blocked from clerk clearances')) {
      passedTests++;
    }
  }

  // Test 6: Captain should access captain dashboard (200)
  if (tokens.captain) {
    totalTests++;
    if (await testEndpoint(tokens.captain, testEndpoints.captainDashboard, 200, 'Captain accessing captain dashboard')) {
      passedTests++;
    }
  }

  // Test 7: Clerk should NOT access captain dashboard (403)
  if (tokens.clerk) {
    totalTests++;
    if (await testEndpoint(tokens.clerk, testEndpoints.captainDashboard, 403, 'Clerk blocked from captain dashboard')) {
      passedTests++;
    }
  }

  console.log(`\n📊 TEST RESULTS: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL PERMISSION TESTS PASSED! RBAC is working correctly.');
    return true;
  } else {
    console.log('❌ SOME TESTS FAILED. Permissions may not be properly enforced.');
    return false;
  }
}

// Run the tests
if (require.main === module) {
  runPermissionTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runPermissionTests };
