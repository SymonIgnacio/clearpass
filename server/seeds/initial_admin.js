/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  const bcrypt = require('bcryptjs');
  
  // Check if admin already exists
  const existingAdmin = await knex('users')
    .where({ username: 'admin' })
    .first();
  
  if (existingAdmin) {
    console.log('✅ Admin user already exists, skipping seed');
    return;
  }
  
  const seedPassword = process.env.SEED_DEFAULT_PASSWORD;
  if (!seedPassword) {
    throw new Error('SEED_DEFAULT_PASSWORD is required for admin seeding');
  }
  const hashedPassword = await bcrypt.hash(seedPassword, 10);
  
  // Insert default admin user
  await knex('users').insert({
    username: 'admin',
    password_hash: hashedPassword,
    full_name: 'System Administrator',
    email: 'admin@barangay.local',
    contact_number: '09123456789',
    role: 1,
    is_active: true,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  });
  
  console.log('✅ Default admin user created');
  console.log('   Username: admin');
};
