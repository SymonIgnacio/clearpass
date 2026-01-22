const mysql = require('mysql2/promise');
require('dotenv').config({path: './server/.env'});

async function verifyDatabaseSchemaAlignment() {
  console.log('🧪 DATABASE SCHEMA ALIGNMENT VERIFICATION\n');

  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root', 
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barangay_management'
    });

    console.log('✅ Database connected successfully');

    let alignmentIssues = [];
    let totalChecks = 0;
    let passedChecks = 0;

    // Check 1: Verify core tables exist with expected columns
    console.log('\n1. Checking table structures:');
    
    const coreTables = [
      { name: 'users', essentialColumns: ['id', 'username', 'password_hash', 'email', 'role'] },
      { name: 'residents', essentialColumns: ['Resident_ID', 'First_Name', 'Last_Name', 'Email', 'Sitio_ID'] },
      { name: 'households', essentialColumns: ['Household_ID', 'Household_Number'] },
      { name: 'blotter', essentialColumns: ['id', 'case_number', 'complainant_name', 'status'] },
      { name: 'certificates_log', essentialColumns: ['id', 'control_no', 'resident_id', 'certificate_type'] },
      { name: 'certificate_requests', essentialColumns: ['id', 'certificate_type_id', 'status'] },
      { name: 'roles', essentialColumns: ['id', 'role_name', 'hierarchy_level'] },
      { name: 'sitios', essentialColumns: ['id', 'name'] },
      { name: 'notifications', essentialColumns: ['id', 'user_id', 'title', 'message'] }
    ];

    for (const table of coreTables) {
      totalChecks++;
      try {
        const [columns] = await conn.execute(`DESCRIBE ${table.name}`);
        const columnNames = columns.map(col => col.Field);
        
        const missingColumns = table.essentialColumns.filter(col => !columnNames.includes(col));
        const unexpectedColumns = columnNames.filter(col => !table.essentialColumns.includes(col) && !['id', 'created_at', 'updated_at', 'is_active'].includes(col));
        
        if (missingColumns.length === 0) {
          console.log(`✅ Table ${table.name}: All essential columns present`);
          passedChecks++;
        } else {
          console.log(`❌ Table ${table.name}: Missing columns - ${missingColumns.join(', ')}`);
          alignmentIssues.push(`Missing columns in ${table.name}: ${missingColumns.join(', ')}`);
        }
        
        if (unexpectedColumns.length > 0) {
          console.log(`⚠️  Table ${table.name}: Unexpected columns - ${unexpectedColumns.join(', ')}`);
        }
      } catch (error) {
        console.log(`❌ Table ${table.name}: ${error.message}`);
        alignmentIssues.push(`Table ${table.name} check failed: ${error.message}`);
      }
    }

    // Check 2: Verify foreign key relationships
    console.log('\n2. Checking foreign key relationships:');
    totalChecks++;
    try {
      const [constraints] = await conn.execute(`
        SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
        LIMIT 10
      `, [process.env.DB_NAME || 'barangay_management']);

      console.log(`✅ Found ${constraints.length} foreign key constraints`);
      
      // Check critical relationships
      const criticalRelations = [
        { table: 'residents', refTable: 'households', column: 'Household_ID' },
        { table: 'blotter', refTable: 'residents', column: 'complainant_resident_id' },
        { table: 'certificates_log', refTable: 'residents', column: 'resident_id' }
      ];

      for (const relation of criticalRelations) {
        const exists = constraints.some(c => 
          c.TABLE_NAME === relation.table && c.REFERENCED_TABLE_NAME === relation.refTable
        );
        if (exists) {
          console.log(`✅ Relation ${relation.table} → ${relation.refTable} exists`);
        } else {
          console.log(`⚠️  Relation ${relation.table} → ${relation.refTable} may be missing`);
        }
      }
      passedChecks++;
    } catch (error) {
      console.log(`❌ Foreign key check failed: ${error.message}`);
      alignmentIssues.push(`Foreign key check failed: ${error.message}`);
    }

    // Check 3: Verify data consistency
    console.log('\n3. Checking data consistency:');
    totalChecks++;
    try {
      // Check for orphaned records
      const [orphanedResidents] = await conn.execute(`
        SELECT COUNT(*) as count FROM residents r
        LEFT JOIN households h ON r.Household_ID = h.Household_ID
        WHERE r.Household_ID IS NOT NULL AND h.Household_ID IS NULL
      `);
      
      const [orphanedCertificates] = await conn.execute(`
        SELECT COUNT(*) as count FROM certificates_log c
        LEFT JOIN residents r ON c.resident_id = r.Resident_ID
        WHERE r.Resident_ID IS NULL
      `);

      console.log(`✅ Orphaned residents: ${orphanedResidents[0].count}`);
      console.log(`✅ Orphaned certificates: ${orphanedCertificates[0].count}`);
      
      if (orphanedResidents[0].count === 0 && orphanedCertificates[0].count === 0) {
        console.log('✅ Data consistency looks good');
        passedChecks++;
      } else {
        alignmentIssues.push('Data consistency issues found');
      }
    } catch (error) {
      console.log(`❌ Data consistency check failed: ${error.message}`);
      alignmentIssues.push(`Data consistency check failed: ${error.message}`);
    }

    // Check 4: Verify API-Frontend field alignment
    console.log('\n4. Checking API-frontend field alignment:');
    totalChecks++;
    try {
      // Check residents table vs API expectations
      const [residentColumns] = await conn.execute('DESCRIBE residents');
      const apiExpectedFields = [
        'Resident_ID', 'First_Name', 'Last_Name', 'Email', 'Contact_Number',
        'Household_ID', 'Sitio_ID', 'Residency_Status'
      ];
      
      const apiFields = residentColumns.map(col => col.Field);
      const missingApiFields = apiExpectedFields.filter(field => !apiFields.includes(field));
      
      if (missingApiFields.length === 0) {
        console.log('✅ Residents table fields align with API expectations');
        passedChecks++;
      } else {
        console.log(`❌ Residents table missing API fields: ${missingApiFields.join(', ')}`);
        alignmentIssues.push(`Missing API fields: ${missingApiFields.join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ API alignment check failed: ${error.message}`);
      alignmentIssues.push(`API alignment check failed: ${error.message}`);
    }

    await conn.end();

    console.log(`\n📊 SCHEMA ALIGNMENT RESULTS: ${passedChecks}/${totalChecks} checks passed`);
    
    if (alignmentIssues.length === 0) {
      console.log('🎉 DATABASE SCHEMA ALIGNMENT PERFECT!');
    } else {
      console.log(`\n⚠️ ALIGNMENT ISSUES FOUND:`);
      alignmentIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
      
      console.log(`\n📈 SUCCESS RATE: ${Math.round((passedChecks / totalChecks) * 100)}%`);
    }

    return alignmentIssues.length === 0;

  } catch (error) {
    console.log('❌ Schema alignment verification failed:', error.message);
    return false;
  }
}

// Run verification
if (require.main === module) {
  verifyDatabaseSchemaAlignment()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification execution failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyDatabaseSchemaAlignment };