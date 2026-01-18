const db = require('../server/database');
const { ROLES } = require('../server/config/roles');

async function checkUsers() {
  try {
    const [users] = await db.execute('SELECT username, role FROM users');
    console.log('Users in DB:', users);
    console.log('ROLES.ADMIN:', ROLES.ADMIN);
    console.log('ROLES.RESIDENT:', ROLES.RESIDENT);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkUsers();
