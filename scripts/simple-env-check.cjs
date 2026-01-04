const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Configuration Validation');
console.log('=========================================\n');

let hasErrors = false;

// Check server environment
console.log('📋 Server Environment Check:');
const serverEnvPath = path.join(__dirname, '../server/.env');

if (!fs.existsSync(serverEnvPath)) {
  console.log('  ❌ server/.env file not found');
  hasErrors = true;
} else {
  console.log('  ✅ server/.env file exists');
}

// Check client environment
console.log('\n📋 Client Environment Check:');
const clientEnvPath = path.join(__dirname, '../client/.env');

if (!fs.existsSync(clientEnvPath)) {
  console.log('  ❌ client/.env file not found');
  hasErrors = true;
} else {
  console.log('  ✅ client/.env file exists');
}

// Summary
console.log('\n📊 Validation Summary:');
if (hasErrors) {
  console.log('❌ Configuration has issues');
  process.exit(1);
} else {
  console.log('✅ Configuration looks good!');
  process.exit(0);
}