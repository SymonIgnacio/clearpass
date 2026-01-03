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
  
  // Hash default password: admin123
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Insert default admin user
  await knex('users').insert({
    username: 'admin',
    password_hash: hashedPassword,
    full_name: 'System Administrator',
    email: 'admin@barangay.local',
    contact_number: '09123456789',
    role: 5, // IT Admin role
    is_active: true,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  });
  
  console.log('✅ Default admin user created');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   ⚠️  CHANGE PASSWORD IMMEDIATELY IN PRODUCTION');
};
