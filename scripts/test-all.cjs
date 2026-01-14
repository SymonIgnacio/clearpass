const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args, cwd, name) {
  return new Promise((resolve, reject) => {
    log(`\n🚀 Starting ${name}...`, 'blue');
    const startTime = Date.now();
    
    // Determine shell based on OS
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'cmd.exe' : '/bin/sh';
    const shellArgs = isWindows ? ['/c', `${command} ${args.join(' ')}`] : ['-c', `${command} ${args.join(' ')}`];

    const child = spawn(shell, shellArgs, {
      cwd: cwd,
      stdio: 'inherit', // Pipe output directly to parent
      env: { ...process.env, CI: 'true' } // Set CI to true to avoid watch mode in some tools
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      if (code === 0) {
        log(`✅ ${name} passed in ${duration}s`, 'green');
        resolve({ name, code, duration, status: 'passed' });
      } else {
        log(`❌ ${name} failed in ${duration}s with code ${code}`, 'red');
        resolve({ name, code, duration, status: 'failed' }); // Resolve instead of reject to allow other tests to run
      }
    });

    child.on('error', (err) => {
      log(`❌ ${name} error: ${err.message}`, 'red');
      resolve({ name, code: 1, duration: 0, status: 'error', error: err.message });
    });
  });
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  log('🧪 ClearPass Comprehensive Test Suite', 'magenta');
  log('===================================', 'magenta');
  
  const results = [];

  // 1. Server Unit/Integration Tests
  const serverResult = await runCommand('npm', ['test'], path.join(rootDir, 'server'), 'Server Tests');
  results.push(serverResult);

  // 2. Client Unit Tests
  // vitest needs --run to not watch
  const clientResult = await runCommand('npm', ['test', '--', '--run'], path.join(rootDir, 'client'), 'Client Tests');
  results.push(clientResult);

  // 3. AI Service Tests
  const aiResult = await runCommand('python', ['-m', 'unittest', 'test_suggestion_engine.py'], path.join(rootDir, 'ai_service'), 'AI Service Tests');
  results.push(aiResult);

  // 4. System Integration Tests
  const systemResult = await runCommand('node', ['scripts/run-tests.cjs'], rootDir, 'System Integration Tests');
  results.push(systemResult);

  // Summary
  log('\n📊 Final Test Report', 'magenta');
  log('====================', 'magenta');
  
  let allPassed = true;
  results.forEach(res => {
    const icon = res.status === 'passed' ? '✅' : '❌';
    const color = res.status === 'passed' ? 'green' : 'red';
    log(`${icon} ${res.name}: ${res.status.toUpperCase()} (${res.duration}s)`, color);
    if (res.status !== 'passed') allPassed = false;
  });

  if (allPassed) {
    log('\n🎉 All systems operational!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some systems failed checks. Review logs above.', 'red');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
