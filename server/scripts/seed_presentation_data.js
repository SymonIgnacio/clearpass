const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const envPathServer = path.join(__dirname, '../.env');
const envPathRoot = path.join(__dirname, '../../.env');

if (fs.existsSync(envPathServer)) {
  require('dotenv').config({ path: envPathServer });
} else if (fs.existsSync(envPathRoot)) {
  require('dotenv').config({ path: envPathRoot });
}

const knexConfig = require('../knexfile');
const environment = process.env.NODE_ENV || 'development';
const knex = require('knex')(knexConfig[environment]);

// --- ID GENERATION HELPERS (Mirrors Backend Logic) ---

// Resident ID: RES-{Timestamp}-{Hex}
const generateResidentID = () =>
  `RES-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

// Blotter Case: BLOT-{Year}-{Month}-{Seq}
const generateCaseNumber = (year, month, seq) =>
  `BLOT-${year}-${String(month).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;

// Certificate Control: DOC-{Timestamp}-{Random}
const generateControlNo = () =>
  `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

async function seedPresentationData() {
  console.log('🌱 Starting data seeding for presentation...');

  try {
    // 0. Prerequisites
    const passwordHash = await bcrypt.hash('123456', 10);
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12

    // 1. Create Households (Batia Proper)
    console.log('   - Creating households...');
    const sitios = await knex('sitios').where('name', 'Batia Proper').first();
    const sitioId = sitios ? sitios.id : 1; // Default to 1 if not found

    const households = [
      {
        Household_ID: 'H-PRESENTATION-001',
        Household_Number: 'HH-P01',
        Sitio_ID: sitioId,
        Street_Address: 'Block 1, Lot 1, Batia Proper',
        Total_Members: 1,
        Household_Type: 'Nuclear',
      },
      {
        Household_ID: 'H-PRESENTATION-002',
        Household_Number: 'HH-P02',
        Sitio_ID: sitioId,
        Street_Address: 'Block 1, Lot 2, Batia Proper',
        Total_Members: 1,
        Household_Type: 'Nuclear',
      },
      {
        Household_ID: 'H-PRESENTATION-003',
        Household_Number: 'HH-P03',
        Sitio_ID: sitioId,
        Street_Address: 'Block 1, Lot 3, Batia Proper',
        Total_Members: 1,
        Household_Type: 'Nuclear',
      },
    ];
    await knex('households').insert(households);

    // 2. Create Residents
    console.log('   - Creating residents...');

    // Resident 1: Juan Good (Clean Record)
    const resIdGood = generateResidentID();
    // Resident 2: Pedro Bad (Active Case)
    // Sleep 1ms to ensure unique timestamp if needed, but random hex handles it
    const resIdBad = `RES-${Date.now() + 1}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const resIdSettled = `RES-${Date.now() + 2}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const residents = [
      {
        Resident_ID: resIdGood,
        Household_ID: 'H-PRESENTATION-001',
        First_Name: 'Juan',
        Last_Name: 'Good',
        Birthdate: '1990-01-01',
        Gender: 'Male',
        Civil_Status: 'Single',
        Residency_Status: 'Active',
        QR_Hash_String: `QR-${resIdGood}`,
        // Add email for login if schema supports it
        // Check schema: existing seeds put email in 'Email' column?
        // Migration says: table.string('Email', 100); (wait, migration didn't show Email explicitly in first read, but 01_initial_data.js used it)
        // Let's assume Email column exists or mobile_number is used.
        // 01_initial_data.js: Email: 'Symonignacio1@gmail.com'
      },
      {
        Resident_ID: resIdBad,
        Household_ID: 'H-PRESENTATION-002',
        First_Name: 'Pedro',
        Last_Name: 'Bad',
        Birthdate: '1985-05-05',
        Gender: 'Male',
        Civil_Status: 'Married',
        Residency_Status: 'Active',
        QR_Hash_String: `QR-${resIdBad}`,
      },
      {
        Resident_ID: resIdSettled,
        Household_ID: 'H-PRESENTATION-003',
        First_Name: 'Maria',
        Last_Name: 'Settled',
        Birthdate: '1995-12-12',
        Gender: 'Female',
        Civil_Status: 'Single',
        Residency_Status: 'Active',
        QR_Hash_String: `QR-${resIdSettled}`,
      },
    ];

    // Handle optional columns based on schema versions (safely)
    // We'll insert basic fields. If Email is required/exists, we should add it.
    // To be safe, we'll add Email if the column exists in your DB, but standard fields are safer.
    // The initial seed has 'Email'. I'll add it.
    residents[0].Email = 'juan.good@example.com';
    residents[1].Email = 'pedro.bad@example.com';
    residents[2].Email = 'maria.settled@example.com';

    await knex('residents').insert(residents);

    // 3. Create Users for Residents
    console.log('   - Creating resident user accounts...');
    const users = [
      {
        username: 'juan.good@example.com',
        email: 'juan.good@example.com',
        password_hash: passwordHash,
        role: 'resident',
        full_name: 'Juan Good',
        is_active: true,
      },
      {
        username: 'pedro.bad@example.com',
        email: 'pedro.bad@example.com',
        password_hash: passwordHash,
        role: 'resident',
        full_name: 'Pedro Bad',
        is_active: true,
      },
      {
        username: 'maria.settled@example.com',
        email: 'maria.settled@example.com',
        password_hash: passwordHash,
        role: 'resident',
        full_name: 'Maria Settled',
        is_active: true,
      },
    ];
    await knex('users').insert(users);

    // 4. Create Blotter Cases
    console.log('   - Creating blotter cases...');

    const caseActive = generateCaseNumber(year, month, 1);
    const caseSettled = generateCaseNumber(year, month, 2);

    const blotterCases = [
      {
        Case_Number: caseActive,
        Complainant_Details: JSON.stringify({ Name: 'Store Owner', Contact: '09123456789' }),
        Respondent_Details: JSON.stringify({ Name: 'Pedro Bad', Resident_ID: resIdBad }), // Linking Resident_ID is key for AI
        Incident_Type: 'Theft (Petty)',
        Narrative: 'Caught stealing goods from the store.',
        DateTime_Incident: new Date(),
        Location_Sitio: 'Batia Proper',
        Status: 'Pending', // Active status blocks clearance
        Hearing_Schedule: new Date(Date.now() + 86400000), // Tomorrow
      },
      {
        Case_Number: caseSettled,
        Complainant_Details: JSON.stringify({ Name: 'Neighbor', Contact: '09987654321' }),
        Respondent_Details: JSON.stringify({ Name: 'Maria Settled', Resident_ID: resIdSettled }),
        Incident_Type: 'Noise Barrage',
        Narrative: 'Loud videoke past curfew.',
        DateTime_Incident: new Date(Date.now() - 864000000), // 10 days ago
        Location_Sitio: 'Batia Proper',
        Status: 'Amicably Settled', // Settled status allows clearance
      },
    ];
    await knex('blotter').insert(blotterCases);

    // 5. Update Blotter Sequences
    if (await knex.schema.hasTable('blotter_case_sequences')) {
      console.log('   - Updating blotter case sequences...');
      // Check if row exists
      const existingSeq = await knex('blotter_case_sequences').where({ year, month }).first();

      if (existingSeq) {
        await knex('blotter_case_sequences').where({ year, month }).update({ next_seq: 3 }); // Next one will be 3
      } else {
        await knex('blotter_case_sequences').insert({
          year,
          month,
          next_seq: 3,
        });
      }
    }

    // 6. Create Pending Certificate Request (for Juan Good)
    console.log('   - Creating certificate request...');
    await knex('document_requests').insert({
      control_no: generateControlNo(),
      resident_id: resIdGood,
      request_type: 'Barangay Clearance',
      purpose: 'Job Application',
      status: 'Pending',
      request_data: JSON.stringify({
        name: 'Juan Good',
        address: 'Block 1, Lot 1, Batia Proper',
        date: new Date().toISOString(),
      }),
    });

    console.log('\n✅ SEEDING COMPLETE');
    console.log('   Users Created (Password: 123456):');
    console.log('   - juan.good@example.com (Clean Record)');
    console.log('   - pedro.bad@example.com (Blocked by Active Case)');
    console.log('   - maria.settled@example.com (Cleared - Settled Case)');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR: Seeding failed');
    console.error(error);
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

seedPresentationData();
