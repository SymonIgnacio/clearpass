const path = require('path');
const fs = require('fs');

const envPathServer = path.join(__dirname, '../.env');
const envPathRoot = path.join(__dirname, '../../.env');

if (fs.existsSync(envPathServer)) {
  require('dotenv').config({ path: envPathServer });
} else if (fs.existsSync(envPathRoot)) {
  require('dotenv').config({ path: envPathRoot });
}

const knexConfig = require('../knexfile');
const environment = process.env.NODE_ENV || 'development';
const knex = require('knex')(knexConfig[environment]);

async function cleanPresentationData() {
  console.log('🧹 Starting cleanup for presentation...');

  try {
    // Disable FK checks to allow arbitrary deletion order
    await knex.raw('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Clear Certificate & Request Data
    console.log('   - Clearing certificate logs...');
    await knex('certificates_log').del();

    console.log('   - Clearing document requests...');
    await knex('document_requests').del();

    // Check for clearance_requests (might not exist in all schema versions)
    if (await knex.schema.hasTable('clearance_requests')) {
      console.log('   - Clearing clearance requests...');
      await knex('clearance_requests').del();
    }

    // 2. Clear Blotter Data
    console.log('   - Clearing blotter cases...');
    await knex('blotter').del();

    // Reset Blotter Sequences to ensure Case #0001
    if (await knex.schema.hasTable('blotter_case_sequences')) {
      console.log('   - Resetting blotter case sequences...');
      await knex('blotter_case_sequences').del();
    }

    // 3. Clear Resident Data
    console.log('   - Clearing vulnerabilities...');
    await knex('vulnerabilities').del();

    console.log('   - Clearing residents...');
    await knex('residents').del();

    // 4. Clear Households
    console.log('   - Clearing households...');
    await knex('households').del();

    // 5. Clear Resident Users (Keep Admin/Staff)
    console.log('   - Clearing resident user accounts...');
    await knex('users').where('role', 'resident').del();

    // Re-enable FK checks
    await knex.raw('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n✨ CLEANUP COMPLETE: System is ready for fresh data.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR: Cleanup failed');
    console.error(error);
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

// Ask for confirmation if running interactively (optional, but good for safety)
// For script usage, we assume intentional execution.
cleanPresentationData();
