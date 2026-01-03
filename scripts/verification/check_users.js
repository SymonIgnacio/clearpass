const knex = require('./server/knexfile')[process.env.NODE_ENV || 'development'];
const db = require('knex')(knex);

async function checkUsers() {
  try {
    const users = await db('users').select('id', 'username', 'password_hash', 'role', 'full_name');
    console.log('Current users in database:');
    users.forEach(user => {
      console.log(`  ${user.username}: ${user.role} - ${user.full_name || 'No name'}`);
      console.log(`    Password hash: ${user.password_hash.substring(0, 20)}...`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
}

checkUsers();
