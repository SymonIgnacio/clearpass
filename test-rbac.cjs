#!/usr/bin/env node

const axios = require('axios');

const ROLES = {
  ADMIN: 1,
  CAPTAIN: 2,
  SECRETARY: 3,
  CLERK: 4,
  BLOTTER_OFFICER: 6,
  RESIDENT: 12
};

const TEST_USERS = [
  { username: 'superadmin', password: 'admin123', expectedRole: ROLES.ADMIN, roleName: 'IT Admin' },
  { username: 'captain', password: 'captain123', expectedRole: ROLES.CAPTAIN, roleName: 'Captain' },
  { username: 'secretary', password: 'secretary123', expectedRole: ROLES.SECRETARY, roleName: 'Secretary' },
  { username: 'clerk', password: 'clerk123', expectedRole: ROLES.CLERK, roleName: 'Clerk' },
  { username: 'officer', password: 'officer123', expectedRole: ROLES.BLOTTER_OFFICER, roleName: 'Blotter Officer' }
];

const baseURL = 'http://localhost:3002/api';

async function testRoleBasedAccess() {
  console.log('🔐 Testing Role-Based Access Control...\n');

  for (const user of TEST_USERS) {
    console.log(`\n👤 Testing ${user.roleName} (${user.username}):`);
    
    try {
      // Test login
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        username: user.username,
        password: user.password
      });
      
      const userData = loginResponse.data.data.user;
      
      // Verify role
      if (userData.role === user.expectedRole) {
        console.log(`  ✅ Login successful - Role ${userData.role} (${userData.role_name})`);
      } else {
        console.log(`  ❌ Role mismatch - Expected ${user.expectedRole}, got ${userData.role}`);
        continue;
      }
      
      // Get auth cookie
      const cookies = loginResponse.headers['set-cookie'];
      const authCookie = cookies?.find(cookie => cookie.startsWith('authToken='));
      
      if (!authCookie) {
        console.log('  ❌ No auth cookie found');
        continue;
      }
      
      const headers = {
        'Cookie': authCookie,
        'Content-Type': 'application/json'
      };
      
      // Test GET access (should work for all)
      try {
        await axios.get(`${baseURL}/residents`, { headers });
        console.log('  ✅ GET /residents - Access granted');
      } catch (error) {
        console.log(`  ❌ GET /residents - Access denied (${error.response?.status})`);
      }
      
      // Test POST access (should be blocked for Captain)
      if (user.expectedRole === ROLES.CAPTAIN) {
        try {
          await axios.post(`${baseURL}/blotter`, {
            Complainant_Details: { name: 'Test' },
            Incident_Type: 'Physical Injury',
            Narrative: 'Test case',
            Location_Sitio: 'Batia Proper'
          }, { headers });
          console.log('  ❌ POST /blotter - Should be blocked for Captain');
        } catch (error) {
          if (error.response?.status === 403) {
            console.log('  ✅ POST /blotter - Correctly blocked (Read-only)');
          } else {
            console.log(`  ⚠️  POST /blotter - Unexpected error (${error.response?.status})`);
          }
        }
      } else {
        // For non-Captain roles, POST should work (if they have permission)
        try {
          await axios.post(`${baseURL}/blotter`, {
            Complainant_Details: { name: 'Test' },
            Incident_Type: 'Physical Injury', 
            Narrative: 'Test case',
            Location_Sitio: 'Batia Proper'
          }, { headers });
          console.log('  ✅ POST /blotter - Access granted');
        } catch (error) {
          if (error.response?.status === 403) {
            console.log('  ⚠️  POST /blotter - Access denied (check permissions)');
          } else {
            console.log(`  ⚠️  POST /blotter - Error (${error.response?.status})`);
          }
        }
      }
      
      // Test admin endpoints (should only work for IT Admin)
      try {
        await axios.get(`${baseURL}/admin/users`, { headers });
        if (user.expectedRole === ROLES.ADMIN) {
          console.log('  ✅ GET /admin/users - Admin access granted');
        } else {
          console.log('  ❌ GET /admin/users - Should be blocked for non-admin');
        }
      } catch (error) {
        if (error.response?.status === 403) {
          if (user.expectedRole === ROLES.ADMIN) {
            console.log('  ❌ GET /admin/users - Admin access denied');
          } else {
            console.log('  ✅ GET /admin/users - Correctly blocked for non-admin');
          }
        } else {
          console.log(`  ⚠️  GET /admin/users - Error (${error.response?.status})`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Login failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  console.log('\n🎉 Role-based access control testing completed!');
}

// Test authentication flow
async function testAuthFlow() {
  console.log('\n🔄 Testing Authentication Flow...\n');
  
  try {
    // Test /me endpoint without token
    try {
      await axios.get(`${baseURL}/auth/me`);
      console.log('❌ /auth/me should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ /auth/me correctly requires authentication');
      }
    }
    
    // Test with valid token
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: 'superadmin',
      password: 'admin123'
    });
    
    const cookies = loginResponse.headers['set-cookie'];
    const authCookie = cookies?.find(cookie => cookie.startsWith('authToken='));
    
    if (authCookie) {
      const meResponse = await axios.get(`${baseURL}/auth/me`, {
        headers: { 'Cookie': authCookie }
      });
      
      if (meResponse.data.success && meResponse.data.data.user) {
        console.log('✅ /auth/me works with valid token');
      } else {
        console.log('❌ /auth/me response format incorrect');
      }
    }
    
  } catch (error) {
    console.log(`❌ Auth flow test failed: ${error.message}`);
  }
}

// Check if server is running and start tests
axios.get(`${baseURL.replace('/api', '')}/health`)
  .then(async () => {
    await testRoleBasedAccess();
    await testAuthFlow();
  })
  .catch(() => console.log('❌ Server not running on port 3002'));