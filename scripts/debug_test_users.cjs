const db = require('../server/database');
const { ROLES } = require('../server/config/roles');

async function checkTestUsers() {
  try {
    const [users] = await db.execute('SELECT username, role FROM users');
    console.log('Users in TEST DB:', users);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkTestUsers();
