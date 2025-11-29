const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'barangay_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Function to generate random date within last year
function randomDate() {
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  const end = new Date();
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime).toISOString().split('T')[0];
}

// Mock data
const residentData = [
  // Batia Proper residents
  ['Juan', 'Dela Cruz', 'Garcia', 45, 'Male', 1, 0, 0, 0, 'Construction Worker', 15000.00, '09123456789', 'Block 5, Lot 12', 'BARANGAY-ID-1-A1B2C3D4'],
  ['Maria', 'Santos', 'Reyes', 32, 'Female', 1, 0, 0, 0, 'Teacher', 25000.00, '09123456790', 'Block 3, Lot 8', 'BARANGAY-ID-2-E5F6G7H8'],
  ['Pedro', 'Garcia', 'Mendoza', 68, 'Male', 1, 1, 0, 0, 'Retired', 5000.00, '09123456791', 'Block 7, Lot 15', 'BARANGAY-ID-3-I9J0K1L2'],
  ['Ana', 'Rodriguez', 'Santos', 28, 'Female', 1, 0, 1, 1, 'Unemployed', 0.00, '09123456792', 'Block 2, Lot 5', 'BARANGAY-ID-4-M3N4O5P6'],
  ['Carlos', 'Martinez', 'Luna', 35, 'Male', 1, 0, 0, 0, 'Security Guard', 12000.00, '09123456793', 'Block 9, Lot 20', 'BARANGAY-ID-5-Q7R8S9T0'],
  ['Elena', 'Gonzales', 'Torres', 55, 'Female', 1, 1, 0, 0, 'Nurse', 18000.00, '09123456794', 'Block 4, Lot 10', 'BARANGAY-ID-6-U1V2W3X4'],
  ['Roberto', 'Fernandez', 'Cruz', 42, 'Male', 1, 0, 0, 0, 'Driver', 14000.00, '09123456795', 'Block 6, Lot 14', 'BARANGAY-ID-7-Y5Z6A7B8'],
  ['Carmen', 'Lopez', 'Reyes', 29, 'Female', 1, 0, 0, 1, 'Sales Clerk', 11000.00, '09123456796', 'Block 1, Lot 3', 'BARANGAY-ID-8-C9D0E1F2'],
  ['Miguel', 'Hernandez', 'Santos', 72, 'Male', 1, 1, 0, 0, 'Retired Teacher', 8000.00, '09123456797', 'Block 8, Lot 18', 'BARANGAY-ID-9-G3H4I5J6'],
  ['Isabel', 'Morales', 'Garcia', 31, 'Female', 1, 0, 1, 0, 'House Helper', 9000.00, '09123456798', 'Block 5, Lot 11', 'BARANGAY-ID-10-K7L8M9N0'],

  // Northville 5 residents
  ['Antonio', 'Villanueva', 'Cruz', 38, 'Male', 2, 0, 0, 0, 'Electrician', 16000.00, '09123456799', 'Phase 1, Block A', 'BARANGAY-ID-11-O1P2Q3R4'],
  ['Rosa', 'Aquino', 'Torres', 65, 'Female', 2, 1, 0, 0, 'Retired', 6000.00, '09123456800', 'Phase 2, Block B', 'BARANGAY-ID-12-S5T6U7V8'],
  ['Jose', 'Ramos', 'Luna', 51, 'Male', 2, 0, 0, 0, 'Mechanic', 17000.00, '09123456801', 'Phase 1, Block C', 'BARANGAY-ID-13-W9X0Y1Z2'],
  ['Teresa', 'Castillo', 'Reyes', 27, 'Female', 2, 0, 0, 1, 'Call Center Agent', 13000.00, '09123456802', 'Phase 3, Block A', 'BARANGAY-ID-14-A3B4C5D6'],
  ['Francisco', 'Bautista', 'Garcia', 44, 'Male', 2, 0, 0, 0, 'Carpenter', 14500.00, '09123456803', 'Phase 2, Block C', 'BARANGAY-ID-15-E7F8G9H0'],
  ['Lourdes', 'Alvarez', 'Santos', 59, 'Female', 2, 1, 0, 0, 'Housewife', 0.00, '09123456804', 'Phase 1, Block B', 'BARANGAY-ID-16-I1J2K3L4'],
  ['Ricardo', 'Mendoza', 'Torres', 33, 'Male', 2, 0, 0, 0, 'IT Specialist', 22000.00, '09123456805', 'Phase 3, Block B', 'BARANGAY-ID-17-M5N6O7P8'],
  ['Victoria', 'De Leon', 'Luna', 26, 'Female', 2, 0, 1, 0, 'Waitress', 9500.00, '09123456806', 'Phase 2, Block A', 'BARANGAY-ID-18-Q9R0S1T2'],

  // St. Martha residents
  ['Alberto', 'Navarro', 'Cruz', 47, 'Male', 3, 0, 0, 0, 'Plumber', 15500.00, '09123456807', 'Villa Maria, Lot 25', 'BARANGAY-ID-19-U3V4W5X6'],
  ['Cristina', 'Pascual', 'Reyes', 62, 'Female', 3, 1, 0, 0, 'Retired Nurse', 7000.00, '09123456808', 'Villa Fatima, Lot 12', 'BARANGAY-ID-20-Y7Z8A9B0'],
  ['Daniel', 'Rivera', 'Garcia', 36, 'Male', 3, 0, 0, 1, 'OFW', 30000.00, '09123456809', 'Villa Lourdes, Lot 8', 'BARANGAY-ID-21-C1D2E3F4'],
  ['Gloria', 'Salazar', 'Torres', 41, 'Female', 3, 0, 1, 0, 'Social Worker', 19000.00, '09123456810', 'Villa Teresa, Lot 15', 'BARANGAY-ID-22-G5H6I7J8'],
  ['Hector', 'Vega', 'Luna', 54, 'Male', 3, 0, 0, 0, 'Farmer', 12000.00, '09123456811', 'Villa Rosario, Lot 22', 'BARANGAY-ID-23-K9L0M1N2'],
  ['Irene', 'Zamora', 'Santos', 30, 'Female', 3, 0, 0, 0, 'Bank Teller', 16500.00, '09123456812', 'Villa Carmen, Lot 5', 'BARANGAY-ID-24-O3P4Q5R6'],

  // AFP/PNP residents
  ['Leonardo', 'Abad', 'Cruz', 39, 'Male', 4, 0, 0, 0, 'Military Officer', 25000.00, '09123456813', 'Camp Area, Barracks A', 'BARANGAY-ID-25-S7T8U9V0'],
  ['Marina', 'Bello', 'Reyes', 37, 'Female', 4, 0, 0, 0, 'Police Officer', 23000.00, '09123456814', 'Station Area, Unit 3', 'BARANGAY-ID-26-W1X2Y3Z4'],
  ['Nicolas', 'Castro', 'Garcia', 43, 'Male', 4, 0, 0, 0, 'Sergeant', 20000.00, '09123456815', 'Camp Area, Barracks B', 'BARANGAY-ID-27-A5B6C7D8'],
  ['Olivia', 'Delgado', 'Torres', 35, 'Female', 4, 0, 0, 0, 'Military Nurse', 21000.00, '09123456816', 'Medical Center, Ward 2', 'BARANGAY-ID-28-E9F0G1H2'],
  ['Patrick', 'Estrada', 'Luna', 48, 'Male', 4, 0, 0, 0, 'Police Inspector', 28000.00, '09123456817', 'Station Area, Office 5', 'BARANGAY-ID-29-I3J4K5L6'],
  ['Queenie', 'Flores', 'Santos', 32, 'Female', 4, 0, 0, 1, 'Administrative Officer', 17500.00, '09123456818', 'Admin Building, Room 101', 'BARANGAY-ID-30-M7N8O9P0'],
];

const blotterData = [
  ['Barangay Official', null, 'Noise Complaint', 'Excessive construction noise after hours', 1, 'Block 5, Lot 12', 'Pending', 'Low'],
  ['Maria Santos', 2, 'Domestic Dispute', 'Neighbor dispute over property line', 1, 'Block 3, Lot 8', 'Under Investigation', 'Medium'],
  ['Pedro Garcia', 3, 'Medical Emergency', 'Senior citizen fell and injured', 2, 'Phase 2, Block B', 'Resolved', 'High'],
  ['Barangay Official', null, 'Illegal Parking', 'Vehicles blocking the main road', 1, 'Main Street', 'Resolved', 'Low'],
  ['Ana Rodriguez', 4, 'Theft Report', 'Personal belongings stolen from residence', 1, 'Block 2, Lot 5', 'Under Investigation', 'High'],
  ['Carlos Martinez', 5, 'Physical Injury', 'Assault incident at local store', 1, 'Block 9, Lot 20', 'Pending', 'Critical'],
  ['Elena Gonzales', 6, 'Noise Violation', 'Loud party disturbing neighbors', 1, 'Block 4, Lot 10', 'Resolved', 'Medium'],
  ['Roberto Fernandez', 7, 'Traffic Accident', 'Minor collision between motorcycles', 1, 'Block 6, Lot 14', 'Resolved', 'Medium'],
  ['Carmen Lopez', 8, 'Lost and Found', 'Missing wallet reported', 1, 'Block 1, Lot 3', 'Pending', 'Low'],
  ['Miguel Hernandez', 9, 'Health Concern', 'Senior citizen needs medical assistance', 1, 'Block 8, Lot 18', 'Resolved', 'High'],
  ['Isabel Morales', 10, 'Property Damage', 'Fence damaged by stray animals', 1, 'Block 5, Lot 11', 'Under Investigation', 'Low'],
  ['Antonio Villanueva', 11, 'Electrical Hazard', 'Exposed wiring in public area', 2, 'Phase 1, Block A', 'Resolved', 'High'],
  ['Rosa Aquino', 12, 'Assistance Request', 'Senior needs help with groceries', 2, 'Phase 2, Block B', 'Resolved', 'Low'],
  ['Jose Ramos', 13, 'Vehicle Theft', 'Motorcycle stolen from garage', 2, 'Phase 1, Block C', 'Under Investigation', 'Critical'],
  ['Teresa Castillo', 14, 'Harassment Complaint', 'Unwanted attention from neighbor', 2, 'Phase 3, Block A', 'Pending', 'Medium'],
  ['Francisco Bautista', 15, 'Fire Hazard', 'Accumulated trash near electrical post', 2, 'Phase 2, Block C', 'Resolved', 'High'],
  ['Lourdes Alvarez', 16, 'Medical Assistance', 'Senior citizen needs regular checkup', 2, 'Phase 1, Block B', 'Resolved', 'Low'],
  ['Ricardo Mendoza', 17, 'Noise Disturbance', 'Construction work on weekend', 2, 'Phase 3, Block B', 'Pending', 'Medium'],
  ['Victoria De Leon', 18, 'Theft', 'Mobile phone stolen', 2, 'Phase 2, Block A', 'Under Investigation', 'High'],
  ['Alberto Navarro', 19, 'Water Leakage', 'Burst pipe in public area', 3, 'Villa Maria, Lot 25', 'Resolved', 'Medium'],
  ['Cristina Pascual', 20, 'Health Emergency', 'Senior citizen chest pain', 3, 'Villa Fatima, Lot 12', 'Resolved', 'Critical'],
  ['Daniel Rivera', 21, 'Property Dispute', 'Boundary disagreement', 3, 'Villa Lourdes, Lot 8', 'Under Investigation', 'Low'],
  ['Gloria Salazar', 22, 'Animal Control', 'Stray dogs causing disturbance', 3, 'Villa Teresa, Lot 15', 'Pending', 'Medium'],
  ['Hector Vega', 23, 'Infrastructure', 'Damaged street light', 3, 'Villa Rosario, Lot 22', 'Resolved', 'Low'],
  ['Irene Zamora', 24, 'Assault Report', 'Physical altercation', 3, 'Villa Carmen, Lot 5', 'Under Investigation', 'Critical'],
];

const certificateData = [
  ['CERT-001', 1, 'Barangay Clearance', 'Employment purpose'],
  ['CERT-002', 2, 'Certificate of Residency', 'School enrollment'],
  ['CERT-003', 3, 'Certificate of Indigency', 'Medical assistance application'],
  ['CERT-004', 4, 'Certificate of Indigency', 'Financial aid application'],
  ['CERT-005', 5, 'Barangay Clearance', 'Business permit application'],
  ['CERT-006', 6, 'Certificate of Residency', 'Bank account opening'],
  ['CERT-007', 7, 'Barangay Clearance', 'Job application'],
  ['CERT-008', 8, 'Certificate of Indigency', 'Scholarship application'],
  ['CERT-009', 9, 'Certificate of Residency', 'Government ID application'],
  ['CERT-010', 10, 'Barangay Clearance', 'Loan application'],
  ['CERT-011', 11, 'Certificate of Residency', 'Insurance application'],
  ['CERT-012', 12, 'Certificate of Indigency', 'Medical assistance'],
  ['CERT-013', 13, 'Barangay Clearance', 'Vehicle registration'],
  ['CERT-014', 14, 'Certificate of Residency', 'Passport application'],
  ['CERT-015', 15, 'Barangay Clearance', 'Real estate transaction'],
  ['CERT-016', 16, 'Certificate of Indigency', 'Housing assistance'],
  ['CERT-017', 17, 'Certificate of Residency', 'School records'],
  ['CERT-018', 18, 'Barangay Clearance', 'Business license renewal'],
  ['CERT-019', 19, 'Certificate of Indigency', 'Burial assistance'],
  ['CERT-020', 20, 'Certificate of Residency', 'Marriage license'],
];

const tanodScheduleData = [
  ['Batia Proper - Morning Shift', 1, 2, '6:00 AM - 12:00 PM', 'Scheduled'],
  ['Batia Proper - Afternoon Shift', 1, 2, '12:00 PM - 6:00 PM', 'Active'],
  ['Batia Proper - Night Shift', 1, 3, '6:00 PM - 12:00 AM', 'Scheduled'],
  ['Batia Proper - Midnight Shift', 1, 2, '12:00 AM - 6:00 AM', 'Completed'],
  ['Northville 5 - Morning Shift', 2, 1, '6:00 AM - 12:00 PM', 'Active'],
  ['Northville 5 - Evening Shift', 2, 2, '4:00 PM - 10:00 PM', 'Scheduled'],
  ['St. Martha - Day Shift', 3, 1, '8:00 AM - 4:00 PM', 'Active'],
  ['St. Martha - Night Shift', 3, 2, '8:00 PM - 4:00 AM', 'Scheduled'],
  ['AFP/PNP - Morning Shift', 4, 2, '6:00 AM - 12:00 PM', 'Active'],
  ['AFP/PNP - Afternoon Shift', 4, 2, '12:00 PM - 6:00 PM', 'Scheduled'],
  ['AFP/PNP - Night Shift', 4, 3, '6:00 PM - 12:00 AM', 'Active'],
];

async function insertMockData() {
  let connection;

  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createPool(dbConfig);

    // Insert residents
    console.log('📝 Inserting resident data...');
    for (const resident of residentData) {
      await connection.execute(`
        INSERT INTO residents (
          first_name, last_name, middle_name, age, gender, sitio_id,
          is_senior, is_pwd, is_single_parent, employment_status,
          monthly_income, contact_number, address, qr_code_string
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, resident);
    }
    console.log('✅ Residents inserted');

    // Insert blotter records
    console.log('📋 Inserting blotter data...');
    for (const blotter of blotterData) {
      const dateFiled = randomDate();
      await connection.execute(`
        INSERT INTO blotter (
          complainant_name, respondent_id, incident_type, description,
          sitio_id, location, status, severity, date_filed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [...blotter.slice(0, 7), blotter[7], dateFiled]);
    }
    console.log('✅ Blotter records inserted');

    // Insert certificates
    console.log('📄 Inserting certificate data...');
    for (const cert of certificateData) {
      const issuedDate = randomDate();
      await connection.execute(`
        INSERT INTO certificates (
          certificate_number, resident_id, certificate_type, purpose, status, issued_date
        ) VALUES (?, ?, ?, ?, 'Approved', ?)
      `, [...cert, issuedDate]);
    }
    console.log('✅ Certificates inserted');

    // Insert tanod schedules
    console.log('👮 Inserting tanod schedule data...');
    for (const schedule of tanodScheduleData) {
      const shiftDate = randomDate();
      await connection.execute(`
        INSERT INTO tanod_schedule (
          patrol_area, sitio_id, number_of_tanods, shift_time, shift_date, status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [...schedule.slice(0, 4), shiftDate, schedule[4]]);
    }
    console.log('✅ Tanod schedules inserted');

    // Update some blotter records with resolutions
    console.log('🔄 Updating blotter records with resolutions...');
    const updateQueries = [
      "UPDATE blotter SET status = 'Resolved', resolution = 'Noise violation resolved through mediation', resolved_date = CURDATE() WHERE complainant_name = 'Barangay Official' AND incident_type = 'Noise Complaint'",
      "UPDATE blotter SET status = 'Resolved', resolution = 'Medical assistance provided', resolved_date = CURDATE() WHERE respondent_id = 3",
      "UPDATE blotter SET status = 'Resolved', resolution = 'Parking issue resolved', resolved_date = CURDATE() WHERE incident_type = 'Illegal Parking'",
      "UPDATE blotter SET status = 'Resolved', resolution = 'Medical checkup scheduled', resolved_date = CURDATE() WHERE respondent_id = 9",
      "UPDATE blotter SET status = 'Resolved', resolution = 'Property repaired', resolved_date = CURDATE() WHERE respondent_id = 11",
    ];

    for (const query of updateQueries) {
      await connection.execute(query);
    }
    console.log('✅ Blotter records updated');

    // Insert certificate types
    console.log('🏷️ Adding certificate types...');
    const certificateTypes = [
      ['Certificate of Good Moral Character', 'Character reference for various purposes', 50.00, 365],
      ['Certificate of No Criminal Record', 'Criminal background check', 75.00, 180],
      ['Certificate of Employment', 'Employment verification', 25.00, 365],
      ['Certificate of Death', 'Death record verification', 100.00, 0],
      ['Certificate of Birth', 'Birth record verification', 50.00, 0],
      ['Certificate of Marriage', 'Marriage record verification', 75.00, 0],
      ['Business Permit', 'Local business authorization', 200.00, 365],
      ['Certificate of Compliance', 'Regulatory compliance verification', 150.00, 365],
    ];

    for (const type of certificateTypes) {
      await connection.execute(`
        INSERT INTO certificate_types (name, description, fee, validity_days)
        VALUES (?, ?, ?, ?)
      `, type);
    }
    console.log('✅ Certificate types added');

    // Insert community events/programs
    console.log('📅 Inserting community events data...');
    const eventsData = [
      ['Relief Distribution', 'Distribution of relief goods for low-income families', '2024-12-01', 1, 'Planned', 'Barangay Captain', 15000.00, 'Christmas relief program for vulnerable residents'],
      ['Medical Mission', 'Free health checkup and consultation', '2024-11-20', 2, 'Completed', 'Health Center', 8000.00, 'Blood pressure, blood sugar, and general checkup'],
      ['Tree Planting Activity', 'Environmental awareness and reforestation', '2024-12-10', 3, 'Planned', 'DENR Coordinator', 5000.00, 'Plant 100 trees in barangay park'],
      ['Senior Citizens Day', 'Celebration and appreciation for seniors', '2024-11-25', 1, 'Completed', 'Social Welfare', 12000.00, 'Birthday celebration, gifts, and lunch for seniors'],
      ['Youth Sports Tournament', 'Basketball and volleyball competition', '2025-01-15', 4, 'Planned', 'Youth Council', 25000.00, 'Inter-sitio sports competition'],
      ['Livelihood Workshop', 'Skills training for unemployed residents', '2024-12-05', 2, 'Ongoing', 'TESDA Coordinator', 18000.00, 'Basic computer skills and online selling'],
      ['Barangay Clean-up Drive', 'Community cleaning and beautification', '2024-11-30', 1, 'Completed', 'Barangay Council', 3000.00, 'Weekly clean-up of public areas'],
      ['Feeding Program', 'Nutritional support for malnourished children', '2024-12-15', 3, 'Planned', 'Nutritionist', 10000.00, 'Monthly feeding for 50 children under 5 years old'],
    ];

    for (const event of eventsData) {
      await connection.execute(`
        INSERT INTO programs (
          event_name, description, event_date, sitio_id,
          status, organizer, budget, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, event);
    }
    console.log('✅ Community events inserted');

    // Generate QR codes for certificates
    console.log('🔄 Generating QR codes for certificates...');
    const certificates = await connection.execute('SELECT id FROM certificates');
    for (const cert of certificates[0]) {
      const qrHash = crypto.randomBytes(16).toString('hex').toUpperCase();
      await connection.execute(
        'UPDATE certificates SET qr_validation_hash = ? WHERE id = ?',
        [`CERT-${cert.id}-${qrHash}`, cert.id]
      );
    }
    console.log('✅ QR codes generated for certificates');

    console.log('\n🎉 Mock data insertion completed successfully!');
    console.log('📊 Database now contains:');
    console.log('   - 24+ residents across all sitios (with QR codes)');
    console.log('   - 25+ blotter/incident records');
    console.log('   - 20+ issued certificates (with QR validation)');
    console.log('   - 11+ tanod patrol schedules');
    console.log('   - 8+ certificate types');
    console.log('   - 8+ community events/programs');
    console.log('\n🚀 All sidebar modules should now display comprehensive data!');

  } catch (error) {
    console.error('❌ Error inserting mock data:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
insertMockData();
