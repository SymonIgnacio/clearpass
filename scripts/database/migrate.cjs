const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  const environment = process.env.NODE_ENV || 'development';
  const knexConfig = require('../../server/knexfile.js');
  const config = knexConfig[environment] || knexConfig.development;

  const knex = require('knex')(config);

  try {
    const [batchNo, log] = await knex.migrate.latest();
    if (log.length === 0) {
      console.log(`✅ No new migrations to run (batch ${batchNo}).`);
    } else {
      console.log(`✅ Ran migrations (batch ${batchNo}):`);
      for (const file of log) console.log(`  - ${file}`);
    }
  } finally {
    await knex.destroy();
  }
}

run().catch((error) => {
  console.error('❌ Migration failed:', error?.message || error);
  process.exit(1);
});
