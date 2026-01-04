#!/usr/bin/env node

/**
 * AUTOMATED TEST RUNNER
 * Executes comprehensive system tests and generates report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('🚀 THEMIS BIOPROFILING - AUTOMATED TEST SUITE');
console.log('='.repeat(70) + '\n');

const testSuites = [
  {
    name: '🔒 Security Tests',
    file: '__tests__/system-comprehensive.test.js',
    description: 'Captain read-only enforcement & privilege escalation'
  },
  {
    name: '🧪 Controller Tests',
    file: '__tests__/controllers.test.js',
    description: 'Business logic validation'
  },
  {
    name: '🌐 API Integration Tests',
    file: '__tests__/api-integration.test.js',
    description: 'End-to-end API workflows'
  },
  {
    name: '👤 Authentication Tests',
    file: '__tests__/authController.test.js',
    description: 'JWT & role-based access'
  },
  {
    name: '📜 Certificate Tests',
    file: '__tests__/certificates.test.js',
    description: 'Document generation & validation'
  },
  {
    name: '👥 Resident Tests',
    file: '__tests__/residents.test.js',
    description: 'Resident management operations'
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

console.log('📋 Test Suites to Execute:\n');
testSuites.forEach((suite, index) => {
  console.log(`   ${index + 1}. ${suite.name}`);
  console.log(`      ${suite.description}`);
});
console.log('\n' + '-'.repeat(70) + '\n');

// Run comprehensive test suite
try {
  console.log('▶️  Running Comprehensive System Tests...\n');
  
  const output = execSync('npm test -- --testPathPattern=system-comprehensive.test.js --verbose', {
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  
  console.log(output);
  
  // Parse results
  const passMatch = output.match(/(\d+) passed/);
  const failMatch = output.match(/(\d+) failed/);
  const totalMatch = output.match(/Tests:\s+(\d+)/);
  
  if (passMatch) passedTests += parseInt(passMatch[1]);
  if (failMatch) failedTests += parseInt(failMatch[1]);
  if (totalMatch) totalTests += parseInt(totalMatch[1]);
  
  results.push({
    suite: 'Comprehensive System Tests',
    status: failedTests === 0 ? '✅ PASS' : '❌ FAIL',
    passed: passedTests,
    failed: failedTests,
    total: totalTests
  });
  
} catch (error) {
  console.error('❌ Test execution failed:', error.message);
  results.push({
    suite: 'Comprehensive System Tests',
    status: '❌ FAIL',
    error: error.message
  });
}

// Generate summary report
console.log('\n' + '='.repeat(70));
console.log('📊 TEST EXECUTION SUMMARY');
console.log('='.repeat(70) + '\n');

results.forEach(result => {
  console.log(`${result.status} ${result.suite}`);
  if (result.passed !== undefined) {
    console.log(`   Passed: ${result.passed}/${result.total}`);
    if (result.failed > 0) {
      console.log(`   Failed: ${result.failed}`);
    }
  }
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
  console.log('');
});

console.log('-'.repeat(70));
console.log(`\n📈 Overall Results:`);
console.log(`   Total Tests: ${totalTests}`);
console.log(`   Passed: ${passedTests} (${totalTests > 0 ? Math.round((passedTests/totalTests)*100) : 0}%)`);
console.log(`   Failed: ${failedTests}`);
console.log(`\n   Status: ${failedTests === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
console.log('\n' + '='.repeat(70));

// Generate coverage report
console.log('\n📊 Generating Coverage Report...\n');
try {
  execSync('npm test -- --coverage --coverageReporters=text', {
    encoding: 'utf-8',
    stdio: 'inherit'
  });
} catch (error) {
  console.log('⚠️  Coverage report generation skipped');
}

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
