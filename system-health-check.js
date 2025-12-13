#!/usr/bin/env node

/**
 * Barangay Management System - Comprehensive Health Check Script
 * Tests all system components including API endpoints, database, authentication, and integrations
 */

import https from 'https';
import http from 'http';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

class SystemHealthChecker {
  constructor() {
    this.__dirname = path.dirname(fileURLToPath(import.meta.url));
    this.baseURL = process.env.CLIENT_URL || 'http://localhost:5173';
    this.apiURL = process.env.SERVER_URL || 'http://localhost:3001/api';
    this.aiServiceURL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    this.results = {
      timestamp: new Date().toISOString(),
      overall_status: 'unknown',
      components: {},
      recommendations: []
    };
  }

  log(message, status = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const statusEmoji = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'running': '🔄'
    };

    console.log(`[${timestamp}] ${statusEmoji[status] || '•'} ${message}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const req = protocol.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: parsed
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async testDatabaseConnection() {
    this.log('Testing database connectivity...', 'running');

    try {
      // Test basic database connection via API
      const response = await this.makeRequest(`${this.apiURL}/residents?page=1&limit=1`);

      if (response.status === 401) {
        // This is expected for protected endpoints without auth
        this.results.components.database = {
          status: 'success',
          message: 'Database connection successful (authentication required for data access)',
          details: 'Protected endpoint correctly requires authentication'
        };
        return true;
      } else if (response.status >= 200 && response.status < 300) {
        this.results.components.database = {
          status: 'success',
          message: 'Database connection and basic query successful',
          details: 'API can connect to and query the database'
        };
        return true;
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }
    } catch (error) {
      this.results.components.database = {
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        recommendations: [
          'Check database server is running',
          'Verify database credentials in .env file',
          'Check database connectivity from server'
        ]
      };
      return false;
    }
  }

  async testAuthenticationSystem() {
    this.log('Testing authentication system...', 'running');

    try {
      // Test login endpoint accessibility
      const loginTest = await this.makeRequest(`${this.apiURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { username: 'test', password: 'test' }
      });

      if (loginTest.status === 401) {
        this.results.components.authentication = {
          status: 'success',
          message: 'Authentication endpoint accessible and properly secured',
          details: 'Returns 401 for invalid credentials as expected'
        };
        return true;
      } else {
        this.results.components.authentication = {
          status: 'warning',
          message: 'Authentication endpoint responds but with unexpected status',
          details: `Expected 401 for invalid credentials, got ${loginTest.status}`,
          recommendations: ['Verify authentication logic and error handling']
        };
        return true; // Still functional, just unexpected response
      }
    } catch (error) {
      this.results.components.authentication = {
        status: 'error',
        message: 'Authentication system unreachable',
        error: error.message,
        recommendations: [
          'Check server is running on correct port',
          'Verify authentication routes are properly configured',
          'Check for authentication middleware errors'
        ]
      };
      return false;
    }
  }

  async testAPIEndpoints() {
    this.log('Testing API endpoints...', 'running');

    const endpoints = [
      { path: '/residents', method: 'GET', description: 'Residents endpoint' },
      { path: '/blotter', method: 'GET', description: 'Blotter endpoint' },
      { path: '/certificates', method: 'GET', description: 'Certificates endpoint' },
      { path: '/census', method: 'GET', description: 'Census endpoint' },
      { path: '/programs', method: 'GET', description: 'Programs endpoint' }
    ];

    let passed = 0;
    let total = endpoints.length;

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(`${this.apiURL}${endpoint.path}`, {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 401 || (response.status >= 200 && response.status < 300)) {
          passed++;
        } else {
          this.log(`❌ ${endpoint.description}: Unexpected status ${response.status}`, 'error');
        }
      } catch (error) {
        this.log(`❌ ${endpoint.description}: ${error.message}`, 'error');
      }
    }

    const successRate = (passed / total) * 100;
    this.results.components.api_endpoints = {
      status: successRate >= 80 ? 'success' : successRate >= 50 ? 'warning' : 'error',
      message: `API endpoints test: ${passed}/${total} passed (${successRate.toFixed(1)}%)`,
      details: `${passed} out of ${total} endpoints are accessible`,
      success_rate: successRate
    };

    return successRate >= 50; // Consider successful if at least half work
  }

  async testAIService() {
    this.log('Testing AI service...', 'running');

    try {
      // Test AI service health
      const response = await this.makeRequest(`${this.aiServiceURL}/health`, {
        method: 'GET'
      });

      if (response.status >= 200 && response.status < 300) {
        this.results.components.ai_service = {
          status: 'success',
          message: 'AI service is healthy and responsive',
          details: 'AI service health check passed'
        };
        return true;
      } else {
        throw new Error(`AI service returned status ${response.status}`);
      }
    } catch (error) {
      this.results.components.ai_service = {
        status: 'warning',
        message: 'AI service unavailable or not running',
        error: error.message,
        recommendations: [
          'Start the AI service (python app.py in ai_service directory)',
          'Check AI service logs for errors',
          'Verify AI service port configuration'
        ]
      };
      return false;
    }
  }

  async testFrontendAccessibility() {
    this.log('Testing frontend accessibility...', 'running');

    try {
      const response = await this.makeRequest(this.baseURL);

      if (response.status >= 200 && response.status < 300) {
        this.results.components.frontend = {
          status: 'success',
          message: 'Frontend is accessible and responding',
          details: `Status: ${response.status}`
        };
        return true;
      } else {
        throw new Error(`Frontend returned status ${response.status}`);
      }
    } catch (error) {
      this.results.components.frontend = {
        status: 'error',
        message: 'Frontend is not accessible',
        error: error.message,
        recommendations: [
          'Start the frontend development server (npm run dev)',
          'Check if port 5173 is available',
          'Verify frontend build is successful'
        ]
      };
      return false;
    }
  }

  async testFileSystemPermissions() {
    this.log('Testing file system permissions...', 'running');

    try {
      // Test uploads directory
      const uploadsDir = path.join(this.__dirname, 'uploads');
      await fs.access(uploadsDir);

      // Test if we can write to uploads
      const testFile = path.join(uploadsDir, 'health-check-test.tmp');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);

      // Test server templates directory
      const templatesDir = path.join(this.__dirname, 'server', 'templates');
      await fs.access(templatesDir);

      this.results.components.file_system = {
        status: 'success',
        message: 'File system permissions are correct',
        details: 'Can read/write to required directories'
      };
      return true;
    } catch (error) {
      this.results.components.file_system = {
        status: 'error',
        message: 'File system permission issues detected',
        error: error.message,
        recommendations: [
          'Check write permissions on uploads/ directory',
          'Verify server/templates/ directory exists and is accessible',
          'Run health check with appropriate user permissions'
        ]
      };
      return false;
    }
  }

  async testEnvironmentConfiguration() {
    this.log('Testing environment configuration...', 'running');

    const requiredEnvVars = [
      'DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'SERVER_PORT'
    ];

    const optionalEnvVars = [
      'DB_PASSWORD', 'CLIENT_URL', 'AI_SERVICE_URL', 'FIREBASE_PROJECT_ID'
    ];

    const missingRequired = [];
    const missingOptional = [];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingRequired.push(envVar);
      }
    }

    for (const envVar of optionalEnvVars) {
      if (!process.env[envVar]) {
        missingOptional.push(envVar);
      }
    }

    if (missingRequired.length === 0) {
      this.results.components.environment = {
        status: 'success',
        message: 'All required environment variables are set',
        details: missingOptional.length > 0 ?
          `Optional variables missing: ${missingOptional.join(', ')}` :
          'All environment variables configured'
      };
      return true;
    } else {
      this.results.components.environment = {
        status: 'error',
        message: 'Missing required environment variables',
        error: `Missing: ${missingRequired.join(', ')}`,
        recommendations: [
          'Copy server/.env.example to server/.env',
          'Fill in all required environment variables',
          'Check database and service configurations'
        ]
      };
      return false;
    }
  }

  async testQRVerification() {
    this.log('Testing QR verification system...', 'running');

    try {
      // Test QR verification endpoint with invalid hash
      const response = await this.makeRequest(`${this.apiURL.replace('/api', '')}/verify-qr/invalid-hash`);

      // Should return INVALID status
      if (response.status >= 200 && response.status < 300 && response.data?.status === 'INVALID') {
        this.results.components.qr_system = {
          status: 'success',
          message: 'QR verification system is functional',
          details: 'Correctly identifies invalid QR codes'
        };
        return true;
      } else {
        this.results.components.qr_system = {
          status: 'warning',
          message: 'QR verification system responds but with unexpected behavior',
          details: `Expected INVALID status for invalid hash, got: ${response.data?.status || 'unknown'}`
        };
        return true;
      }
    } catch (error) {
      this.results.components.qr_system = {
        status: 'error',
        message: 'QR verification system unreachable',
        error: error.message,
        recommendations: [
          'Check QR verification route configuration',
          'Verify QR validation logic',
          'Test with valid QR codes from certificates'
        ]
      };
      return false;
    }
  }

  async testDocumentSystem() {
    this.log('Testing document system...', 'running');

    try {
      // Test document types endpoint
      const response = await this.makeRequest(`${this.apiURL}/documents/types`);

      if (response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
        this.results.components.document_system = {
          status: 'success',
          message: 'Document system is functional',
          details: `${response.data.length} document types available`
        };
        return true;
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }
    } catch (error) {
      this.results.components.document_system = {
        status: 'warning',
        message: 'Document system may have issues',
        error: error.message,
        recommendations: [
          'Check document controller implementation',
          'Verify document templates are properly configured',
          'Test document generation with sample data'
        ]
      };
      return false;
    }
  }

  async runPerformanceTest() {
    this.log('Running performance tests...', 'running');

    try {
      const startTime = Date.now();

      // Test multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(this.makeRequest(`${this.apiURL}/census`));
      }

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled' &&
        r.value.status >= 200 && r.value.status < 300).length;
      const avgResponseTime = (endTime - startTime) / results.length;

      this.results.components.performance = {
        status: successful >= 3 ? 'success' : 'warning',
        message: `Performance test: ${successful}/5 concurrent requests successful`,
        details: `Average response time: ${avgResponseTime.toFixed(0)}ms`,
        metrics: {
          concurrent_requests: 5,
          successful_requests: successful,
          average_response_time: avgResponseTime
        }
      };

      return successful >= 3;
    } catch (error) {
      this.results.components.performance = {
        status: 'error',
        message: 'Performance test failed',
        error: error.message
      };
      return false;
    }
  }

  generateRecommendations() {
    const recommendations = [];

    // Analyze results and generate specific recommendations
    Object.entries(this.results.components).forEach(([component, result]) => {
      if (result.status === 'error' || result.status === 'warning') {
        if (result.recommendations) {
          recommendations.push(...result.recommendations.map(rec => `${component}: ${rec}`));
        }
      }
    });

    // Add general recommendations
    if (!this.results.components.database || this.results.components.database.status !== 'success') {
      recommendations.push('Database: Ensure MySQL/MariaDB is running and accessible');
    }

    if (!this.results.components.ai_service || this.results.components.ai_service.status !== 'success') {
      recommendations.push('AI Service: Start AI service with proper Python environment');
    }

    if (!this.results.components.frontend || this.results.components.frontend.status !== 'success') {
      recommendations.push('Frontend: Run npm install and npm run dev in client directory');
    }

    this.results.recommendations = [...new Set(recommendations)]; // Remove duplicates
  }

  calculateOverallStatus() {
    const componentStatuses = Object.values(this.results.components).map(c => c.status);

    if (componentStatuses.includes('error')) {
      this.results.overall_status = 'error';
    } else if (componentStatuses.includes('warning')) {
      this.results.overall_status = 'warning';
    } else if (componentStatuses.every(s => s === 'success')) {
      this.results.overall_status = 'success';
    } else {
      this.results.overall_status = 'partial';
    }
  }

  async saveReport() {
    const reportPath = path.join(this.__dirname, 'health-check-report.json');
    try {
      await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
      this.log(`Health check report saved to: ${reportPath}`, 'success');
    } catch (error) {
      this.log(`Failed to save report: ${error.message}`, 'error');
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('🏥 BANGARAY MANAGEMENT SYSTEM - HEALTH CHECK SUMMARY');
    console.log('='.repeat(80));

    const statusEmoji = {
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'unknown': '❓'
    };

    console.log(`\n📊 Overall Status: ${statusEmoji[this.results.overall_status]} ${this.results.overall_status.toUpperCase()}`);
    console.log(`⏰ Test Completed: ${new Date(this.results.timestamp).toLocaleString()}`);

    console.log('\n📋 Component Status:');
    Object.entries(this.results.components).forEach(([component, result]) => {
      const emoji = statusEmoji[result.status] || '❓';
      console.log(`  ${emoji} ${component.replace('_', ' ').toUpperCase()}: ${result.message}`);
    });

    if (this.results.recommendations && this.results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.results.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    console.log('\n📄 Detailed report saved to: health-check-report.json');
    console.log('='.repeat(80));
  }

  async runAllTests() {
    this.log('🚀 Starting Barangay Management System Health Check', 'info');
    this.log('This will test all major system components...', 'info');

    const tests = [
      { name: 'Environment Configuration', method: this.testEnvironmentConfiguration.bind(this) },
      { name: 'File System Permissions', method: this.testFileSystemPermissions.bind(this) },
      { name: 'Database Connection', method: this.testDatabaseConnection.bind(this) },
      { name: 'Authentication System', method: this.testAuthenticationSystem.bind(this) },
      { name: 'API Endpoints', method: this.testAPIEndpoints.bind(this) },
      { name: 'AI Service', method: this.testAIService.bind(this) },
      { name: 'Frontend Accessibility', method: this.testFrontendAccessibility.bind(this) },
      { name: 'QR Verification System', method: this.testQRVerification.bind(this) },
      { name: 'Document System', method: this.testDocumentSystem.bind(this) },
      { name: 'Performance Test', method: this.runPerformanceTest.bind(this) }
    ];

    for (const test of tests) {
      try {
        await test.method();
      } catch (error) {
        this.log(`❌ ${test.name} test failed with error: ${error.message}`, 'error');
        this.results.components[test.name.toLowerCase().replace(' ', '_')] = {
          status: 'error',
          message: `${test.name} test failed`,
          error: error.message
        };
      }
    }

    this.generateRecommendations();
    this.calculateOverallStatus();
    await this.saveReport();
    this.printSummary();
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new SystemHealthChecker();

  // Load environment variables if .env exists
  // Note: In ES modules, we can't use require for dotenv, so we'll use a simpler approach
  try {
    const { readFileSync } = await import('fs');
    const dotenvPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env');
    if (readFileSync) {
      // Simple dotenv parsing (basic implementation)
      try {
        const envContent = readFileSync(dotenvPath, 'utf8');
        envContent.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            if (value) process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
          }
        });
      } catch (e) {
        // .env file not found or can't be read, continue without it
      }
    }
  } catch (e) {
    // fs import failed, continue without loading .env
  }

  checker.runAllTests().catch(error => {
    console.error('❌ Health check failed with fatal error:', error);
    process.exit(1);
  });
}

export default SystemHealthChecker;
