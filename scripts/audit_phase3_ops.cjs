const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

async function runOpsAudit() {
  console.log('🚀 Starting Phase 3: Operational Modules Audit (Corrected)');
  
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ DB Connected');
  } catch (e) {
    console.error('❌ DB Connection Failed:', e.message);
    process.exit(1);
  }

  // --- 1. CERTIFICATES (document_requests) ---
  console.log('\nTesting Certificate Workflow...');
  try {
    // Need a resident first
    const [residents] = await connection.execute('SELECT Resident_ID, First_Name, Last_Name FROM residents LIMIT 1');
    if (residents.length === 0) {
        console.warn('⚠️  Skipping Certificate test: No residents found.');
    } else {
        const resident = residents[0];
        const requestId = `AUDIT-REQ-${Date.now()}`;
        
        // Insert Request
        await connection.execute(`
            INSERT INTO document_requests (
              request_id, resident_id, document_type, status, 
              request_data, resident_data, created_at
            ) VALUES (?, ?, ?, 'pending', ?, ?, NOW())
        `, [
            requestId,
            resident.Resident_ID,
            'Barangay Clearance',
            JSON.stringify({ purpose: 'Audit Test' }),
            JSON.stringify(resident)
        ]);
        console.log(`✅ Certificate Request Created (ID: ${requestId})`);
        
        // Update Status (Simulate Approval)
        await connection.execute('UPDATE document_requests SET status = ? WHERE request_id = ?', ['approved', requestId]);
        console.log('✅ Certificate Request Approved');
        
        // Cleanup
        await connection.execute('DELETE FROM document_requests WHERE request_id = ?', [requestId]);
        console.log('✅ Certificate Cleanup Complete');
    }
  } catch (e) {
    console.error('❌ Certificate Test Failed:', e.message);
  }

  // --- 2. BLOTTER (blotter) ---
  console.log('\nTesting Blotter Workflow...');
  try {
     const caseNumber = `AUDIT-CASE-${Date.now()}`;
     
     // Insert Case
     await connection.execute(`
        INSERT INTO blotter (
            Case_Number, Complainant_Details, Incident_Type, Narrative, 
            DateTime_Incident, Location_Sitio, status
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?)
     `, [
         caseNumber,
         JSON.stringify({ name: 'Audit Bot' }),
         'System Check',
         'Audit Narrative',
         'Sitio 1',
         'Pending'
     ]);
     console.log(`✅ Blotter Case Created (ID: ${caseNumber})`);
     
     // Update
     await connection.execute('UPDATE blotter SET status = ? WHERE Case_Number = ?', ['Resolved', caseNumber]);
     console.log('✅ Blotter Case Resolved');
     
     // Cleanup
     await connection.execute('DELETE FROM blotter WHERE Case_Number = ?', [caseNumber]);
     console.log('✅ Blotter Cleanup Complete');
  } catch (e) {
    console.error('❌ Blotter Test Failed:', e.message);
  }

  // --- 3. COMMUNITY PROGRAMS ---
  console.log('\nTesting Community Programs...');
  try {
      const [res] = await connection.execute(
          'INSERT INTO community_programs (program_name, description, program_date, status) VALUES (?, ?, NOW(), ?)',
          ['Audit Program', 'Test Description', 'Planned']
      );
      const programId = res.insertId;
      console.log(`✅ Program Created (ID: ${programId})`);
      
      // Cleanup
      await connection.execute('DELETE FROM community_programs WHERE id = ?', [programId]);
      console.log('✅ Program Cleanup Complete');
  } catch (e) {
      if (e.message.includes("doesn't exist")) {
          console.error('❌ Community Programs table missing!');
      } else {
          console.error('❌ Program Test Failed:', e.message);
      }
  }

  // --- 4. TEMPLATES ---
  console.log('\nTesting Templates...');
  try {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM document_templates');
      console.log(`✅ Templates Table Accessible (Count: ${rows[0].count})`);
  } catch (e) {
      console.error('❌ Template Check Failed:', e.message);
  }

  await connection.end();
}

runOpsAudit();
