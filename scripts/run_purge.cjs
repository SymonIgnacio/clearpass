const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const db = require('../server/database');

async function runPurge() {
  try {
    console.log('🗑️ Purging fees from database...');
    
    // 1. Check if column exists before dropping to avoid errors
    const [cols1] = await db.execute("SHOW COLUMNS FROM certificate_types LIKE 'fee'");
    if (cols1.length > 0) {
      await db.execute('ALTER TABLE certificate_types DROP COLUMN fee');
      console.log('✅ Dropped fee from certificate_types');
    } else {
      console.log('ℹ️ fee column not found in certificate_types');
    }

    const [cols2] = await db.execute("SHOW COLUMNS FROM certificates_log LIKE 'fee_amount'");
    if (cols2.length > 0) {
      await db.execute('ALTER TABLE certificates_log DROP COLUMN fee_amount');
      console.log('✅ Dropped fee_amount from certificates_log');
    } else {
      console.log('ℹ️ fee_amount column not found in certificates_log');
    }

    console.log('🎉 Database purge complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Purge failed:', error);
    process.exit(1);
  }
}

runPurge();
