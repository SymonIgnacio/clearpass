const db = require('../server/database');
const crypto = require('crypto');

async function seedCertificateRequests() {
  console.log('Starting seed of certificate requests...');

  try {
    // 1. Get existing residents
    const [residents] = await db.pool.execute(
      'SELECT Resident_ID, First_Name, Last_Name, Middle_Name, Birthdate, Civil_Status FROM residents LIMIT 5'
    );

    if (residents.length === 0) {
      console.error('No residents found. Please seed residents first.');
      process.exit(1);
    }

    console.log(`Found ${residents.length} residents to link requests to.`);

    const requests = [];
    const documentTypes = ['Barangay Clearance', 'Certificate of Indigency', 'Business Permit', 'Certificate of Residency'];
    const statuses = ['pending', 'pending', 'approved', 'rejected'];

    // 2. Create requests for each resident
    for (const resident of residents) {
      // Create 1-2 requests per resident
      const numRequests = Math.floor(Math.random() * 2) + 1;

      for (let i = 0; i < numRequests; i++) {
        const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const requestData = {
          purpose: 'Employment',
          details: `Requesting ${docType} for employment purposes.`,
          remarks: 'Please expedite if possible.'
        };

        const residentData = {
          first_name: resident.First_Name,
          last_name: resident.Last_Name,
          middle_name: resident.Middle_Name,
          address: 'Barangay Proper',
          civil_status: resident.Civil_Status,
          citizenship: 'Filipino'
        };

        let approvalData = null;
        let approvedAt = null;
        let approvedBy = null;

        if (status === 'approved') {
          approvalData = {
            approved_by: 'Admin User',
            remarks: 'All requirements met.'
          };
          approvedAt = new Date();
          approvedBy = 'Admin User';
        } else if (status === 'rejected') {
          approvalData = {
            rejected_by: 'Admin User',
            reason: 'Missing documents.'
          };
        }

        requests.push([
          crypto.randomUUID(), // request_id
          resident.Resident_ID,
          docType,
          status,
          JSON.stringify(requestData),
          JSON.stringify(residentData),
          approvalData ? JSON.stringify(approvalData) : null,
          approvedAt,
          approvedBy,
          new Date(), // created_at
          new Date()  // updated_at
        ]);
      }
    }

    // 3. Insert into database
    if (requests.length > 0) {
      const query = `
        INSERT INTO document_requests (
          request_id, resident_id, document_type, status,
          request_data, resident_data, approval_data,
          approved_at, approved_by, created_at, updated_at
        ) VALUES ?
      `;
      
      await db.pool.query(query, [requests]);
      console.log(`Successfully inserted ${requests.length} certificate requests.`);
    }

  } catch (error) {
    console.error('Error seeding certificate requests:', error);
  } finally {
    await db.pool.end();
    process.exit();
  }
}

seedCertificateRequests();
