require('dotenv').config();
const knex = require('knex');
const knexConfig = require('../knexfile');
const bcrypt = require('bcryptjs');

// FORCE EMPTY PASSWORD FOR LOCALHOST XAMPP
// The previous debug showed DB_PASSWORD had length 8, which is incorrect for default XAMPP.
const config = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: '', // Force empty for XAMPP
    database: process.env.DB_NAME || 'barangay_management',
    port: process.env.DB_PORT || 3306,
  },
  pool: { min: 2, max: 10 },
};

// Debug: Print connection details (careful with password)
console.log('DEBUG: Connection Config:', {
  host: config.connection.host,
  user: config.connection.user,
  database: config.connection.database,
  passwordLength: config.connection.password ? config.connection.password.length : 0,
  passwordType: typeof config.connection.password,
  envPasswordLength: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0,
});

const db = knex(config);

async function atomicSystemReset() {
  console.log('🚀 Starting Atomic System Reset...');

  // Test connection first
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully.');
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
    process.exit(1);
  }

  const trx = await db.transaction();

  try {
    // ==========================================
    // 1. DATA PURGE (Dependent tables first)
    // ==========================================
    console.log('🗑️  Purging resident and operational data...');

    // Disable FK checks for easier deletion, but we'll try to delete in order first
    await trx.raw('SET FOREIGN_KEY_CHECKS = 0');

    // Operational Data
    await trx('notifications').del();
    await trx('user_notifications').del();
    await trx('login_attempts').del();

    // AI & Analytics
    await trx('ai_analytics_reports').del();
    await trx('ai_appointments').del();
    await trx('ai_chatbot_conversations').del();
    await trx('ai_ocr_cache').del();

    // Resident Related
    await trx('blotter_participants').del();
    await trx('blotter').del();
    await trx('certificates_log').del();
    await trx('clearance_requests').del();
    await trx('document_requests').del();
    await trx('resident_documents').del();
    await trx('resident_applications').del();
    await trx('resident_signup_requests').del();
    await trx('resident_verification_requests').del();
    await trx('program_participants').del();
    await trx('vulnerabilities').del();

    // Core Resident Data
    await trx('residents').del();
    // await trx('families').del(); // Table does not exist in current schema
    await trx('households').del();

    // Visitors/Vehicles
    await trx('visitors').del();
    await trx('vehicles').del();

    console.log('✅ Purge complete.');

    // ==========================================
    // 2. REPOPULATION (Fresh Data)
    // ==========================================
    console.log('🌱 Repopulating system with fresh data...');

    // 2.1 Sitios (Ensure they exist)
    const sitiosCount = await trx('sitios').count('id as count').first();
    if (sitiosCount.count == 0) {
      await trx('sitios').insert([
        {
          name: 'Batia Proper',
          description: 'Main residential and commercial area, population ~2,500',
        },
        {
          name: 'Northville 5',
          description: 'Northern residential district with growing community',
        },
        { name: 'St. Martha', description: 'Eastern residential area with mixed housing types' },
        { name: 'AFP/PNP', description: 'Military and police housing compound' },
      ]);
      console.log('   -> Sitios seeded.');
    }

    // 2.2 Households
    const sitio = await trx('sitios').first();
    const sitioId = sitio ? sitio.id : 1;

    await trx('households').insert([
      {
        Household_ID: 'H-2025-001',
        Household_Number: 'HH-001',
        Sitio_ID: sitioId,
        Street_Address: 'Block 1, Lot 1, Batia Proper',
        Total_Members: 4,
        Household_Type: 'Nuclear',
      },
      {
        Household_ID: 'H-2025-002',
        Household_Number: 'HH-002',
        Sitio_ID: sitioId,
        Street_Address: 'Block 1, Lot 2, Batia Proper',
        Total_Members: 3,
        Household_Type: 'Nuclear',
      },
    ]);
    console.log('   -> Households seeded.');

    // 2.3 Residents
    await trx('residents').insert([
      {
        Resident_ID: 'RES-2025-001',
        Household_ID: 'H-2025-001',
        Relation_to_Head: 'Head',
        First_Name: 'Juan',
        Middle_Name: 'Garcia',
        Last_Name: 'Dela Cruz',
        Birthdate: '1985-03-15',
        // Age: 40, // Calculated column, do not insert
        Gender: 'Male',
        Civil_Status: 'Married',
        Occupation: 'Construction Worker',
        Income_Estimate: 15000.0,
        Email: 'juan.delacruz@example.com',
        Mobile_Number: '09171234567',
        Voter_Status: 'Registered',
        Date_Arrival: '2010-01-15',
        Residency_Status: 'Active',
        Profile_Photo_URL: 'https://i.pravatar.cc/150?img=1',
        QR_Hash_String: 'QR-RES-2025-001',
      },
      {
        Resident_ID: 'RES-2025-002',
        Household_ID: 'H-2025-001',
        Relation_to_Head: 'Spouse',
        First_Name: 'Maria',
        Middle_Name: 'Reyes',
        Last_Name: 'Dela Cruz',
        Birthdate: '1987-08-22',
        // Age: 38,
        Gender: 'Female',
        Civil_Status: 'Married',
        Occupation: 'Teacher',
        Income_Estimate: 25000.0,
        Email: 'maria.delacruz@example.com',
        Mobile_Number: '09171234568',
        Voter_Status: 'Registered',
        Date_Arrival: '2010-01-15',
        Residency_Status: 'Active',
        Profile_Photo_URL: 'https://i.pravatar.cc/150?img=2',
        QR_Hash_String: 'QR-RES-2025-002',
      },
      {
        Resident_ID: 'RES-2025-005',
        Household_ID: 'H-2025-002',
        Relation_to_Head: 'Head',
        First_Name: 'Pedro',
        Middle_Name: 'Mendoza',
        Last_Name: 'Garcia',
        Birthdate: '1990-11-10',
        // Age: 35,
        Gender: 'Male',
        Civil_Status: 'Single',
        Occupation: 'Electrician',
        Income_Estimate: 18000.0,
        Email: 'pedro.garcia@example.com',
        Mobile_Number: '09171234569',
        Voter_Status: 'Registered',
        Date_Arrival: '2015-03-20',
        Residency_Status: 'Active',
        Profile_Photo_URL: 'https://i.pravatar.cc/150?img=5',
        QR_Hash_String: 'QR-RES-2025-005',
      },
    ]);
    console.log('   -> Residents seeded.');

    // Update Household Heads
    await trx('households')
      .where('Household_ID', 'H-2025-001')
      .update({ Head_Resident_ID: 'RES-2025-001' });
    await trx('households')
      .where('Household_ID', 'H-2025-002')
      .update({ Head_Resident_ID: 'RES-2025-005' });

    // 2.4 Vulnerabilities
    await trx('vulnerabilities').insert([
      { Resident_ID: 'RES-2025-001', Is_4Ps: true },
      { Resident_ID: 'RES-2025-002', Is_4Ps: false },
      { Resident_ID: 'RES-2025-005', Is_4Ps: false },
    ]);
    console.log('   -> Vulnerabilities seeded.');

    // 2.5 Certificate Types
    const certTypesCount = await trx('certificate_types').count('id as count').first();
    if (certTypesCount.count == 0) {
      await trx('certificate_types').insert([
        {
          name: 'Barangay Clearance',
          fee: 50.0,
          validity_days: 365,
          description: 'Proves you have no issue or file complaint',
          purpose: 'Certify a person is law-abiding resident',
          when_needed: 'Apply for other clearances / job',
          required_data: JSON.stringify(['Valid ID', 'Purpose', 'Payment']),
        },
        {
          name: 'Barangay Residency',
          fee: 30.0,
          validity_days: 180,
          description: "Certifies an individual's residence",
          purpose: 'Confirms residency',
          when_needed: 'ID Application',
          required_data: JSON.stringify(['Valid ID', 'Address']),
        },
      ]);
      console.log('   -> Certificate Types seeded.');
    }

    await trx.raw('SET FOREIGN_KEY_CHECKS = 1');
    await trx.commit();
    console.log('✨ SYSTEM RESET & REPOPULATION SUCCESSFUL!');
  } catch (error) {
    await trx.rollback();
    console.error('❌ Reset Failed. Rolled back changes.');
    console.error(error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

atomicSystemReset();
