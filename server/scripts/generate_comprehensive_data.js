const mysql = require('mysql2/promise');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SITIOS = [
  'Batia Proper',
  'Northville 5',
  'St. Martha',
  'AFP/PNP',
  'Old Site',
  'New Site',
  'Riverside',
  'Hilltop',
];

const INCIDENT_TYPES = [
  'Physical Injury',
  'Theft (Petty)',
  'Boundary Dispute',
  'Grave Threats',
  'Noise Barrage',
  'Unjust Vexation',
  'Malicious Mischief',
  'Estafa (Swindling)',
  'Family Dispute',
];

const STATUSES = [
  'Pending',
  'Active',
  'Resolved',
  'Dismissed',
  'Amicably Settled',
  'Scheduled for Mediation',
];

const FIRST_NAMES = [
  'Juan',
  'Maria',
  'Jose',
  'Anna',
  'Pedro',
  'Rose',
  'Luis',
  'Grace',
  'Ramon',
  'Teresa',
];
const LAST_NAMES = [
  'Santos',
  'Reyes',
  'Cruz',
  'Bautista',
  'Ocampo',
  'Garcia',
  'Mendoza',
  'Torres',
  'Flores',
  'Gonzales',
];

const CERTIFICATE_TYPES = [
  'Barangay Clearance',
  'Certificate of Indigency',
  'Business Permit',
  'Certificate of Residency',
  'First Time Job Seeker',
];

const REQUEST_STATUSES = ['pending', 'approved', 'rejected'];

// Helper to get random element
const random = arr => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random date within last N days
const randomDate = daysAgo => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date;
};

// Helper to pad numbers
const pad2 = n => String(n).padStart(2, '0');
const pad4 = n => String(n).padStart(4, '0');

async function generateData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🚀 Starting Comprehensive Data Generation...');

    // 1. Ensure Sitios
    console.log('📍 Verifying Sitios...');
    for (const name of SITIOS) {
      await connection.execute('INSERT IGNORE INTO sitios (name, description) VALUES (?, ?)', [
        name,
        `Sitio ${name}`,
      ]);
    }
    const [sitioRows] = await connection.execute('SELECT id, name FROM sitios');
    const sitioMap = new Map(sitioRows.map(s => [s.name, s.id]));

    // 2. Generate Households & Residents (if low count)
    const [residentCount] = await connection.execute('SELECT COUNT(*) as c FROM residents');
    if (residentCount[0].c < 50) {
      console.log('👥 Generating Residents...');
      for (let i = 0; i < 50; i++) {
        const sitioName = random(SITIOS);
        const sitioId = sitioMap.get(sitioName);

        // Household
        const [hhResult] = await connection.execute(
          'INSERT INTO households (Household_Number, Sitio_ID, Street_Address) VALUES (?, ?, ?)',
          [`HH-${pad4(i)}`, sitioId, `Block ${random([1, 2, 3])} Lot ${random([1, 2, 3, 4, 5])}`]
        );
        const hhId = hhResult.insertId;

        // Resident
        const firstName = random(FIRST_NAMES);
        const lastName = random(LAST_NAMES);
        const residentId = `RES-${new Date().getFullYear()}-${pad4(i + 1000)}`;

        await connection.execute(
          `
          INSERT INTO residents (
            Resident_ID, First_Name, Last_Name, Middle_Name, 
            Date_of_Birth, Gender, Civil_Status, Citizenship, 
            Household_ID, Residency_Status, Mobile_Number
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            residentId,
            firstName,
            lastName,
            random(['A', 'B', 'C']),
            '1990-01-01',
            random(['Male', 'Female']),
            random(['Single', 'Married']),
            'Filipino',
            hhId,
            'Active',
            `09${Math.floor(Math.random() * 1000000000)}`,
          ]
        );
      }
    }

    // 3. Sync Sequence Table
    console.log('🔄 Syncing Sequence Table...');
    // Find max sequence per year/month from existing blotter
    const [maxSeqs] = await connection.execute(`
      SELECT 
        SUBSTRING(Case_Number, 6, 4) as year,
        SUBSTRING(Case_Number, 11, 2) as month,
        MAX(CAST(SUBSTRING(Case_Number, 14, 4) AS UNSIGNED)) as max_seq
      FROM blotter
      WHERE Case_Number REGEXP '^BLOT-[0-9]{4}-[0-9]{2}-[0-9]{4}$'
      GROUP BY year, month
    `);

    for (const row of maxSeqs) {
      const { year, month, max_seq } = row;
      if (year && month && max_seq) {
        await connection.execute(
          `
          INSERT INTO blotter_case_sequences (year, month, next_seq) 
          VALUES (?, ?, ?) 
          ON DUPLICATE KEY UPDATE next_seq = GREATEST(next_seq, VALUES(next_seq))
        `,
          [parseInt(year), parseInt(month), max_seq + 1]
        );
      }
    }

    // 4. Generate Blotter Cases
    console.log('⚖️  Generating Blotter Cases...');
    const [residents] = await connection.execute(
      'SELECT Resident_ID, First_Name, Last_Name FROM residents'
    );

    const casesToGenerate = 100;

    for (let i = 0; i < casesToGenerate; i++) {
      const date = randomDate(90); // Last 90 days
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      // Get next sequence
      await connection.execute(
        'INSERT IGNORE INTO blotter_case_sequences (year, month, next_seq) VALUES (?, ?, 1)',
        [year, month]
      );
      await connection.execute(
        'UPDATE blotter_case_sequences SET next_seq = next_seq + 1 WHERE year = ? AND month = ?',
        [year, month]
      );
      const [seqRows] = await connection.execute(
        'SELECT next_seq FROM blotter_case_sequences WHERE year = ? AND month = ?',
        [year, month]
      );
      const seq = seqRows[0].next_seq - 1;

      const caseNumber = `BLOT-${year}-${pad2(month)}-${pad4(seq)}`;

      const complainant = random(residents);
      let respondent = random(residents);
      while (respondent.Resident_ID === complainant.Resident_ID) respondent = random(residents);

      const incidentType = random(INCIDENT_TYPES);
      const sitio = random(SITIOS);
      const status = random(STATUSES);

      try {
        await connection.execute(
          `
          INSERT INTO blotter (
            Case_Number, Complainant_Details, Respondent_Details, 
            complainant_resident_id, respondent_resident_id,
            Incident_Type, Narrative, DateTime_Incident, 
            Location_Sitio, Status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            caseNumber,
            JSON.stringify({
              name: `${complainant.First_Name} ${complainant.Last_Name}`,
              id: complainant.Resident_ID,
            }),
            JSON.stringify({
              name: `${respondent.First_Name} ${respondent.Last_Name}`,
              id: respondent.Resident_ID,
            }),
            complainant.Resident_ID,
            respondent.Resident_ID,
            incidentType,
            `Generated narrative for ${incidentType} in ${sitio}. This is a test case.`,
            date,
            sitio,
            status,
            date,
          ]
        );
        process.stdout.write('.');
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          process.stdout.write('x');
          // Skip dupes
        } else {
          throw err;
        }
      }
    }

    // 5. Generate Certificate Requests
    console.log('📜 Generating Certificate Requests...');
    const requestCount = 150; // Generate enough for good analytics
    const dummyBlob = Buffer.from('dummy_image_data');

    for (let i = 0; i < requestCount; i++) {
      const resident = random(residents);
      const docType = random(CERTIFICATE_TYPES);
      const status = random(REQUEST_STATUSES);
      const date = randomDate(45); // Last 45 days to show trends
      const updatedDate = new Date(date);
      updatedDate.setHours(updatedDate.getHours() + Math.floor(Math.random() * 48)); // Processed within 48 hours

      const requestId = `REQ-${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad4(i + 1000)}`;

      // Resident Data Snapshot
      const residentData = JSON.stringify({
        First_Name: resident.First_Name,
        Last_Name: resident.Last_Name,
        Resident_ID: resident.Resident_ID,
      });

      // Request Data
      const requestData = JSON.stringify({
        purpose: 'Requirement',
        remarks: 'Generated by test script',
      });

      try {
        await connection.execute(
          `
          INSERT INTO document_requests (
            request_id, resident_id, document_type, status, 
            request_data, resident_data,
            attachment_front_id, attachment_back_id,
            attachment_front_mime, attachment_back_mime,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            requestId,
            resident.Resident_ID,
            docType,
            status,
            requestData,
            residentData,
            dummyBlob, // Front ID
            dummyBlob, // Back ID
            'image/jpeg',
            'image/jpeg',
            date,
            status !== 'pending' ? updatedDate : date,
          ]
        );
        process.stdout.write('+');
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') throw err;
      }
    }

    console.log('\n✅ Data generation complete!');
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await connection.end();
  }
}

generateData();
