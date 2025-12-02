#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Barangay Management System
 * Executes all test suites across backend, frontend, and AI components
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      backend: { status: null, output: '', duration: 0 },
      frontend: { status: null, output: '', duration: 0 },
      ai: { status: null, output: '', duration: 0 },
      overall: { passed: 0, failed: 0, total: 0 }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runCommand(command, cwd = process.cwd(), description = '') {
    const startTime = Date.now();

    this.log(`🚀 Starting: ${description || command}`, 'info');

    return new Promise((resolve, reject) => {
      try {
        const output = execSync(command, {
          cwd,
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 300000, // 5 minutes timeout
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });

        const duration = Date.now() - startTime;
        this.log(`✅ Completed: ${description || command} (${duration}ms)`, 'success');

        resolve({
          status: 0,
          output: output,
          duration: duration
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        this.log(`❌ Failed: ${description || command} (${duration}ms)`, 'error');

        if (error.stdout) {
          console.log('STDOUT:', error.stdout);
        }
        if (error.stderr) {
          console.error('STDERR:', error.stderr);
        }

        resolve({
          status: error.status || 1,
          output: error.stdout || '',
          error: error.stderr || error.message,
          duration: duration
        });
      }
    });
  }

  async checkDependencies() {
    this.log('🔍 Checking test dependencies...', 'info');

    // Check Node.js
    try {
      await this.runCommand('node --version', process.cwd(), 'Node.js version check');
    } catch (error) {
      this.log('❌ Node.js not found. Please install Node.js 18+', 'error');
      return false;
    }

    // Check Python
    try {
      await this.runCommand('python --version', process.cwd(), 'Python version check');
    } catch (error) {
      try {
        await this.runCommand('python3 --version', process.cwd(), 'Python3 version check');
      } catch (error) {
        this.log('❌ Python not found. Please install Python 3.8+', 'error');
        return false;
      }
    }

    // Check if directories exist
    const requiredDirs = ['server', 'client', 'tests', 'ai_service'];
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        this.log(`❌ Required directory '${dir}' not found`, 'error');
        return false;
      }
    }

    this.log('✅ All dependencies satisfied', 'success');
    return true;
  }

  async runBackendTests() {
    this.log('🏗️  Running Backend API Tests...', 'info');

    const startTime = Date.now();

    try {
      // Check if server dependencies are installed
      if (!fs.existsSync('server/node_modules')) {
        this.log('📦 Installing server dependencies...', 'warning');
        await this.runCommand('npm install', path.join(process.cwd(), 'server'), 'Install server dependencies');
      }

      // Run Jest tests
      const result = await this.runCommand(
        'npm test -- --coverage --watchAll=false --passWithNoTests',
        path.join(process.cwd(), 'server'),
        'Backend Jest tests'
      );

      this.results.backend = {
        status: result.status === 0 ? 'PASSED' : 'FAILED',
        output: result.output,
        duration: result.duration
      };

      if (result.status === 0) {
        this.results.overall.passed++;
      } else {
        this.results.overall.failed++;
      }

    } catch (error) {
      this.results.backend = {
        status: 'ERROR',
        output: '',
        error: error.message,
        duration: Date.now() - startTime
      };
      this.results.overall.failed++;
    }

    this.results.overall.total++;
  }

  async runFrontendTests() {
    this.log('🎨 Running Frontend Component Tests...', 'info');

    const startTime = Date.now();

    try {
      // Check if client dependencies are installed
      if (!fs.existsSync('client/node_modules')) {
        this.log('📦 Installing client dependencies...', 'warning');
        await this.runCommand('npm install', path.join(process.cwd(), 'client'), 'Install client dependencies');
      }

      // Run Vitest tests
      const result = await this.runCommand(
        'npm test run',
        path.join(process.cwd(), 'client'),
        'Frontend Vitest tests'
      );

      this.results.frontend = {
        status: result.status === 0 ? 'PASSED' : 'FAILED',
        output: result.output,
        duration: result.duration
      };

      if (result.status === 0) {
        this.results.overall.passed++;
      } else {
        this.results.overall.failed++;
      }

    } catch (error) {
      this.results.frontend = {
        status: 'ERROR',
        output: '',
        error: error.message,
        duration: Date.now() - startTime
      };
      this.results.overall.failed++;
    }

    this.results.overall.total++;
  }

  async runAITests() {
    this.log('🤖 Running AI Service Tests...', 'info');

    const startTime = Date.now();

    try {
      // Check if AI test dependencies are installed
      if (!fs.existsSync('tests/__pycache__') && fs.existsSync('tests/requirements.txt')) {
        this.log('📦 Installing AI test dependencies...', 'warning');
        await this.runCommand('pip install -r requirements.txt', path.join(process.cwd(), 'tests'), 'Install AI test dependencies');
      }

      // Run Pytest tests
      const result = await this.runCommand(
        'python -m pytest -v --tb=short --disable-warnings',
        path.join(process.cwd(), 'tests'),
        'AI Pytest tests'
      );

      this.results.ai = {
        status: result.status === 0 ? 'PASSED' : 'FAILED',
        output: result.output,
        duration: result.duration
      };

      if (result.status === 0) {
        this.results.overall.passed++;
      } else {
        this.results.overall.failed++;
      }

    } catch (error) {
      this.results.ai = {
        status: 'ERROR',
        output: '',
        error: error.message,
        duration: Date.now() - startTime
      };
      this.results.overall.failed++;
    }

    this.results.overall.total++;
  }

  async runIntegrationTests() {
    this.log('🔗 Running Integration Tests...', 'info');

    // TODO: Add integration tests that span multiple services
    // For now, integration is tested within each service

    this.log('ℹ️  Integration tests are included within each service test suite', 'info');
  }

  printResults() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));

    const printTestResult = (name, result) => {
      const status = result.status;
      const duration = result.duration;
      const color = status === 'PASSED' ? '\x1b[32m' :
                   status === 'FAILED' ? '\x1b[31m' : '\x1b[33m';

      console.log(`${name.padEnd(15)} ${color}${status.padEnd(8)}\x1b[0m ${duration}ms`);

      if (result.error) {
        console.log(`         Error: ${result.error}`);
      }
    };

    printTestResult('Backend API', this.results.backend);
    printTestResult('Frontend UI', this.results.frontend);
    printTestResult('AI Services', this.results.ai);

    console.log('-'.repeat(80));
    console.log(`Total Tests: ${this.results.overall.total}`);
    console.log(`Passed: ${this.results.overall.passed}`);
    console.log(`Failed: ${this.results.overall.failed}`);
    console.log('-'.repeat(80));

    const successRate = this.results.overall.total > 0 ?
      ((this.results.overall.passed / this.results.overall.total) * 100).toFixed(1) : 0;

    if (this.results.overall.failed === 0) {
      console.log('\x1b[32m🎉 ALL TESTS PASSED!\x1b[0m');
      console.log(`✅ Success Rate: ${successRate}%`);
      process.exit(0);
    } else {
      console.log('\x1b[31m❌ SOME TESTS FAILED\x1b[0m');
      console.log(`❌ Success Rate: ${successRate}%`);
      process.exit(1);
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Test Suite for Barangay Management System', 'info');
    this.log('='.repeat(80), 'info');

    // Check dependencies first
    const depsOk = await this.checkDependencies();
    if (!depsOk) {
      this.log('❌ Dependency check failed. Aborting tests.', 'error');
      process.exit(1);
    }

    // Run all test suites
    await this.runBackendTests();
    await this.runFrontendTests();
    await this.runAITests();
    await this.runIntegrationTests();

    // Print final results
    this.printResults();
  }
}

// Run if called directly
if (require.main === module) {
  const testRunner = new TestRunner();
  testRunner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;
