require('dotenv').config();
const knex = require('knex');
const bcrypt = require('bcryptjs');

// Config for XAMPP
const config = {
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: '', // Force empty for XAMPP
        database: process.env.DB_NAME || 'barangay_management',
        port: process.env.DB_PORT || 3306
    },
    pool: { min: 2, max: 10 }
};

const db = knex(config);

const SITIOS = [
    { name: 'Batia Proper', description: 'Main residential and commercial area' },
    { name: 'Northville 5', description: 'Northern residential district' },
    { name: 'St. Martha', description: 'Eastern residential area' },
    { name: 'AFP/PNP', description: 'Military and police housing compound' }
];

const LAST_NAMES = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Flores', 'Gonzales', 'Bautista'];
const FIRST_NAMES_M = ['Juan', 'Pedro', 'Jose', 'Mark', 'Michael', 'Angelo', 'Christian', 'Francis'];
const FIRST_NAMES_F = ['Maria', 'Anna', 'Rose', 'Mary', 'Jennifer', 'Christine', 'Sarah', 'Grace'];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function repopulateDatabase() {
    console.log('🚀 Starting Comprehensive Repopulation...');
    
    const trx = await db.transaction();
    
    try {
        // ==========================================
        // 1. DATA REMOVAL PHASE
        // ==========================================
        console.log('🗑️  Phase 1: Removing existing resident data...');
        await trx.raw('SET FOREIGN_KEY_CHECKS = 0');
        
        const tablesToTruncate = [
            'blotter', 'blotter_participants', 'certificates_log', 'clearance_requests', 
            'document_requests', 'resident_documents', 'resident_applications', 
            'resident_signup_requests', 'resident_verification_requests', 
            'program_participants', 'vulnerabilities', 'vehicles', 'visitors', 
            'residents', 'households', 'families'
        ];

        for (const table of tablesToTruncate) {
            // Check if table exists before truncating
            try {
                await trx(table).truncate();
            } catch (e) {
                // Ignore if table doesn't exist (like families)
            }
        }
        
        // Remove resident users
        // Assuming roles 5+ or specific role name 'resident' or check resident_id
        // For safety, let's just clear users who have resident_id set
        await trx('users').whereNotNull('resident_id').del();

        console.log('✅ Data removal complete.');

        // ==========================================
        // 2. DATA POPULATION STRATEGY
        // ==========================================
        console.log('🌱 Phase 2: Populating reference data...');

        // 2.1 Sitios
        const existingSitios = await trx('sitios').select('id', 'name');
        let sitioIds = [];
        
        if (existingSitios.length === 0) {
            const inserted = await trx('sitios').insert(SITIOS);
            // Re-fetch to get IDs
            const newSitios = await trx('sitios').select('id');
            sitioIds = newSitios.map(s => s.id);
        } else {
            sitioIds = existingSitios.map(s => s.id);
        }

        // 2.2 Certificate Types
        const existingCertTypes = await trx('certificate_types').select('id');
        if (existingCertTypes.length === 0) {
             await trx('certificate_types').insert([
                {
                  name: 'Barangay Clearance',
                  fee: 50.00,
                  validity_days: 365,
                  description: 'Standard clearance',
                  purpose: 'Employment, ID',
                  when_needed: 'Job Application',
                  required_data: JSON.stringify(['Valid ID', 'Purpose'])
                },
                {
                  name: 'Indigency',
                  fee: 0.00,
                  validity_days: 180,
                  description: 'Certificate of Indigency',
                  purpose: 'Financial Assistance',
                  when_needed: 'Medical/School assistance',
                  required_data: JSON.stringify(['Valid ID', 'Case Study'])
                }
              ]);
        }

        console.log('👥 Phase 3: Populating residents and households...');
        
        const residentsToInsert = [];
        const householdsToInsert = [];
        const householdMap = new Map(); // ID -> Head ID
        
        // Generate 15 Households
        for (let i = 1; i <= 15; i++) {
            const hhId = `H-2025-${String(i).padStart(3, '0')}`;
            const sitioId = getRandomElement(sitioIds);
            
            householdsToInsert.push({
                Household_ID: hhId,
                Household_Number: `HH-${String(i).padStart(3, '0')}`,
                Sitio_ID: sitioId,
                Street_Address: `Block ${Math.floor(Math.random()*10)+1}, Lot ${Math.floor(Math.random()*20)+1}`,
                Total_Members: 0, // Will update later
                Household_Type: 'Nuclear'
            });

            // Create Head of Household
            const headId = `RES-2025-${String(residentsToInsert.length + 1).padStart(3, '0')}`;
            const lastName = getRandomElement(LAST_NAMES);
            
            residentsToInsert.push({
                Resident_ID: headId,
                Household_ID: hhId,
                Relation_to_Head: 'Head',
                First_Name: getRandomElement(FIRST_NAMES_M),
                Last_Name: lastName,
                Middle_Name: getRandomElement(LAST_NAMES),
                Birthdate: getRandomDate(new Date(1960, 0, 1), new Date(1990, 0, 1)),
                Gender: 'Male',
                Civil_Status: 'Married',
                Occupation: getRandomElement(['Driver', 'Laborer', 'Employee', 'Vendor']),
                Residency_Status: 'Active',
                Voter_Status: 'Registered',
                Date_Arrival: getRandomDate(new Date(2010, 0, 1), new Date(2020, 0, 1)),
                created_at: new Date(),
                updated_at: new Date()
            });
            
            householdMap.set(hhId, headId);

            // Create Spouse
            const spouseId = `RES-2025-${String(residentsToInsert.length + 1).padStart(3, '0')}`;
            residentsToInsert.push({
                Resident_ID: spouseId,
                Household_ID: hhId,
                Relation_to_Head: 'Spouse',
                First_Name: getRandomElement(FIRST_NAMES_F),
                Last_Name: lastName,
                Middle_Name: getRandomElement(LAST_NAMES),
                Birthdate: getRandomDate(new Date(1965, 0, 1), new Date(1995, 0, 1)),
                Gender: 'Female',
                Civil_Status: 'Married',
                Occupation: getRandomElement(['Housewife', 'Teacher', 'Vendor', 'None']),
                Residency_Status: 'Active',
                Voter_Status: 'Registered',
                Date_Arrival: getRandomDate(new Date(2010, 0, 1), new Date(2020, 0, 1)),
                created_at: new Date(),
                updated_at: new Date()
            });

            // Create 1-3 Children
            const numChildren = Math.floor(Math.random() * 3) + 1;
            for (let c = 0; c < numChildren; c++) {
                const childId = `RES-2025-${String(residentsToInsert.length + 1).padStart(3, '0')}`;
                const gender = Math.random() > 0.5 ? 'Male' : 'Female';
                residentsToInsert.push({
                    Resident_ID: childId,
                    Household_ID: hhId,
                    Relation_to_Head: 'Child',
                    First_Name: getRandomElement(gender === 'Male' ? FIRST_NAMES_M : FIRST_NAMES_F),
                    Last_Name: lastName,
                    Middle_Name: getRandomElement(LAST_NAMES),
                    Birthdate: getRandomDate(new Date(2005, 0, 1), new Date(2023, 0, 1)),
                    Gender: gender,
                    Civil_Status: 'Single',
                    Occupation: 'Student',
                    Residency_Status: 'Active',
                    Voter_Status: 'Non-Registered',
                    Date_Arrival: getRandomDate(new Date(2010, 0, 1), new Date(2020, 0, 1)),
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }
        }

        // Insert Households (without Head ID first to avoid FK error if check enabled, though we disabled it)
        await trx('households').insert(householdsToInsert);
        console.log(`   -> Inserted ${householdsToInsert.length} households`);

        // Insert Residents
        // Batch insert to avoid query limits
        const chunkSize = 50;
        for (let i = 0; i < residentsToInsert.length; i += chunkSize) {
            await trx('residents').insert(residentsToInsert.slice(i, i + chunkSize));
        }
        console.log(`   -> Inserted ${residentsToInsert.length} residents`);

        // Update Household Heads and Member Counts
        for (const [hhId, headId] of householdMap) {
            const count = residentsToInsert.filter(r => r.Household_ID === hhId).length;
            await trx('households')
                .where('Household_ID', hhId)
                .update({ 
                    Head_Resident_ID: headId,
                    Total_Members: count
                });
        }

        console.log('⚖️  Phase 4: Creating operational data (Blotter, Certs)...');
        
        // 4.1 Blotter Cases
        const blotterCases = [];
        const statuses = ['Active', 'Settled', 'Dismissed'];
        const incidents = ['Physical Injury', 'Theft (Petty)', 'Boundary Dispute', 'Grave Threats', 'Noise Barrage'];
        
        for (let i = 0; i < 5; i++) {
            const complainant = getRandomElement(residentsToInsert);
            let respondent = getRandomElement(residentsToInsert);
            while (respondent.Resident_ID === complainant.Resident_ID) {
                respondent = getRandomElement(residentsToInsert);
            }
            
            blotterCases.push({
                Case_Number: `CASE-2025-${String(i+1).padStart(3, '0')}`,
                Complainant_Details: JSON.stringify({
                    name: `${complainant.First_Name} ${complainant.Last_Name}`,
                    id: complainant.Resident_ID
                }),
                complainant_resident_id: complainant.Resident_ID,
                Respondent_Details: JSON.stringify({
                    name: `${respondent.First_Name} ${respondent.Last_Name}`,
                    id: respondent.Resident_ID
                }),
                respondent_resident_id: respondent.Resident_ID,
                Incident_Type: getRandomElement(incidents), // Ensure these match ENUM
                Narrative: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                DateTime_Incident: getRandomDate(new Date(2025, 0, 1), new Date()),
                Location_Sitio: getRandomElement(SITIOS).name,
                status: 'Active', // Safe default
                created_at: new Date(),
                updated_at: new Date()
            });
        }
        await trx('blotter').insert(blotterCases);
        console.log(`   -> Created ${blotterCases.length} blotter cases`);

        // 4.2 Certificates Log
        const certTypes = await trx('certificate_types').select('id', 'name', 'fee');
        const certLogs = [];
        
        for (let i = 0; i < 10; i++) {
            const resident = getRandomElement(residentsToInsert);
            const type = getRandomElement(certTypes);
            
            certLogs.push({
                control_no: `CERT-2025-${String(i+1).padStart(3, '0')}`,
                resident_id: resident.Resident_ID,
                certificate_type: type.name,
                purpose: 'Requirement',
                date_issued: getRandomDate(new Date(2025, 0, 1), new Date()),
                fee_amount: type.fee,
                status: 'Released',
                signatory_captain: 'Juan Dela Cruz',
                signatory_secretary: 'Maria Santos',
                qr_validation_string: `QR-${Math.random().toString(36).substring(7)}`,
                created_at: new Date()
            });
        }
        await trx('certificates_log').insert(certLogs);
        console.log(`   -> Issued ${certLogs.length} certificates`);

        // 4.3 Vulnerabilities
        const vulData = [];
        // Randomly assign 10% as 4Ps
        residentsToInsert.forEach(res => {
            if (Math.random() < 0.1) {
                vulData.push({
                    Resident_ID: res.Resident_ID,
                    Is_4Ps: true
                });
            }
        });
        if (vulData.length > 0) {
            await trx('vulnerabilities').insert(vulData);
            console.log(`   -> Tagged ${vulData.length} vulnerable residents`);
        }

        // 4.4 Resident Applications
        const applications = [];
        for (let i = 0; i < 8; i++) {
            applications.push({
                application_id: `APP-2025-${String(i+1).padStart(3, '0')}`,
                first_name: getRandomElement(FIRST_NAMES_M),
                last_name: getRandomElement(LAST_NAMES),
                birthdate: getRandomDate(new Date(1990, 0, 1), new Date(2000, 0, 1)),
                gender: 'Male',
                civil_status: 'Single',
                email: `applicant${i+1}@example.com`,
                street_address: 'Block 5 Lot 5',
                sitio: getRandomElement(SITIOS).name,
                status: i < 3 ? 'pending' : (i < 6 ? 'approved' : 'rejected'),
                created_at: new Date(),
                updated_at: new Date()
            });
        }
        await trx('resident_applications').insert(applications);
        console.log(`   -> Created ${applications.length} resident applications`);

        // 4.5 Resident Documents
        const documents = [];
        const docTypes = ['Valid ID', 'Proof of Address', 'Cedula'];
        
        // Add docs for existing residents
        for (let i = 0; i < 15; i++) {
            const resident = residentsToInsert[i]; // Pick first 15 residents
            documents.push({
                resident_id: resident.Resident_ID,
                document_type: getRandomElement(docTypes),
                file_path: `/uploads/documents/${resident.Resident_ID}_doc.jpg`,
                file_name: 'scan_001.jpg',
                verification_status: i < 5 ? 'pending' : 'verified',
                created_at: new Date(),
                updated_at: new Date()
            });
        }
        await trx('resident_documents').insert(documents);
        console.log(`   -> Uploaded ${documents.length} resident documents`);

        await trx.raw('SET FOREIGN_KEY_CHECKS = 1');
        await trx.commit();
        console.log('✨ COMPREHENSIVE REPOPULATION SUCCESSFUL!');
        
    } catch (error) {
        await trx.rollback();
        console.error('❌ Repopulation Failed. Rolled back changes.');
        console.error(error);
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

repopulateDatabase();
