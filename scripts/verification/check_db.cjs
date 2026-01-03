const knex = require('./server/knexfile')[process.env.NODE_ENV || 'development'];
const db = require('knex')(knex);

async function checkDatabase() {
  try {
    console.log('Checking database connection...');

    // Check if users table exists
    const tables = await db.raw("SHOW TABLES LIKE 'users'");
    console.log('Users table exists:', tables[0].length > 0);

    // Try to select from users table
    try {
      const allUsers = await db('users').select('*').limit(10);
      console.log('Users count:', allUsers.length);
      users = [{ count: allUsers.length }];
    } catch (countError) {
      console.log('Count query failed, trying direct select...');
      const allUsers = await db.raw('SELECT * FROM users LIMIT 10');
      console.log('Users count:', allUsers[0].length);
      users = [{ count: allUsers[0].length }];
    }

    if (users[0].count === 0) {
      console.log('❌ No users found in database!');
      console.log('Need to import the COMPLETE_BARANGAY_DATABASE.sql file');

      // Check if SQL file exists
      const fs = require('fs');
      const path = require('path');
      const sqlFile = path.join(__dirname, 'database', 'COMPLETE_BARANGAY_DATABASE.sql');

      if (fs.existsSync(sqlFile)) {
        console.log('✅ SQL file found at:', sqlFile);
        console.log('💡 Please import it manually with:');
        console.log('mysql -u root -p barangay_management < database/COMPLETE_BARANGAY_DATABASE.sql');
      } else {
        console.log('❌ SQL file not found at:', sqlFile);
      }
    } else {
      // Show actual users
      const userList = await db('users').select('id', 'username', 'role', 'full_name', 'password_hash');
      console.log('✅ Users in database:');
      userList.forEach(user => {
        const hashPreview = user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL';
        console.log(`  👤 ${user.username}: ${user.role} - ${user.full_name || 'No name'}`);
        console.log(`     Password hash: ${hashPreview}`);
      });
    }

    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.log('Database connection details:');
    console.log('Host:', knex.connection.host);
    console.log('Database:', knex.connection.database);
    console.log('User:', knex.connection.user);
    process.exit(1);
  }
}

checkDatabase();
