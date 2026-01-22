const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  // ==========================================
  // ACCOUNT HIERARCHY SETUP FOR EXISTING SCHEMA
  // ==========================================

  console.log('🔄 Updating existing users with proper bcrypt passwords...');

  // Update existing users with properly hashed passwords
  const superAdminHash = await bcrypt.hash('superadmin123', 10);
  const captainHash = await bcrypt.hash('captain', 10);
  const secretaryHash = await bcrypt.hash('secretary', 10);
  const clerkHash = await bcrypt.hash('clerk', 10);

  // Create or update superadmin user
  const existingSuperAdmin = await knex('users').where('username', 'superadmin').first();
  if (!existingSuperAdmin) {
    await knex('users').insert({
      username: 'superadmin',
      password_hash: superAdminHash,
      role: 'admin',
      full_name: 'Super Administrator',
      email: 'superadmin@barangay.gov.ph',
      is_active: true,
    });
    console.log('✅ Created superadmin user');
  } else {
    await knex('users').where('username', 'superadmin').update({
      password_hash: superAdminHash,
      full_name: 'Super Administrator',
      email: 'superadmin@barangay.gov.ph',
      is_active: true,
    });
    console.log('✅ Updated superadmin user');
  }

  await knex('users').where('username', 'captain').update({
    password_hash: captainHash,
    full_name: 'Barangay Captain',
    email: 'captain@barangay.gov.ph',
  });

  await knex('users').where('username', 'secretary').update({
    password_hash: secretaryHash,
    full_name: 'Barangay Secretary',
    email: 'secretary@barangay.gov.ph',
  });

  await knex('users').where('username', 'clerk').update({
    password_hash: clerkHash,
    full_name: 'Barangay Clerk',
    email: 'clerk@barangay.gov.ph',
  });

  console.log('✅ User passwords updated with proper bcrypt hashing');
  console.log('👥 Available login credentials:');
  console.log('   superadmin / superadmin123 (Super Admin)');
  console.log('   captain / captain (Barangay Captain)');
  console.log('   secretary / secretary (Barangay Secretary)');
  console.log('   clerk / clerk (Barangay Clerk)');
};
