const path = require('path');
const fs = require('fs');

// Robust .env loading (Check server/ first, then root)
const envPathServer = path.join(__dirname, '../.env');
const envPathRoot = path.join(__dirname, '../../.env');

if (fs.existsSync(envPathServer)) {
  require('dotenv').config({ path: envPathServer });
} else if (fs.existsSync(envPathRoot)) {
  require('dotenv').config({ path: envPathRoot });
} else {
  console.warn('⚠️  WARNING: No .env file found in server/ or root!');
}

const knexConfig = require('../knexfile');
// Determine environment or default to development
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

console.log(`🔌 Attempting to connect to database in '${environment}' mode...`);
console.log(`   Host: ${config.connection.host}`);
console.log(`   User: ${config.connection.user}`);
console.log(`   DB:   ${config.connection.database}`);

const knex = require('knex')(config);

async function testConnection() {
  try {
    // 1. Test basic connection
    await knex.raw('SELECT 1+1 as result');
    console.log('✅ Database connection successful!');

    // 2. Test write permission (using a safe table 'sitios' or creating a temp table)
    // We'll use 'sitios' as it's a core table but less critical than users/residents
    const testSitioName = 'TEST_CONNECTION_SITIO_' + Date.now();

    console.log('📝 Testing write permissions...');
    await knex('sitios').insert({
      name: testSitioName,
      description: 'Temporary test record for DB verification',
    });
    console.log('✅ Write successful (Insert)');

    // 3. Verify read
    const record = await knex('sitios').where('name', testSitioName).first();
    if (record) {
      console.log('✅ Read successful (Select)');
    } else {
      throw new Error('Could not read back the inserted record');
    }

    // 4. Clean up
    await knex('sitios').where('name', testSitioName).del();
    console.log('✅ Cleanup successful (Delete)');

    console.log('\n🎉 ALL CHECKS PASSED: Database is ready for presentation scripts.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR: Database check failed');
    console.error(error);
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

testConnection();
