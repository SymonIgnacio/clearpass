const mysql = require('mysql2/promise');
require('dotenv').config();

async function addBulkBlotterData() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management'
  });

  try {
    console.log('Checking current blotter count...');

    // Check current blotter count
    const [blotter] = await db.execute('SELECT COUNT(*) as count FROM blotter');
    console.log('Current blotter cases:', blotter[0].count);

    // Get residents for respondent_id
    const [residents] = await db.execute('SELECT Resident_ID FROM residents ORDER BY RAND() LIMIT 20');
    const residentIds = residents.map(r => r.Resident_ID);

    // Get sitios for locations
    const [sitios] = await db.execute('SELECT name FROM sitios');
    const locationSitios = sitios.map(s => s.name);

    console.log('Adding 100 random blotter records + 1 specific case...');

    const incidentTypes = [
      'Physical Injury',
      'Theft (Petty)',
      'Malicious Mischief',
      'Unauthorized parking blocking',
      'Domestic Dispute',
      'Noise Complaint',
      'Assault',
      'Vandalism',
      'Drug Related',
      'Public Disturbance'
    ];

    const statuses = ['Active', 'Resolved', 'Pending'];
    const firstNames = ['Juan', 'Maria', 'Pedro', 'Ana', 'Jose', 'Carmen', 'Miguel', 'Isabel', 'Antonio', 'Rosa'];
    const lastNames = ['Dela Cruz', 'Garcia', 'Santos', 'Reyes', 'Torres', 'Flores', 'Rivera', 'Morales', 'Castillo', 'Aquino'];

    // Generate 100 random blotter records
    const bulkBlotters = [];
    for (let i = 1; i <= 100; i++) {
      const caseNum = String(blotter[0].count + i).padStart(4, '0');
      const complainantFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
      const complainantLast = lastNames[Math.floor(Math.random() * lastNames.length)];
      const respondentFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
      const respondentLast = lastNames[Math.floor(Math.random() * lastNames.length)];

      const complainantDetails = {
        name: `${complainantFirst} ${complainantLast}`,
        address: `Block ${Math.floor(Math.random() * 10) + 1}, Lot ${Math.floor(Math.random() * 20) + 1}, ${locationSitios[Math.floor(Math.random() * locationSitios.length)]}`,
        contact: `0917${Math.floor(Math.random() * 90000000) + 10000000}`
      };

      const respondentDetails = Math.random() > 0.3 ? {
        name: `${respondentFirst} ${respondentLast}`,
        address: `Block ${Math.floor(Math.random() * 10) + 1}, Lot ${Math.floor(Math.random() * 20) + 1}, ${locationSitios[Math.floor(Math.random() * locationSitios.length)]}`,
        contact: `0917${Math.floor(Math.random() * 90000000) + 10000000}`
      } : null;

      const respondentId = Math.random() > 0.5 ? residentIds[Math.floor(Math.random() * residentIds.length)] : null;

      const incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];

      // Random date in 2025
      const randomMonth = Math.floor(Math.random() * 12) + 1;
      const randomDay = Math.floor(Math.random() * 28) + 1;
      const randomHour = Math.floor(Math.random() * 24);
      const randomMinute = Math.floor(Math.random() * 60);
      const dateTimeIncident = `2025-${String(randomMonth).padStart(2, '0')}-${String(randomDay).padStart(2, '0')} ${String(randomHour).padStart(2, '0')}:${String(randomMinute).padStart(2, '0')}:00`;

      const locationSitio = locationSitios[Math.floor(Math.random() * locationSitios.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      let narrative = '';
      switch (incidentType) {
        case 'Physical Injury':
          narrative = `Complainant alleges respondent ${respondentDetails ? respondentDetails.name : 'unknown person'} punched them during a dispute.`;
          break;
        case 'Theft (Petty)':
          narrative = `Complainant reports stolen ${['mobile phone', 'wallet', 'bicycle', 'bag'][Math.floor(Math.random() * 4)]} worth ₱${Math.floor(Math.random() * 5000) + 500}.`;
          break;
        case 'Malicious Mischief':
          narrative = `Complainant reports damage to their ${['motorcycle tires', 'car windshield', 'house gate', 'fence'][Math.floor(Math.random() * 4)]}.`;
          break;
        case 'Unauthorized parking blocking':
          narrative = `Complainant reports unauthorized parking blocking their vehicle access.`;
          break;
        case 'Domestic Dispute':
          narrative = `Complainant reports loud arguing and disturbance from neighboring household.`;
          break;
        case 'Noise Complaint':
          narrative = `Complainant reports excessive noise from ${['party', 'construction', 'loud music', 'barking dogs'][Math.floor(Math.random() * 4)]}.`;
          break;
        default:
          narrative = `Complainant reports incident involving ${incidentType.toLowerCase()}.`;
      }

      bulkBlotters.push({
        Case_Number: `BLOT-2025-12-${caseNum}`,
        Complainant_Details: JSON.stringify(complainantDetails),
        Respondent_Details: respondentDetails ? JSON.stringify(respondentDetails) : null,
        respondent_id: respondentId,
        Incident_Type: incidentType,
        Narrative: narrative,
        DateTime_Incident: dateTimeIncident,
        Location_Sitio: locationSitio,
        Status: status
      });
    }

    // Add the specific blotter case for "ana lizel"
    const specificBlotter = {
      Case_Number: 'BLOT-2026-01-0001',
      Complainant_Details: JSON.stringify({
        name: 'Barangay Officer',
        address: 'Barangay Hall, Main Street',
        contact: '09171234567'
      }),
      Respondent_Details: JSON.stringify({
        name: 'ana lizel',
        address: 'Block 5, Lot 10, Batia Proper',
        contact: '09181234567'
      }),
      respondent_id: null,
      Incident_Type: 'Unauthorized parking blocking',
      Narrative: 'Complainant reports unauthorized parking blocking the barangay entrance road.',
      DateTime_Incident: '2026-06-15 10:00:00',
      Location_Sitio: 'Batia Proper',
      Status: 'Active'
    };

    bulkBlotters.push(specificBlotter);

    // Insert all records
    for (const blotterRecord of bulkBlotters) {
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

    console.log(`✅ Added ${bulkBlotters.length} blotter records (${bulkBlotters.length - 1} random + 1 specific)`);

    // Verify the data was added
    const [verify] = await db.execute('SELECT COUNT(*) as count FROM blotter');
    console.log('Verification: Total blotter cases after insertion:', verify[0].count);

    // Show the specific case
    const [specific] = await db.execute('SELECT * FROM blotter WHERE Case_Number = ?', ['BLOT-2026-01-0001']);
    if (specific.length > 0) {
      console.log('Specific case "ana lizel" added:', {
        Case_Number: specific[0].Case_Number,
        Respondent_Details: JSON.parse(specific[0].Respondent_Details),
        Incident_Type: specific[0].Incident_Type,
        DateTime_Incident: specific[0].DateTime_Incident
      });
    }

  } catch (error) {
    console.error('Error adding bulk blotter data:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

addBulkBlotterData();
