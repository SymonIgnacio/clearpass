const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabase() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management'
  });

  try {
    console.log('Testing database tables...');

    // Test residents table
    const [residents] = await db.execute('SELECT COUNT(*) as count FROM residents');
    console.log('Total residents:', residents[0].count);

    if (residents[0].count > 0) {
      const [sample] = await db.execute('SELECT Resident_ID, First_Name, Last_Name, Residency_Status, Gender, Mobile_Number FROM residents LIMIT 3');
      console.log('Sample residents:', JSON.stringify(sample, null, 2));
    }

    // Test users table
    const [users] = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log('Total users:', users[0].count);

    // Test blotter table
    const [blotter] = await db.execute('SELECT COUNT(*) as count FROM blotter');
    console.log('Total blotter cases:', blotter[0].count);

    // If no blotter records exist, add sample data
    if (blotter[0].count === 0) {
      console.log('No blotter records found. Adding sample data...');

      // Get a sample resident for respondent_id
      const [sampleResidents] = await db.execute('SELECT Resident_ID FROM residents LIMIT 1');
      const respondentId = sampleResidents.length > 0 ? sampleResidents[0].Resident_ID : null;

      // Add sample blotter records
      const sampleBlotters = [
        {
          Case_Number: 'BLOT-2025-01-001',
          Complainant_Details: JSON.stringify({
            name: 'Juan Dela Cruz',
            address: 'Block 1, Lot 1, Batia Proper',
            contact: '09171234567'
          }),
          Respondent_Details: JSON.stringify({
            name: 'Pedro Garcia',
            address: 'Block 1, Lot 2, Batia Proper',
            contact: '09171234568'
          }),
          respondent_id: respondentId,
          Incident_Type: 'Physical Injury',
          Narrative: 'Complainant alleges respondent punched him during a dispute.',
          DateTime_Incident: '2025-01-15 14:30:00',
          Location_Sitio: 'Batia Proper',
          Status: 'Active'
        },
        {
          Case_Number: 'BLOT-2025-01-002',
          Complainant_Details: JSON.stringify({
            name: 'Maria Santos',
            address: 'Block 2, Lot 1, Batia Proper',
            contact: '09171234569'
          }),
          Respondent_Details: null,
          respondent_id: null,
          Incident_Type: 'Theft (Petty)',
          Narrative: 'Complainant reports stolen mobile phone worth ₱5,000.',
          DateTime_Incident: '2025-01-20 09:15:00',
          Location_Sitio: 'Northville 5',
          Status: 'Resolved'
        },
        {
          Case_Number: 'BLOT-2025-01-003',
          Complainant_Details: JSON.stringify({
            name: 'Antonio Reyes',
            address: 'Block 3, Lot 5, Batia Proper',
            contact: '09171234570'
          }),
          Respondent_Details: JSON.stringify({
            name: 'Unknown Person',
            description: 'Male, approximately 25 years old, wearing red shirt'
          }),
          respondent_id: null,
          Incident_Type: 'Malicious Mischief',
          Narrative: 'Complainant reports damage to his motorcycle tires.',
          DateTime_Incident: '2025-01-25 22:45:00',
          Location_Sitio: 'St. Martha',
          Status: 'Pending'
        }
      ];

      for (const blotterRecord of sampleBlotters) {
        await db.execute(`
          INSERT INTO blotter (
            Case_Number, Complainant_Details, Respondent_Details, respondent_id,
            Incident_Type, Narrative, DateTime_Incident, Location_Sitio, Status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          blotterRecord.Case_Number,
          blotterRecord.Complainant_Details,
          blotterRecord.Respondent_Details,
          blotterRecord.respondent_id,
          blotterRecord.Incident_Type,
          blotterRecord.Narrative,
          blotterRecord.DateTime_Incident,
          blotterRecord.Location_Sitio,
          blotterRecord.Status
        ]);
      }

      console.log('✅ Added', sampleBlotters.length, 'sample blotter records');
    } else {
      // Show sample records if they exist
      const [sampleBlotters] = await db.execute('SELECT Case_Number, Incident_Type, Status, Location_Sitio, created_at FROM blotter LIMIT 3');
      console.log('Sample blotter records:', JSON.stringify(sampleBlotters, null, 2));
    }

    // Test certificates table
    const [certs] = await db.execute('SELECT COUNT(*) as count FROM certificates_log');
    console.log('Total certificates:', certs[0].count);

  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

testDatabase();
