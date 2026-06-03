const { spawnSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');

const suites = [
  {
    name: 'server security smoke tests',
    command: 'npm',
    args: [
      'test',
      '--',
      '--runInBand',
      '__tests__/aiPatrolRbac.test.js',
      '__tests__/corsConfig.test.js',
      '__tests__/debugUsersRemoved.test.js',
      '__tests__/documentRequestsIdor.test.js',
      '__tests__/envConfig.test.js',
      '__tests__/fileTypeValidation.test.js',
      '__tests__/mfaOtpFlow.test.js',
      '__tests__/residentOwnedRoutesIdor.test.js',
      '__tests__/sensitiveRoutesMfa.test.js',
    ],
    cwd: serverDir,
  },
];

let failed = false;

for (const suite of suites) {
  console.log(`\n== ${suite.name} ==`);
  const result = spawnSync(suite.command, suite.args, {
    cwd: suite.cwd,
    env: {
      ...process.env,
      PUPPETEER_SKIP_DOWNLOAD: '1',
    },
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
