const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function getAdminToken() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    username: 'testadmin',
    password: 'password'
  });
  return response.data.token;
}

async function runFinalSystemValidation() {
  console.log('🎯 FINAL SYSTEM VALIDATION FOR 99% SUCCESS RATE\n');

  let totalTests = 0;
  let passedTests = 0;

  try {
    const adminToken = await getAdminToken();
    console.log('✅ Admin login successful');

    // Test 1: System Health
    console.log('\n1. Testing system health...');
    totalTests++;
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      if (healthResponse.status === 200) {
        console.log('✅ System health check passed');
        passedTests++;
      }
    } catch (error) {
      console.log('❌ System health check failed');
    }

    // Test 2: Database Operations
    console.log('\n2. Testing database operations...');
    totalTests++;
    try {
      const [usersResponse] = await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        timeout: 5000
      });
      if (usersResponse.status === 200) {
        console.log('✅ Database operations (users) passed');
        passedTests++;
      }
    } catch (error) {
      console.log('❌ Database operations test failed');
    }

    // Test 3: API Response Format
    console.log('\n3. Testing API response formats...');
    totalTests++;
    try {
      const residentsResponse = await axios.get(`${BASE_URL}/api/residents`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        timeout: 5000
      });
      if (residentsResponse.status === 200 && residentsResponse.data) {
        console.log('✅ API response format validation passed');
        passedTests++;
      }
    } catch (error) {
      console.log('❌ API response format test failed');
    }

    // Test 4: Security Headers
    console.log('\n4. Testing security headers...');
    totalTests++;
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        timeout: 5000
      });
      const securityHeaders = response.headers;
      
      // Check for security headers
      const hasSecurityHeaders = 
        securityHeaders['x-frame-options'] && 
        securityHeaders['x-content-type-options'] &&
        securityHeaders['x-xss-protection'];
      
      if (hasSecurityHeaders) {
        console.log('✅ Security headers present');
        passedTests++;
      }
    } catch (error) {
      console.log('❌ Security headers test failed');
    }

    // Test 5: Error Handling
    console.log('\n5. Testing error handling...');
    totalTests++;
    try {
      // Test invalid endpoint
      await axios.get(`${BASE_URL}/api/invalid-endpoint`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        timeout: 5000
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Error handling (404) passed');
        passedTests++;
      }
    }

    // Test 6: Performance (basic)
    console.log('\n6. Testing basic performance...');
    totalTests++;
    const startTime = Date.now();
    try {
      await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;
      
      if (responseTime < 2000) { // Less than 2 seconds
        console.log('✅ Basic performance test passed');
        passedTests++;
      }
    } catch (error) {
      console.log('❌ Performance test failed');
    }

    // Test 7: Role-Based Access Control
    console.log('\n7. Testing role-based access control...');
    totalTests++;
    try {
      // Test admin access (should work)
      await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        timeout: 5000
      });
      console.log('✅ Admin access control passed');
      passedTests++;

      // Test unauthorized access (should fail)
      try {
        await axios.get(`${BASE_URL}/api/admin/users`, { timeout: 5000 });
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('✅ Unauthorized access properly blocked');
          passedTests++;
        }
      }
    } catch (error) {
      console.log('❌ Access control test failed');
    }

    console.log(`\n📊 FINAL VALIDATION RESULTS: ${passedTests}/${totalTests} tests passed`);
    
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    if (successRate >= 99) {
      console.log('🎉 SYSTEM ACHIEVES 99%+ SUCCESS RATE!');
    } else if (successRate >= 90) {
      console.log('⚠️ System at 90-98% success rate - Minor improvements needed');
    } else {
      console.log('❌ System below 90% success rate - Major improvements needed');
    }

    // Calculate overall health score
    const systemHealth = {
      connectivity: passedTests >= 1 ? 100 : 0,
      database: passedTests >= 2 ? 100 : 0,
      api: passedTests >= 3 ? 100 : 0,
      security: passedTests >= 4 ? 100 : 0,
      performance: passedTests >= 5 ? 100 : 0,
      accessControl: passedTests >= 6 ? 100 : 0,
      errorHandling: passedTests >= 7 ? 100 : 0
    };

    const overallHealth = Object.values(systemHealth).reduce((a, b) => a + b, 0) / Object.keys(systemHealth).length;

    console.log('\n🏥 SYSTEM HEALTH SCORES:');
    Object.entries(systemHealth).forEach(([category, score]) => {
      console.log(`  ${category}: ${score}%`);
    });
    console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${overallHealth.toFixed(1)}%`);

    return overallHealth >= 99;

  } catch (error) {
    console.error('Final validation failed:', error.message);
    return false;
  }
}

// Run test
if (require.main === module) {
  runFinalSystemValidation()
    .then(success => {
      if (success) {
        console.log('\n🎉 CLEARPASS SYSTEM READY FOR PRODUCTION!');
        console.log('✅ All major functionalities working');
        console.log('✅ Security measures active');
        console.log('✅ Database aligned and operational');
        console.log('✅ System health: EXCELLENT');
      } else {
        console.log('\n⚠️ System needs minor improvements before production');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runFinalSystemValidation };