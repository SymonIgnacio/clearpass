const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/roles');

exports.seed = async function(knex) {
  // First, delete any existing staff users to avoid conflicts
  await knex('users')
    .where('username', 'in', ['superadmin', 'captain', 'captain01', 'secretary', 'secretary01', 'clerk', 'clerk01'])
    .del();

  const seedPassword = process.env.SEED_DEFAULT_PASSWORD;
  if (!seedPassword) {
    throw new Error('SEED_DEFAULT_PASSWORD is required for staff user seeding');
  }
  const hashedPassword = await bcrypt.hash(seedPassword, 10);

  // Insert staff users with proper hierarchy
  await knex('users').insert([
    {
      username: 'superadmin',
      password_hash: hashedPassword,
      full_name: 'Super Administrator',
      email: 'superadmin@barangay.local',
      role: ROLES.ADMIN,
      is_active: true,
      created_at: knex.fn.now()
    },
    {
      username: 'captain',
      password_hash: hashedPassword,
      full_name: 'Barangay Captain',
      email: 'captain@barangay.local',
      role: ROLES.CAPTAIN,
      is_active: true,
      created_at: knex.fn.now()
    },
    {
      username: 'secretary',
      password_hash: hashedPassword,
      full_name: 'Barangay Secretary',
      email: 'secretary@barangay.local',
      role: ROLES.SECRETARY,
      is_active: true,
      created_at: knex.fn.now()
    },
    {
      username: 'clerk',
      password_hash: hashedPassword,
      full_name: 'Barangay Clerk',
      email: 'clerk@barangay.local',
      role: ROLES.CLERK,
      is_active: true,
      created_at: knex.fn.now()
    }
  ]);

  console.log('✅ Staff users seeded successfully');
  console.log('Usernames: superadmin, captain, secretary, clerk');
};
