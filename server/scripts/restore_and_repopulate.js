require('dotenv').config();
const knex = require('knex');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Database Configuration
const config = {
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: '', // Force empty for XAMPP
        database: process.env.DB_NAME || 'barangay_management',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    },
    pool: { min: 2, max: 10 }
};

const db = knex(config);

// Constants for Repopulation
const SITIOS = [
    { name: 'Batia Proper', description: 'Main residential and commercial area' },
    { name: 'Northville 5', description: 'Northern residential district' },
    { name: 'St. Martha', description: 'Eastern residential area' },
    { name: 'AFP/PNP', description: 'Military and police housing compound' }
];

const CERT_TYPES = [
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
    },
    {
        name: 'Barangay Residency',
        fee: 30.00,
        validity_days: 180,
        description: "Certifies an individual's residence",
        purpose: 'Confirms residency',
        when_needed: 'ID Application',
        required_data: JSON.stringify(['Valid ID', 'Address'])
    }
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

async function createBackup() {
    console.log('📦 Creating database backup...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../../database/backups');
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);
    // Assuming standard XAMPP path for mysqldump
    const mysqldumpPath = 'c:\\xampp\\mysql\\bin\\mysqldump.exe';
    const cmd = `"${mysqldumpPath}" -u ${config.connection.user} ${config.connection.database} > "${backupFile}"`;

    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(`⚠️  Backup warning: ${error.message}`);
                // Don't fail the whole process if backup fails (e.g., mysqldump not found)
                // But let user know.
                resolve(null);
            } else {
                console.log(`✅ Backup created at: ${backupFile}`);
                resolve(backupFile);
            }
        });
    });
}

async function checkMissingData() {
    console.log('🔍 Checking for missing core data...');
    const tables = [
        { name: 'sitios', pk: 'id' },
        { name: 'certificate_types', pk: 'id' },
        { name: 'users', pk: 'id' },
        { name: 'residents', pk: 'Resident_ID' },
        { name: 'households', pk: 'Household_ID' }
    ];
    const status = {};

    for (const t of tables) {
        try {
            const result = await db(t.name).count(`${t.pk} as count`).first();
            // Handle different count return structures depending on driver version
            const count = result.count || result['count(*)'] || 0;
            status[t.name] = parseInt(count);
            console.log(`   - ${t.name}: ${count} records`);
        } catch (e) {
            console.log(`   - ${t.name}: Table check failed or table missing (${e.message})`);
            status[t.name] = -1;
        }
    }
    return status;
}

async function repopulateCoreData(trx) {
    console.log('🌱 Ensuring Core Reference Data...');

    // Sitios
    const sitiosCount = await trx('sitios').count('id as count').first();
    if (sitiosCount.count == 0) {
        await trx('sitios').insert(SITIOS);
        console.log('   -> Inserted default Sitios');
    }

    // Certificate Types
    const certTypesCount = await trx('certificate_types').count('id as count').first();
    if (certTypesCount.count == 0) {
        await trx('certificate_types').insert(CERT_TYPES);
        console.log('   -> Inserted default Certificate Types');
    }
}

async function repopulateUsers(trx) {
    console.log('👤 Checking Admin/Staff Users...');
    
    // Fetch Roles
    const roles = await trx('roles').select('id', 'role_name');
    const adminRole = roles.find(r => r.role_name === 'admin' || r.role_name === 'superadmin' || r.role_name === 'IT Admin');
    
    if (!adminRole) {
        console.warn('   ⚠️ WARNING: No admin/superadmin/IT Admin role found in roles table. Cannot create admin user.');
        return;
    }

    // Check for superadmin
    const admin = await trx('users').where('role', adminRole.id).first();
    if (!admin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await trx('users').insert({
            username: 'admin',
            full_name: 'System Administrator',
            email: 'admin@clearpass.com',
            password_hash: hashedPassword,
            role: adminRole.id, 
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        });
        console.log(`   -> Created default superadmin (admin / admin123) with role ID ${adminRole.id}`);
    }
}

async function repopulateTestData(trx) {
    console.log('🧪 Generating Test Data (Residents, Households, Operational)...');

    // Fetch Sitios
    const sitios = await trx('sitios').select('id', 'name');
    if (sitios.length === 0) return; // Should not happen after core data

    const sitioIds = sitios.map(s => s.id);
    const residentsToInsert = [];
    const householdsToInsert = [];
    const householdMap = new Map();

    // Generate 20 Households
    for (let i = 1; i <= 20; i++) {
        const hhId = `H-2026-${String(i).padStart(3, '0')}`;
        const sitioId = getRandomElement(sitioIds);
        
        householdsToInsert.push({
            Household_ID: hhId,
            Household_Number: `HH-${String(i).padStart(3, '0')}`,
            Sitio_ID: sitioId,
            Street_Address: `Block ${Math.floor(Math.random()*10)+1}, Lot ${Math.floor(Math.random()*20)+1}`,
            Total_Members: 0, 
            Household_Type: 'Nuclear'
        });

        // Head
        const headId = `RES-2026-${String(residentsToInsert.length + 1).padStart(3, '0')}`;
        const lastName = getRandomElement(LAST_NAMES);
        
        residentsToInsert.push({
            Resident_ID: headId,
            Household_ID: hhId,
            Relation_to_Head: 'Head',
            First_Name: getRandomElement(FIRST_NAMES_M),
            Last_Name: lastName,
            Middle_Name: getRandomElement(LAST_NAMES),
            Birthdate: getRandomDate(new Date(1970, 0, 1), new Date(1995, 0, 1)),
            Gender: 'Male',
            Civil_Status: 'Married',
            Occupation: getRandomElement(['Driver', 'Laborer', 'Employee', 'Vendor']),
            Residency_Status: 'Active',
            Voter_Status: 'Registered',
            Date_Arrival: getRandomDate(new Date(2015, 0, 1), new Date(2023, 0, 1)),
            Email: `resident${residentsToInsert.length + 1}@example.com`, // Ensure email uniqueness
            created_at: new Date(),
            updated_at: new Date()
        });
        
        householdMap.set(hhId, headId);

        // Spouse
        const spouseId = `RES-2026-${String(residentsToInsert.length + 1).padStart(3, '0')}`;
        residentsToInsert.push({
            Resident_ID: spouseId,
            Household_ID: hhId,
            Relation_to_Head: 'Spouse',
            First_Name: getRandomElement(FIRST_NAMES_F),
            Last_Name: lastName,
            Middle_Name: getRandomElement(LAST_NAMES),
            Birthdate: getRandomDate(new Date(1975, 0, 1), new Date(1998, 0, 1)),
            Gender: 'Female',
            Civil_Status: 'Married',
            Occupation: getRandomElement(['Housewife', 'Teacher', 'Vendor', 'None']),
            Residency_Status: 'Active',
            Voter_Status: 'Registered',
            Date_Arrival: getRandomDate(new Date(2015, 0, 1), new Date(2023, 0, 1)),
            Email: `resident${residentsToInsert.length + 1}@example.com`,
            created_at: new Date(),
            updated_at: new Date()
        });

        // Kids
        const numChildren = Math.floor(Math.random() * 3);
        for (let c = 0; c < numChildren; c++) {
            const childId = `RES-2026-${String(residentsToInsert.length + 1).padStart(3, '0')}`;
            const gender = Math.random() > 0.5 ? 'Male' : 'Female';
            residentsToInsert.push({
                Resident_ID: childId,
                Household_ID: hhId,
                Relation_to_Head: 'Child',
                First_Name: getRandomElement(gender === 'Male' ? FIRST_NAMES_M : FIRST_NAMES_F),
                Last_Name: lastName,
                Middle_Name: getRandomElement(LAST_NAMES),
                Birthdate: getRandomDate(new Date(2005, 0, 1), new Date(2024, 0, 1)),
                Gender: gender,
                Civil_Status: 'Single',
                Occupation: 'Student',
                Residency_Status: 'Active',
                Voter_Status: 'Non-Registered',
                Date_Arrival: getRandomDate(new Date(2015, 0, 1), new Date(2023, 0, 1)),
                Email: `resident${residentsToInsert.length + 1}@example.com`,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    // Insert Households
    // We use ON DUPLICATE KEY UPDATE to avoid errors if they already exist (though this is "repopulate")
    // But since we want to ensure fresh test data, we might want to clear first.
    // However, user said "Repopulate", implying we might be adding to existing.
    // But for "test records", usually we want a clean slate or at least non-conflicting.
    // The IDs are hardcoded (H-2026-...), so they won't conflict with H-2025-... from previous scripts unless re-run.
    
    // Let's Check if these IDs exist, if so skip
    const existingHH = await trx('households').whereIn('Household_ID', householdsToInsert.map(h => h.Household_ID)).pluck('Household_ID');
    const newHH = householdsToInsert.filter(h => !existingHH.includes(h.Household_ID));
    
    if (newHH.length > 0) {
        await trx('households').insert(newHH);
        console.log(`   -> Inserted ${newHH.length} new households`);
    }

    const existingRes = await trx('residents').whereIn('Resident_ID', residentsToInsert.map(r => r.Resident_ID)).pluck('Resident_ID');
    const newRes = residentsToInsert.filter(r => !existingRes.includes(r.Resident_ID));

    if (newRes.length > 0) {
        // Chunk insert
        const chunkSize = 50;
        for (let i = 0; i < newRes.length; i += chunkSize) {
            await trx('residents').insert(newRes.slice(i, i + chunkSize));
        }
        console.log(`   -> Inserted ${newRes.length} new residents`);
    }

    // Update Heads
    for (const [hhId, headId] of householdMap) {
        const count = residentsToInsert.filter(r => r.Household_ID === hhId).length;
        // Only update if it was one of our new households
        if (newHH.find(h => h.Household_ID === hhId)) {
             await trx('households')
                .where('Household_ID', hhId)
                .update({ 
                    Head_Resident_ID: headId,
                    Total_Members: count
                });
        }
    }
}

async function validateSystem() {
    console.log('✅ Validating System State...');
    const validations = [
        { table: 'sitios', pk: 'id', min: 1, name: 'Sitios exist' },
        { table: 'certificate_types', pk: 'id', min: 1, name: 'Certificate Types exist' },
        { table: 'users', pk: 'id', min: 1, name: 'Admin users exist' },
        { table: 'residents', pk: 'Resident_ID', min: 10, name: 'Sufficient residents (min 10)' },
        { table: 'households', pk: 'Household_ID', min: 5, name: 'Sufficient households (min 5)' }
    ];

    let allValid = true;
    for (const v of validations) {
        try {
            const res = await db(v.table).count(`${v.pk} as count`).first();
            const count = res.count || res['count(*)'] || 0;
            if (count < v.min) {
                console.error(`   ❌ FAIL: ${v.name} (Found ${count}, Expected ${v.min})`);
                allValid = false;
            } else {
                console.log(`   ✔️ PASS: ${v.name} (${count})`);
            }
        } catch (e) {
            console.error(`   ❌ ERROR: ${v.name} - Table check failed: ${e.message}`);
            allValid = false;
        }
    }
    return allValid;
}

async function main() {
    try {
        console.log('🔄 STARTING RESTORATION AND REPOPULATION PROCESS');
        
        // 1. Backup
        await createBackup();

        // 2. Check current state
        await checkMissingData();

        // 3. Repopulate
        await db.transaction(async trx => {
            await repopulateCoreData(trx);
            await repopulateUsers(trx);
            await repopulateTestData(trx);
        });

        // 4. Validate
        const isValid = await validateSystem();

        if (isValid) {
            console.log('✨ SUCCESS: Database restored and repopulated successfully.');
        } else {
            console.warn('⚠️ WARNING: System validation found issues. Check logs above.');
        }

    } catch (error) {
        console.error('❌ FATAL ERROR:', error);
    } finally {
        await db.destroy();
    }
}

main();
