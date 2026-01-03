const knex = require('knex');
const path = require('path');

// Load knexfile
const knexfile = require('./server/knexfile.js');

// Create knex instance
const db = knex(knexfile.development);

async function runSpecificMigration() {
  try {
    console.log('🔄 Running specific migration to alter file_data column...');

    // Run the specific ALTER TABLE query
    await db.raw('ALTER TABLE document_templates MODIFY COLUMN file_data MEDIUMBLOB');

    console.log('✅ Successfully altered file_data column to MEDIUMBLOB');
    console.log('✅ Template upload should now work with larger files (up to 16MB)');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    // Close connection
    await db.destroy();
    process.exit(0);
  }
}

runSpecificMigration();
