const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  // Clear existing data (in reverse order of dependencies)
  await knex('audit_log').del();
  await knex('users').del();
  await knex('officials').del();
  await knex('certificates_log').del();
  await knex('certificate_types').del();
  await knex('blotter').del();
  await knex('vulnerabilities').del();
  await knex('residents').del();
  await knex('households').del();
  await knex('sitios').del();
  await knex('tanod_patrol_schedule').del();
  await knex('community_programs').del();

  // ==========================================
  // 8. MOCK DATA INSERTION
  // ==========================================

  // Sitios Data
  await knex('sitios').insert([
    { name: 'Batia Proper', description: 'Main residential and commercial area, population ~2,500' },
    { name: 'Northville 5', description: 'Northern residential district with growing community' },
    { name: 'St. Martha', description: 'Eastern residential area with mixed housing types' },
    { name: 'AFP/PNP', description: 'Military and police housing compound' }
  ]);

  // Officials Data
  await knex('officials').insert([
    {
      name: 'Juan Dela Cruz',
      position: 'Captain',
      role_access_level: 'Full',
      contact_number: '09123456789',
      email: 'captain@barangay-batia.gov.ph'
    },
    {
      name: 'Maria Santos',
      position: 'Secretary',
      role_access_level: 'Full',
      contact_number: '09123456790',
      email: 'secretary@barangay-batia.gov.ph'
    },
    {
      name: 'Pedro Reyes',
      position: 'Clerk',
      role_access_level: 'Limited',
      contact_number: '09123456791',
      email: 'clerk@barangay-batia.gov.ph'
    }
  ]);

  // Hash passwords for users
  const saltRounds = 10;
  const captainHash = await bcrypt.hash('captain', saltRounds);
  const secretaryHash = await bcrypt.hash('secretary', saltRounds);
  const clerkHash = await bcrypt.hash('clerk', saltRounds);

  // Users Data
  await knex('users').insert([
    {
      username: 'captain',
      password_hash: captainHash,
      role: 'captain',
      email: 'captain@barangay-batia.gov.ph',
      full_name: 'Juan Dela Cruz',
      official_id: 1
    },
    {
      username: 'secretary',
      password_hash: secretaryHash,
      role: 'secretary',
      email: 'secretary@barangay-batia.gov.ph',
      full_name: 'Maria Santos',
      official_id: 2
    },
    {
      username: 'clerk',
      password_hash: clerkHash,
      role: 'clerk',
      email: 'clerk@barangay-batia.gov.ph',
      full_name: 'Pedro Reyes',
      official_id: 3
    }
  ]);

  // Households Data
  await knex('households').insert([
    {
      Household_ID: 'H-2025-001',
      Household_Number: 'HH-001',
      Sitio_ID: 1,
      Street_Address: 'Block 1, Lot 1, Batia Proper',
      Total_Members: 4,
      Household_Type: 'Nuclear'
    },
    {
      Household_ID: 'H-2025-002',
      Household_Number: 'HH-002',
      Sitio_ID: 1,
      Street_Address: 'Block 1, Lot 2, Batia Proper',
      Total_Members: 3,
      Household_Type: 'Nuclear'
    },
    {
      Household_ID: 'H-2025-003',
      Household_Number: 'HH-003',
      Sitio_ID: 1,
      Street_Address: 'Block 1, Lot 3, Batia Proper',
      Total_Members: 2,
      Household_Type: 'Nuclear'
    },
    {
      Household_ID: 'H-2025-004',
      Household_Number: 'HH-004',
      Sitio_ID: 1,
      Street_Address: 'Block 2, Lot 1, Batia Proper',
      Total_Members: 5,
      Household_Type: 'Extended'
    },
    {
      Household_ID: 'H-2025-005',
      Household_Number: 'HH-005',
      Sitio_ID: 1,
      Street_Address: 'Block 2, Lot 2, Batia Proper',
      Total_Members: 1,
      Household_Type: 'Single'
    }
  ]);

  // Hash password for hardcoded resident user
  const hardcodedPasswordHash = await bcrypt.hash('123456', saltRounds);

  // Users Data (Add hardcoded resident user)
  await knex('users').insert([
    {
      username: 'Symonignacio1@gmail.com',
      password_hash: hardcodedPasswordHash,
      role: 'resident',
      email: 'Symonignacio1@gmail.com',
      full_name: 'Symon Ignacio',
      contact_number: '09625460372',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    // ... existing users
  ]);

  // Residents Data (Sample - first 10 residents)
  await knex('residents').insert([
    {
      Resident_ID: 'RES-HARDCODED-001',
      Household_ID: 'H-2025-001', // Assign to first household
      Relation_to_Head: 'Boarder',
      First_Name: 'Symon',
      Middle_Name: 'Balilla',
      Last_Name: 'Ignacio',
      Birthdate: '2004-07-01',
      Age: 21,
      Gender: 'Male',
      Civil_Status: 'Single',
      Occupation: 'Student',
      Income_Estimate: 0.00,
      Email: 'Symonignacio1@gmail.com',
      Mobile_Number: '09625460372',
      Voter_Status: 'Non-Registered',
      Date_Arrival: '2025-12-19',
      Residency_Status: 'Active',
      Profile_Photo_URL: 'https://i.pravatar.cc/150?img=10',
      QR_Hash_String: 'QR-RES-HARDCODED-001'
    },
    {
      Resident_ID: 'RES-2025-001',
      Household_ID: 'H-2025-001',
      Relation_to_Head: 'Head',
      First_Name: 'Juan',
      Middle_Name: 'Garcia',
      Last_Name: 'Dela Cruz',
      Birthdate: '1985-03-15',
      Age: 40,
      Gender: 'Male',
      Civil_Status: 'Married',
      Occupation: 'Construction Worker',
      Income_Estimate: 15000.00,
      Mobile_Number: '09171234567',
      Voter_Status: 'Registered',
      Date_Arrival: '2010-01-15',
      Residency_Status: 'Active',
      Profile_Photo_URL: 'https://i.pravatar.cc/150?img=1',
      QR_Hash_String: 'QR-RES-2025-001'
    },
    {
      Resident_ID: 'RES-2025-002',
      Household_ID: 'H-2025-001',
      Relation_to_Head: 'Spouse',
      First_Name: 'Maria',
      Middle_Name: 'Reyes',
      Last_Name: 'Dela Cruz',
      Birthdate: '1987-08-22',
      Age: 38,
      Gender: 'Female',
      Civil_Status: 'Married',
      Occupation: 'Teacher',
      Income_Estimate: 25000.00,
      Mobile_Number: '09171234568',
      Voter_Status: 'Registered',
      Date_Arrival: '2010-01-15',
      Residency_Status: 'Active',
      Profile_Photo_URL: 'https://i.pravatar.cc/150?img=2',
      QR_Hash_String: 'QR-RES-2025-002'
    },
    {
      Resident_ID: 'RES-2025-003',
      Household_ID: 'H-2025-001',
      Relation_to_Head: 'Child',
      First_Name: 'Jose',
      Last_Name: 'Dela Cruz',
      Birthdate: '2010-05-10',
      Age: 15,
      Gender: 'Male',
      Civil_Status: 'Single',
      Occupation: 'Student',
      Income_Estimate: 0.00,
      Voter_Status: 'Non-Registered',
      Date_Arrival: '2010-05-10',
      Residency_Status: 'Active',
      Profile_Photo_URL: 'https://i.pravatar.cc/150?img=3',
      QR_Hash_String: 'QR-RES-2025-003'
    },
    {
      Resident_ID: 'RES-2025-004',
      Household_ID: 'H-2025-001',
      Relation_to_Head: 'Child',
      First_Name: 'Anna',
      Last_Name: 'Dela Cruz',
      Birthdate: '2012-12-03',
      Age: 13,
      Gender: 'Female',
      Civil_Status: 'Single',
      Occupation: 'Student',
      Income_Estimate: 0.00,
      Voter_Status: 'Non-Registered',
      Date_Arrival: '2012-12-03',
      Residency_Status: 'Active',
      Profile_Photo_URL: 'https://i.pravatar.cc/150?img=4',
      QR_Hash_String: 'QR-RES-2025-004'
    },
    {
      Resident_ID: 'RES-2025-005',
      Household_ID: 'H-2025-002',
      Relation_to_Head: 'Head',
      First_Name: 'Pedro',
      Middle_Name: 'Mendoza',
      Last_Name: 'Garcia',
      Birthdate: '1990-11-10',
      Age: 35,
      Gender: 'Male',
      Civil_Status: 'Single',
      Occupation: 'Electrician',
      Income_Estimate: 18000.00,
      Mobile_Number: '09171234569',
      Voter_Status: 'Registered',
      Date_Arrival: '2015-03-20',
      Residency_Status: 'Active',
      Profile_Photo_URL: 'https://i.pravatar.cc/150?img=5',
      QR_Hash_String: 'QR-RES-2025-005'
    }
  ]);

  // Update household head references
  await knex('households').where('Household_ID', 'H-2025-001').update({ Head_Resident_ID: 'RES-2025-001' });
  await knex('households').where('Household_ID', 'H-2025-002').update({ Head_Resident_ID: 'RES-2025-005' });

  // Vulnerabilities Data
  await knex('vulnerabilities').insert([
    { Resident_ID: 'RES-2025-001', Is_4Ps: true },
    { Resident_ID: 'RES-2025-002', Is_4Ps: false },
    { Resident_ID: 'RES-2025-005', Is_4Ps: false }
  ]);

  // Certificate Types
  await knex('certificate_types').insert([
    {
      name: 'Barangay Clearance',
      fee: 50.00,
      validity_days: 365,
      description: 'Proves you have no issue or file complaint',
      purpose: 'Certify a person is law-abiding resident',
      when_needed: 'Apply for other clearances / job',
      required_data: JSON.stringify([
        'Valid ID',
        'Proof of Residency',
        'CEDULA',
        'Purpose',
        'Payment',
        'Personal Information (Name, Date of Birth, Address, Contact Number, Length of stay in barangay)',
        'Signature of Barangay Captain and Secretary'
      ])
    },
    {
      name: 'Barangay Residency',
      fee: 30.00,
      validity_days: 180,
      description: 'Certifies an individual\'s residence within the barangay',
      purpose: 'Confirms that an individual is a resident of the barangay.',
      when_needed: 'Applying for government ID, Business permit, License',
      required_data: JSON.stringify([
        'Full name of the resident.',
        'Address within the barangay.',
        'Period of residency (start date and up to present).',
        'Purpose for which the certificate is issued.',
        'Date of issuance and signature of the Barangay Captain and Secretary',
        'Barangay seal and control number.'
      ])
    }
  ]);

  // Sample Certificates
  await knex('certificates_log').insert([
    {
      control_no: 'CERT-2024-001',
      resident_id: 'RES-2025-001',
      certificate_type: 'Barangay Clearance',
      purpose: 'Job Application at ABC Corporation',
      date_issued: '2024-11-25',
      signatory_captain: 'Captain Juan Dela Cruz',
      signatory_secretary: 'Secretary Maria Santos',
      qr_validation_string: 'QR-CERT-2024-001-ABC123',
      status: 'Released',
      fee_amount: 50.00
    }
  ]);

  console.log('✅ Initial seed data inserted successfully');
};
