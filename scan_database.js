// Comprehensive database scanner
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: './server/.env' });

async function scanDatabase() {
  let connection;

  try {
    console.log('🔍 Scanning Barangay Management Database\n');

    // Database configuration
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barangay_management'
    };

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // Get all tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📋 Found ${tables.length} tables:\n`);

    for (const tableRow of tables) {
      const tableName = tableRow[Object.keys(tableRow)[0]];
      console.log(`\n📊 Table: ${tableName}`);

      try {
        // Get table description
        const [describe] = await connection.execute(`DESCRIBE ${tableName}`);

        console.log('┌─ Columns:');
        describe.forEach(col => {
          const nullable = col.Null === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.Default ? `DEFAULT '${col.Default}'` : '';
          const extra = col.Extra ? col.Extra : '';
          console.log(`│ ${col.Field} (${col.Type}) ${nullable} ${defaultVal} ${extra}`);
        });

        // Get row count
        const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = countResult[0].count;

        console.log(`└─ Records: ${rowCount} rows`);

        // Special analysis for file-related tables
        if (tableName === 'document_templates' && rowCount > 0) {
          console.log('   └─ 📎 BLOB Analysis:');
          const [blobCheck] = await connection.execute(`SELECT id, file_data IS NOT NULL as has_blob, LENGTH(file_data) as blob_size FROM document_templates LIMIT 5`);
          blobCheck.forEach(row => {
            console.log(`      • Template ${row.id}: ${row.has_blob ? 'Has BLOB data (' + row.blob_size + ' bytes)' : 'No BLOB data'}`);
          });
        }

        if (tableName === 'resident_verification_requests' && rowCount > 0) {
          const [fileCheck] = await connection.execute(`SELECT COUNT(*) as total, SUM(CASE WHEN proof_of_residency_path IS NOT NULL THEN 1 ELSE 0 END) as has_files FROM resident_verification_requests`);
          console.log(`   └─ 📁 Files: ${fileCheck[0].has_files}/${fileCheck[0].total} records have file paths`);
        }

      } catch (tableError) {
        console.log(`└─ ❌ Error analyzing table: ${tableError.message}`);
      }
    }

    console.log('\n🎯 BLOB Storage Analysis:');
    console.log('• document_templates: Already supports BLOB storage');
    console.log('• resident_verification_requests: Currently uses file paths');

    // Check for potential file storage needs
    const [verificationCount] = await connection.execute('SELECT COUNT(*) as count FROM resident_verification_requests');
    const [userCount] = await connection.execute('SELECT COUNT(*) as users FROM users');
    const [residentCount] = await connection.execute('SELECT COUNT(*) as residents FROM residents');

    console.log('\n📈 Data Summary:');
    console.log(`• Users: ${userCount[0].users}`);
    console.log(`• Residents: ${residentCount[0].residents}`);
    console.log(`• Verification Requests: ${verificationCount[0].count}`);

  } catch (error) {
    console.error('❌ Database scan error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

scanDatabase();
