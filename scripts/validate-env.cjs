#!/usr/bin/env node

// Force CommonJS mode
const { createRequire } = require('module');
const require = createRequire(import.meta.url);

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEnvironmentConfig() {
  log('🔍 Environment Configuration Validation', 'blue');
  log('=========================================\n');

  let hasErrors = false;
  let hasWarnings = false;

  // Check server environment
  log('📋 Server Environment Check:', 'blue');
  const serverEnvPath = path.join(__dirname, '../../server/.env');
  const serverEnvExamplePath = path.join(__dirname, '../../server/.env.example');

  if (!fs.existsSync(serverEnvPath)) {
    log('  ❌ server/.env file not found', 'red');
    if (fs.existsSync(serverEnvExamplePath)) {
      log('  💡 Copy server/.env.example to server/.env and configure', 'yellow');
    }
    hasErrors = true;
  } else {
    log('  ✅ server/.env file exists', 'green');
    
    // Load and validate server environment
    require('dotenv').config({ path: serverEnvPath });
    
    const requiredServerVars = [
      'DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'
    ];
    
    const optionalServerVars = [
      'DB_PASSWORD', 'DB_PORT', 'SERVER_PORT', 'NODE_ENV', 
      'AI_SERVICE_URL', 'AI_SERVICE_ENABLED'
    ];

    requiredServerVars.forEach(varName => {
      if (!process.env[varName]) {
        log(`    ❌ Missing required variable: ${varName}`, 'red');
        hasErrors = true;
      } else {
        log(`    ✅ ${varName} is set`, 'green');
      }
    });

    optionalServerVars.forEach(varName => {
      if (!process.env[varName]) {
        log(`    ⚠️  Optional variable not set: ${varName}`, 'yellow');
        hasWarnings = true;
      } else {
        log(`    ✅ ${varName} is set`, 'green');
      }
    });

    // Validate JWT secret strength
    if (process.env.JWT_SECRET) {
      if (process.env.JWT_SECRET.length < 32) {
        log('    ⚠️  JWT_SECRET should be at least 32 characters', 'yellow');
        hasWarnings = true;
      }
      if (process.env.JWT_SECRET.includes('change') || process.env.JWT_SECRET.includes('secret')) {
        log('    ⚠️  JWT_SECRET appears to be a default value', 'yellow');
        hasWarnings = true;
      }
    }
  }

  // Check client environment
  log('\n📋 Client Environment Check:', 'blue');
  const clientEnvPath = path.join(__dirname, '../../client/.env');
  const clientEnvExamplePath = path.join(__dirname, '../../client/.env.example');

  if (!fs.existsSync(clientEnvPath)) {
    log('  ❌ client/.env file not found', 'red');
    if (fs.existsSync(clientEnvExamplePath)) {
      log('  💡 Copy client/.env.example to client/.env and configure', 'yellow');
    }
    hasErrors = true;
  } else {
    log('  ✅ client/.env file exists', 'green');
    
    // Read client .env file
    const clientEnvContent = fs.readFileSync(clientEnvPath, 'utf8');
    const clientEnvVars = {};
    
    clientEnvContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        clientEnvVars[key.trim()] = value.trim();
      }
    });

    // Check required client variables
    const requiredClientVars = ['VITE_API_BASE_URL'];
    
    requiredClientVars.forEach(varName => {
      if (!clientEnvVars[varName]) {
        log(`    ❌ Missing required variable: ${varName}`, 'red');
        hasErrors = true;
      } else {
        log(`    ✅ ${varName} is set`, 'green');
        
        // Validate API URL format
        if (varName === 'VITE_API_BASE_URL') {
          const apiUrl = clientEnvVars[varName];
          if (!apiUrl.startsWith('http')) {
            log(`    ⚠️  ${varName} should start with http:// or https://`, 'yellow');
            hasWarnings = true;
          }
          
          // Check if server port matches
          const serverPort = process.env.SERVER_PORT || '3001';
          if (!apiUrl.includes(`:${serverPort}`)) {
            log(`    ⚠️  API URL port may not match server port (${serverPort})`, 'yellow');
            hasWarnings = true;
          }
        }
      }
    });
  }

  // Check AI service environment
  log('\n📋 AI Service Environment Check:', 'blue');
  const aiEnvPath = path.join(__dirname, '../../ai_service/.env');
  
  if (!fs.existsSync(aiEnvPath)) {
    log('  ⚠️  ai_service/.env file not found (optional)', 'yellow');
    hasWarnings = true;
  } else {
    log('  ✅ ai_service/.env file exists', 'green');
  }

  // Check package.json files
  log('\n📋 Package Configuration Check:', 'blue');
  
  const packagePaths = [
    { name: 'Server', path: '../../server/package.json' },
    { name: 'Client', path: '../../client/package.json' }
  ];

  packagePaths.forEach(({ name, path: pkgPath }) => {
    const fullPath = path.join(__dirname, pkgPath);
    if (fs.existsSync(fullPath)) {
      log(`  ✅ ${name} package.json exists`, 'green');
      
      try {
        const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (pkg.scripts && pkg.scripts.start) {
          log(`    ✅ ${name} has start script`, 'green');
        } else {
          log(`    ⚠️  ${name} missing start script`, 'yellow');
          hasWarnings = true;
        }
      } catch (error) {
        log(`    ❌ ${name} package.json is invalid JSON`, 'red');
        hasErrors = true;
      }
    } else {
      log(`  ❌ ${name} package.json not found`, 'red');
      hasErrors = true;
    }
  });

  // Summary
  log('\n📊 Validation Summary:', 'blue');
  log('====================');
  
  if (hasErrors) {
    log('❌ Configuration has ERRORS that must be fixed', 'red');
    log('   Please address the issues above before starting the system', 'red');
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  Configuration has warnings but should work', 'yellow');
    log('   Consider addressing the warnings for optimal performance', 'yellow');
    process.exit(0);
  } else {
    log('✅ Configuration looks good!', 'green');
    log('   System should start without issues', 'green');
    process.exit(0);
  }
}

// Generate environment files if they don't exist
function generateEnvironmentFiles() {
  log('🛠️  Generating missing environment files...', 'blue');
  
  const serverEnvPath = path.join(__dirname, '../../server/.env');
  const clientEnvPath = path.join(__dirname, '../../client/.env');
  
  // Generate server .env if missing
  if (!fs.existsSync(serverEnvPath)) {
    const serverEnvContent = `# Server Environment Variables
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=barangay_management
DB_PORT=3306

# JWT Configuration
JWT_SECRET=${require('crypto').randomBytes(32).toString('hex')}
JWT_EXPIRES_IN=24h

# Server Configuration
SERVER_PORT=3001
NODE_ENV=development

# AI Service Configuration
AI_SERVICE_URL=http://localhost:5001
AI_SERVICE_ENABLED=true
`;
    
    fs.writeFileSync(serverEnvPath, serverEnvContent);
    log('  ✅ Generated server/.env', 'green');
  }
  
  // Generate client .env if missing
  if (!fs.existsSync(clientEnvPath)) {
    const clientEnvContent = `# Client Environment Variables
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
`;
    
    fs.writeFileSync(clientEnvPath, clientEnvContent);
    log('  ✅ Generated client/.env', 'green');
  }
}

// Main execution
const command = process.argv[2];

if (command === 'generate') {
  generateEnvironmentFiles();
} else {
  validateEnvironmentConfig();
}