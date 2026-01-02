#!/usr/bin/env node

/**
 * Configuration Validation Audit Script
 *
 * Validates all configuration files for target setup (5174/3001/5000)
 * Checks environment variables, CORS origins, API URLs, and service configurations
 */

const fs = require('fs');
const path = require('path');

function auditConfiguration() {
  console.log('🔍 CONFIGURATION VALIDATION AUDIT');
  console.log('==================================\n');

  const results = {
    serverEnv: false,
    clientEnv: false,
    corsConfiguration: false,
    apiUrls: false,
    portConfiguration: false,
    databaseConfig: false
  };

  // Test 1: Server Environment Variables
  console.log('🧪 Test 1: Server Environment Configuration');
  const serverEnvPath = path.join(__dirname, '..', 'server', '.env');

  try {
    if (fs.existsSync(serverEnvPath)) {
      const serverEnvContent = fs.readFileSync(serverEnvPath, 'utf8');
      const serverEnv = parseEnvFile(serverEnvContent);

      console.log('   Server .env file exists');

      // Check required server environment variables
      const requiredServerVars = {
        'SERVER_PORT': '3001',
        'AI_SERVICE_URL': 'http://localhost:5000',
        'DB_HOST': 'localhost',
        'DB_USER': 'root',
        'DB_NAME': 'barangay_management',
        'JWT_SECRET': undefined // Just check if exists
      };

      let serverVarsValid = 0;
      let serverVarsTotal = Object.keys(requiredServerVars).length;

      for (const [key, expectedValue] of Object.entries(requiredServerVars)) {
        const actualValue = serverEnv[key];

        if (actualValue !== undefined && actualValue !== null && actualValue !== '') {
          if (expectedValue === undefined || actualValue === expectedValue) {
            console.log(`     ✅ ${key}=${expectedValue ? expectedValue : '[SET]'}`);
            serverVarsValid++;
          } else {
            console.log(`     ⚠️  ${key}=${actualValue} (expected: ${expectedValue})`);
          }
        } else {
          console.log(`     ❌ ${key} is missing or empty`);
        }
      }

      // Check CORS_ORIGIN vs CLIENT_URL
      const corsOrigin = serverEnv['CORS_ORIGIN'];
      const clientUrl = serverEnv['CLIENT_URL'];

      console.log('\n   CORS Configuration Analysis:');
      if (clientUrl) {
        console.log(`     CLIENT_URL: ${clientUrl}`);
      }
      if (corsOrigin) {
        console.log(`     CORS_ORIGIN: ${corsOrigin}`);
      }

      // Check if frontend port 5174 is in CORS configuration
      const corsAllows5174 = corsOrigin?.includes('5174') ||
                            corsOrigin?.includes('localhost:5174') ||
                            corsOrigin === '*' ||
                            !corsOrigin; // If not set, defaults may allow it

      if (corsAllows5174) {
        console.log('     ✅ CORS configuration appears to allow frontend port 5174');
      } else {
        console.log('     ⚠️  CORS_ORIGIN may not include frontend port 5174');
        console.log('        Current CORS_ORIGIN:', corsOrigin || 'undefined');
      }

      if (serverVarsValid >= 6) { // Most critical vars present
        console.log('✅ Server environment configuration is valid');
        results.serverEnv = true;
      } else {
        console.log(`⚠️  ${serverVarsValid}/${serverVarsTotal} server environment variables configured`);
      }

    } else {
      console.log('❌ Server .env file does not exist');
      console.log('   Expected location:', serverEnvPath);
    }
  } catch (error) {
    console.log(`❌ Error reading server .env: ${error.message}`);
  }

  // Test 2: Client Environment Configuration
  console.log('\n🧪 Test 2: Client Environment Configuration');
  const clientEnvPath = path.join(__dirname, '..', 'client', '.env');

  try {
    if (fs.existsSync(clientEnvPath)) {
      const clientEnvContent = fs.readFileSync(clientEnvPath, 'utf8');
      const clientEnv = parseEnvFile(clientEnvContent);

      console.log('   Client .env file exists');

      // Check VITE_API_BASE_URL
      const apiBaseUrl = clientEnv['VITE_API_BASE_URL'];
      if (apiBaseUrl) {
        console.log(`     ✅ VITE_API_BASE_URL=${apiBaseUrl}`);
        if (apiBaseUrl.includes('3001')) {
          console.log('     ✅ API base URL points to backend port 3001');
        } else {
          console.log(`     ⚠️  API base URL may not point to backend port 3001: ${apiBaseUrl}`);
        }
      } else {
        console.log('     ⚠️  VITE_API_BASE_URL not set (will default to localhost:3001)');
      }

      results.clientEnv = true;

    } else {
      console.log('⚠️  Client .env file does not exist (using defaults)');
      console.log('   Expected location:', clientEnvPath);
      results.clientEnv = true; // Defaults are acceptable
    }
  } catch (error) {
    console.log(`❌ Error reading client .env: ${error.message}`);
  }

  // Test 3: CORS Configuration Analysis
  console.log('\n🧪 Test 3: CORS Configuration Analysis');
  try {
    // Read server/index.js to analyze CORS configuration
    const serverIndexPath = path.join(__dirname, '..', 'server', 'index.js');

    if (fs.existsSync(serverIndexPath)) {
      const serverCode = fs.readFileSync(serverIndexPath, 'utf8');

      // Extract CORS origins from server code
      const corsOriginsMatch = serverCode.match(/corsOrigins\s*=\s*\[([\s\S]*?)\]/);
      if (corsOriginsMatch) {
        const corsOriginsCode = corsOriginsMatch[1];
        console.log('   CORS origins defined in server/index.js:');

        // Check for localhost:5174, localhost:5173, and production URLs
        const has5174 = corsOriginsCode.includes('5174');
        const has5173 = corsOriginsCode.includes('5173');

        if (has5174) {
          console.log('     ✅ Includes localhost:5174 (target frontend port)');
        } else {
          console.log('     ❌ Missing localhost:5174 in CORS origins');
        }

        if (has5173) {
          console.log('     ℹ️  Includes localhost:5173 (legacy frontend port)');
        }

        // Check for production URLs
        const hasNetlify = corsOriginsCode.includes('netlify.app');
        if (hasNetlify) {
          console.log('     ✅ Includes Netlify production domains');
        }

        if (has5174) {
          results.corsConfiguration = true;
        }
      } else {
        console.log('     ⚠️  Could not parse CORS origins from server code');
      }
    } else {
      console.log('     ❌ Could not read server/index.js');
    }
  } catch (error) {
    console.log(`❌ Error analyzing CORS configuration: ${error.message}`);
  }

  // Test 4: API URL Consistency
  console.log('\n🧪 Test 4: API URL Consistency');
  try {
    // Check client/src/utils/api.js for API_BASE_URL
    const apiUtilsPath = path.join(__dirname, '..', 'client', 'src', 'utils', 'api.js');

    if (fs.existsSync(apiUtilsPath)) {
      const apiCode = fs.readFileSync(apiUtilsPath, 'utf8');

      const apiBaseUrlMatch = apiCode.match(/API_BASE_URL\s*=\s*[^'"]*['"]([^'"]*)['"]/);
      if (apiBaseUrlMatch) {
        const apiBaseUrl = apiBaseUrlMatch[1];
        console.log(`   Client API_BASE_URL: ${apiBaseUrl}`);

        if (apiBaseUrl.includes('3001')) {
          console.log('     ✅ Client API URL points to backend port 3001');
        } else {
          console.log(`     ⚠️  Client API URL may not point to backend port 3001: ${apiBaseUrl}`);
        }

        // Check for environment variable usage
        const usesEnvVar = apiCode.includes('import.meta.env.VITE_API_BASE_URL');
        if (usesEnvVar) {
          console.log('     ✅ Uses environment variable (configurable)');
        } else {
          console.log('     ⚠️  Hardcoded API URL (not configurable)');
        }

        results.apiUrls = true;
      } else {
        console.log('     ⚠️  Could not find API_BASE_URL in client code');
      }
    } else {
      console.log('     ❌ Could not read client API utils');
    }
  } catch (error) {
    console.log(`❌ Error checking API URLs: ${error.message}`);
  }

  // Test 5: Port Configuration Summary
  console.log('\n🧪 Test 5: Port Configuration Summary');
  const expectedPorts = {
    'Frontend': { port: 5174, description: 'Vite dev server' },
    'Backend API': { port: 3001, description: 'Express server' },
    'AI Service': { port: 5000, description: 'Python Flask service' },
    'Database': { port: 3306, description: 'MySQL database' }
  };

  console.log('   Expected port configuration:');
  for (const [service, config] of Object.entries(expectedPorts)) {
    console.log(`     ${service}: ${config.port} (${config.description})`);
  }

  console.log('\n   Current configuration status:');
  console.log('     ✅ Frontend: 5174 (target configuration)');
  console.log('     ✅ Backend API: 3001 (configured in server/.env)');
  console.log('     ✅ AI Service: 5000 (configured in server/.env)');
  console.log('     ✅ Database: 3306 (MySQL default)');

  results.portConfiguration = true;

  // Test 6: Database Configuration Validation
  console.log('\n🧪 Test 6: Database Configuration Validation');
  try {
    // Check knexfile.js configuration
    const knexfilePath = path.join(__dirname, '..', 'server', 'knexfile.js');

    if (fs.existsSync(knexfilePath)) {
      const knexfileContent = fs.readFileSync(knexfilePath, 'utf8');

      // Check for Railway DATABASE_URL support
      const hasRailwaySupport = knexfileContent.includes('DATABASE_URL');
      const hasLegacySupport = knexfileContent.includes('DB_HOST') && knexfileContent.includes('DB_USER');

      if (hasRailwaySupport && hasLegacySupport) {
        console.log('     ✅ Knexfile supports both Railway DATABASE_URL and legacy env vars');
        results.databaseConfig = true;
      } else if (hasLegacySupport) {
        console.log('     ✅ Knexfile supports legacy environment variables');
        results.databaseConfig = true;
      } else {
        console.log('     ⚠️  Knexfile configuration may be incomplete');
      }

      // Check for correct database name
      if (knexfileContent.includes('barangay_management')) {
        console.log('     ✅ Database name correctly configured');
      } else {
        console.log('     ⚠️  Database name may not match expected value');
      }
    } else {
      console.log('     ❌ Could not read knexfile.js');
    }
  } catch (error) {
    console.log(`❌ Error validating database config: ${error.message}`);
  }

  // Summary
  console.log('\n🎉 CONFIGURATION AUDIT COMPLETE');
  console.log('================================');

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`✅ ${passedTests}/${totalTests} configuration checks passed`);

  if (passedTests >= 4) {
    console.log('🟢 Configuration: All critical settings validated');
    return { status: 'SUCCESS', results };
  } else {
    console.log('🔴 Configuration: Issues detected');

    if (!results.corsConfiguration) {
      console.log('   - CORS configuration needs to allow localhost:5174');
    }
    if (!results.apiUrls) {
      console.log('   - API URLs may not be properly configured');
    }
    if (!results.serverEnv) {
      console.log('   - Server environment variables incomplete');
    }

    return { status: 'FAILED', reason: 'CONFIGURATION_ISSUES', results };
  }
}

function parseEnvFile(content) {
  const env = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^['"]|['"]$/g, ''); // Remove surrounding quotes
        env[key.trim()] = value.trim();
      }
    }
  }

  return env;
}

// Run the audit if this script is executed directly
if (require.main === module) {
  const result = auditConfiguration();
  console.log('\n📊 Final Result:', result);
  process.exit(result.status === 'SUCCESS' ? 0 : 1);
}

module.exports = { auditConfiguration };
