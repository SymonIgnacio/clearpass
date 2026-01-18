const db = require('../server/database');

async function checkSchema() {
  try {
    const [rows] = await db.execute('DESCRIBE community_programs');
    console.log('Schema:', rows);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkSchema();
