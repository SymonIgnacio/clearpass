const { logger } = require('../server/middleware/logger');
const fs = require('fs');
const path = require('path');

async function testLogger() {
  console.log('📝 Testing logger configuration...');

  // Log various levels
  logger.info('Test Info Log', { test: true });
  logger.error('Test Error Log', { error: new Error('Test Error') });
  logger.warn('Test Warning Log');

  // Give Winston a moment to flush to disk
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check if log directory exists
  const logsDir = path.join(__dirname, '../server/logs');
  if (!fs.existsSync(logsDir)) {
    console.error('❌ Logs directory not created!');
    process.exit(1);
  }

  // Check for today's log files
  const date = new Date().toISOString().split('T')[0];
  const files = fs.readdirSync(logsDir);
  
  const hasCombined = files.some(f => f.includes(`combined-${date}`));
  const hasError = files.some(f => f.includes(`error-${date}`));

  if (hasCombined && hasError) {
    console.log('✅ Log rotation working: Files created with date pattern.');
    console.log('Files found:', files.filter(f => f.includes(date)));
  } else {
    console.error('❌ Log files missing or incorrect naming pattern.');
    console.log('Files found:', files);
    process.exit(1);
  }
}

testLogger();
