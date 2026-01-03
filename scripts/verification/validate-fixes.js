#!/usr/bin/env node

/**
 * Simple validation script to check our implemented fixes
 * Tests the key components without complex dependencies
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class FixValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {},
      overall_status: 'unknown'
    };
  }

  log(message, status = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const statusEmoji = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };

    console.log(`[${timestamp}] ${statusEmoji[status] || '•'} ${message}`);
  }

  async testFileExists(filePath, description) {
    try {
      await fs.access(path.join(__dirname, filePath));
      this.results.tests[description] = { status: 'success', message: 'File exists' };
      this.log(`${description}: File exists`, 'success');
      return true;
    } catch (error) {
      this.results.tests[description] = { status: 'error', message: 'File missing', error: error.message };
      this.log(`${description}: File missing`, 'error');
      return false;
    }
  }

  async testFileContent(filePath, searchText, description, shouldContain = true) {
    try {
      const content = await fs.readFile(path.join(__dirname, filePath), 'utf8');
      const containsText = content.includes(searchText);

      if ((shouldContain && containsText) || (!shouldContain && !containsText)) {
        this.results.tests[description] = { status: 'success', message: shouldContain ? 'Content found' : 'Content correctly absent' };
        this.log(`${description}: ${shouldContain ? 'Content found' : 'Content correctly absent'}`, 'success');
        return true;
      } else {
        this.results.tests[description] = {
          status: 'error',
          message: shouldContain ? 'Content not found' : 'Content unexpectedly present'
        };
        this.log(`${description}: ${shouldContain ? 'Content not found' : 'Content unexpectedly present'}`, 'error');
        return false;
      }
    } catch (error) {
      this.results.tests[description] = { status: 'error', message: 'File read error', error: error.message };
      this.log(`${description}: File read error`, 'error');
      return false;
    }
  }

  async runValidation() {
    this.log('🔍 Starting Barangay Management System Fix Validation', 'info');

    // Test 1: Check if ResidentDashboard component exists
    await this.testFileExists('client/src/pages/ResidentDashboard.jsx', 'ResidentDashboard component');

    // Test 2: Check if ResidentDashboard is imported in App.jsx
    await this.testFileContent('client/src/App.jsx', 'ResidentDashboard', 'ResidentDashboard import in App.jsx');

    // Test 3: Check if role-based routing is implemented
    await this.testFileContent('client/src/App.jsx', 'user?.role === \'resident\'', 'Role-based dashboard routing');

    // Test 4: Check if debug authentication button was removed
    await this.testFileContent('client/src/pages/Login.jsx', 'Debug Login', 'Debug authentication button removal', false);

    // Test 5: Check if ResidentDashboard has resident-appropriate content
    await this.testFileContent('client/src/pages/ResidentDashboard.jsx', 'Resident Account', 'ResidentDashboard has resident branding');

    // Test 6: Check if ResidentDashboard shows personal info
    await this.testFileContent('client/src/pages/ResidentDashboard.jsx', 'Contact Information', 'ResidentDashboard shows contact info');

    // Test 7: Check if system health check script exists
    await this.testFileExists('system-health-check.js', 'System health check script');

    // Test 8: Check if ResidentDashboard has quick actions for residents
    await this.testFileContent('client/src/pages/ResidentDashboard.jsx', 'Request Document', 'ResidentDashboard has document request action');

    // Test 9: Check if ResidentDashboard avoids administrative content
    await this.testFileContent('client/src/pages/ResidentDashboard.jsx', 'AI Patrol Intelligence', 'ResidentDashboard avoids admin content', false);

    // Test 10: Check if App.jsx has proper routing structure
    await this.testFileContent('client/src/App.jsx', 'ResidentDashboard user={user}', 'App.jsx routes to ResidentDashboard');

    this.calculateOverallStatus();
    this.printSummary();
  }

  calculateOverallStatus() {
    const testResults = Object.values(this.results.tests);
    const passed = testResults.filter(t => t.status === 'success').length;
    const total = testResults.length;

    if (passed === total) {
      this.results.overall_status = 'success';
    } else if (passed >= total * 0.8) {
      this.results.overall_status = 'warning';
    } else {
      this.results.overall_status = 'error';
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('🎯 BANGARAY MANAGEMENT SYSTEM - FIX VALIDATION SUMMARY');
    console.log('='.repeat(70));

    const statusEmoji = {
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'unknown': '❓'
    };

    console.log(`\n📊 Overall Status: ${statusEmoji[this.results.overall_status]} ${this.results.overall_status.toUpperCase()}`);
    console.log(`⏰ Validation Completed: ${new Date(this.results.timestamp).toLocaleString()}`);

    console.log('\n📋 Test Results:');
    Object.entries(this.results.tests).forEach(([test, result]) => {
      const emoji = statusEmoji[result.status] || '❓';
      console.log(`  ${emoji} ${test}: ${result.message}`);
    });

    console.log('\n' + '='.repeat(70));

    if (this.results.overall_status === 'success') {
      console.log('🎉 All fixes have been successfully implemented and validated!');
    } else if (this.results.overall_status === 'warning') {
      console.log('⚠️ Most fixes implemented successfully, but some minor issues remain.');
    } else {
      console.log('❌ Some critical fixes may not be properly implemented.');
    }
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new FixValidator();
  validator.runValidation().catch(error => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
}

export default FixValidator;
