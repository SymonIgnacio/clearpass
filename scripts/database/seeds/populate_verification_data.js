import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'barangay_management',
  multipleStatements: true
};

const sitios = ['Batia Proper', 'Northville 5', 'St. Martha', 'AFP/PNP'];

function generateRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function populateVerificationData() {
  console.log('🚀 Starting Verification Data Population...');
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    // ==========================================
    // 1. POPULATE REGISTRATION APPLICATIONS
    // ==========================================
    console.log('\n📝 Generating Resident Applications...');
    
    // Clear existing test applications (optional, but cleaner)
    await connection.execute('DELETE FROM resident_applications WHERE email LIKE "test.applicant%"');

    const applications = [];
    const statuses = ['pending', 'approved', 'rejected'];
    
    // Generate 15 applications (5 of each status)
    for (let i = 1; i <= 15; i++) {
      const status = statuses[(i - 1) % 3];
      const appId = `APP-TEST-${String(i).padStart(3, '0')}`;
      const sitio = sitios[Math.floor(Math.random() * sitios.length)];
      
      applications.push([
        appId,
        `Applicant${i}`, // First Name
        'Middle',        // Middle Name
        `TestUser${i}`,  // Last Name
        null,            // Suffix
        '1990-01-01',    // Birthdate
        'Male',          // Gender
        'Single',        // Civil Status
        'Laborer',       // Occupation
        10000.00,        // Income
        `test.applicant${i}@example.com`,
        `091234567${String(i).padStart(2, '0')}`,
        `Block ${i} Lot ${i}`, // Street Address
        sitio,
        'Non-Registered', // Voter Status
        i % 2 === 0,     // Is 4Ps
        i % 3 === 0,     // Is PWD
        i % 4 === 0,     // Is Solo Parent
        0,               // OSY
        null,            // Disability Type
        status,
        status === 'rejected' ? 'Incomplete documents' : null, // Rejection Reason
        status !== 'pending' ? 1 : null, // Reviewed By (Admin ID 1)
        status !== 'pending' ? new Date() : null // Reviewed At
      ]);
    }

    const appSql = `
      INSERT INTO resident_applications (
        application_id, first_name, middle_name, last_name, suffix, birthdate, 
        gender, civil_status, occupation, income_estimate, email, mobile_number, 
        street_address, sitio, voter_status, is_4ps, is_pwd, is_solo_parent, 
        is_out_of_school_youth, disability_type, status, rejection_reason, 
        reviewed_by, reviewed_at
      ) VALUES ?
    `;

    if (applications.length > 0) {
      await connection.query(appSql, [applications]);
      console.log(`✅ Inserted ${applications.length} resident applications.`);
    }

    // ==========================================
    // 2. POPULATE BENEFICIARY VALIDATION DATA
    // ==========================================
    console.log('\n👥 Generating Pending Beneficiary Validations...');

    // Get some existing residents
    const [residents] = await connection.execute('SELECT Resident_ID FROM residents LIMIT 20');
    
    if (residents.length > 0) {
      let updatedCount = 0;
      for (const resident of residents) {
        // Randomly assign beneficiary claims
        const is4Ps = Math.random() > 0.7;
        const isPWD = Math.random() > 0.8;
        const isSoloParent = Math.random() > 0.8;
        const isSenior = Math.random() > 0.9;

        if (is4Ps || isPWD || isSoloParent || isSenior) {
          await connection.execute(`
            INSERT INTO vulnerabilities (
              Resident_ID, Is_4Ps, Is_PWD, Is_Solo_Parent, Is_Senior, 
              validation_status, Vulnerability_Score
            ) VALUES (?, ?, ?, ?, ?, 'pending', ?)
            ON DUPLICATE KEY UPDATE
              Is_4Ps = VALUES(Is_4Ps),
              Is_PWD = VALUES(Is_PWD),
              Is_Solo_Parent = VALUES(Is_Solo_Parent),
              Is_Senior = VALUES(Is_Senior),
              validation_status = 'pending',
              Vulnerability_Score = VALUES(Vulnerability_Score)
          `, [
            resident.Resident_ID,
            is4Ps, isPWD, isSoloParent, isSenior,
            (is4Ps ? 1 : 0) + (isPWD ? 2 : 0) + (isSoloParent ? 1 : 0) + (isSenior ? 1 : 0)
          ]);
          updatedCount++;
        }
      }
      console.log(`✅ Updated ${updatedCount} residents with pending beneficiary claims.`);
    } else {
      console.log('⚠️ No residents found. Please run the main seeder first.');
    }

    console.log('\n🎉 Verification Data Population Completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

populateVerificationData();
