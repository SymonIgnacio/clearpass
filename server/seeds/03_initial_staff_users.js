const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // First, delete any existing staff users to avoid conflicts
  await knex('users')
    .where('username', 'in', ['superadmin', 'captain', 'captain01', 'secretary', 'secretary01', 'clerk', 'clerk01'])
    .del();

  // Hash the common password for all users
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Insert staff users with proper hierarchy
  await knex('users').insert([
    {
      username: 'superadmin',
      password_hash: hashedPassword,
      full_name: 'Super Administrator',
      email: 'superadmin@barangay.local',
      role: 'admin',
      is_active: true,
      created_at: knex.fn.now()
    },
    {
      username: 'captain',
      password_hash: hashedPassword,
      full_name: 'Barangay Captain',
      email: 'captain@barangay.local',
      role: 'captain',
      is_active: true,
      created_at: knex.fn.now()
    },
    {
      username: 'secretary',
      password_hash: hashedPassword,
      full_name: 'Barangay Secretary',
      email: 'secretary@barangay.local',
      role: 'secretary',
      is_active: true,
      created_at: knex.fn.now()
    },
    {
      username: 'clerk',
      password_hash: hashedPassword,
      full_name: 'Barangay Clerk',
      email: 'clerk@barangay.local',
      role: 'clerk',
      is_active: true,
      created_at: knex.fn.now()
    }
  ]);

  console.log('✅ Staff users seeded successfully');
  console.log('Username: superadmin, Password: admin123');
  console.log('Username: captain, Password: admin123');
  console.log('Username: secretary, Password: admin123');
  console.log('Username: clerk, Password: admin123');
};
