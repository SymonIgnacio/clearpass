const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    console.log('🔍 Checking if test user exists...');

    // Check if user already exists
    const existing = await knex('users').where('email', 'Symonignacio1@gmail.com').first();
    if (existing) {
      console.log('✅ User already exists');
      return;
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash('123456', 10);

    console.log('👤 Creating user account...');
    // Insert user
    const [userId] = await knex('users').insert({
      username: 'Symonignacio1@gmail.com',
      password_hash: hashedPassword,
      role: 'resident',
      email: 'Symonignacio1@gmail.com',
      full_name: 'Symon Ignacio',
      contact_number: '09625460372',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log('🏠 Creating resident record...');
    // Insert resident
    await knex('residents').insert({
      Resident_ID: 'RES-HARDCODED-001',
      Household_ID: 'H-2025-001',
      Relation_to_Head: 'Boarder',
      First_Name: 'Symon',
      Middle_Name: 'Balilla',
      Last_Name: 'Ignacio',
      Birthdate: '2004-07-01',
      Age: 21,
      Gender: 'Male',
      Civil_Status: 'Single',
      Occupation: 'Student',
      Income_Estimate: 0,
      Email: 'Symonignacio1@gmail.com',
      Mobile_Number: '09625460372',
      Voter_Status: 'Non-Registered',
      Date_Arrival: '2025-12-19',
      Residency_Status: 'Active',
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log('✅ Test user and resident created successfully!');
    console.log('📧 Email: Symonignacio1@gmail.com');
    console.log('🔑 Password: 123456');
    console.log('🆔 Resident ID: RES-HARDCODED-001');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await knex.destroy();
    process.exit(0);
  }
}

createTestUser();
