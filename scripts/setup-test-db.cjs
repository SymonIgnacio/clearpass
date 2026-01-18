const testDbManager = require('../server/tests/utils/testDbManager');

async function setup() {
  try {
    // await testDbManager.createTestDb();
    await testDbManager.migrateAndSeed();
    console.log('✅ Test database setup complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    process.exit(1);
  }
}

setup();
