const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../server/.env') });
const mysql = require('mysql2/promise');

async function comprehensiveAudit() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  console.log('🔍 COMPREHENSIVE SYSTEMS AUDIT\n');
  console.log('=' .repeat(80));

  try {
    // 1. Check all tables and their structures
    console.log('\n📊 1. DATABASE SCHEMA AUDIT\n');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`   Total tables: ${tables.length}`);
    
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [columns] = await connection.execute(`SHOW COLUMNS FROM ${tableName}`);
      const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`   ✓ ${tableName} (${columns.length} columns, ${count[0].count} rows)`);
    }

    // 2. Check for missing foreign key relationships
    console.log('\n🔗 2. FOREIGN KEY INTEGRITY CHECK\n');
    const [fkCheck] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME]);
    console.log(`   Foreign keys found: ${fkCheck.length}`);
    fkCheck.forEach(fk => {
      console.log(`   ✓ ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });

    // 3. Check for orphaned records
    console.log('\n🔍 3. ORPHANED RECORDS CHECK\n');
    
    // Check certificates without residents
    const [orphanCerts] = await connection.execute(`
      SELECT COUNT(*) as count FROM certificates_log c
      LEFT JOIN residents r ON c.resident_id = r.Resident_ID
      WHERE r.Resident_ID IS NULL
    `);
    console.log(`   Certificates without residents: ${orphanCerts[0].count}`);

    // Check blotter without respondents
    const [orphanBlotter] = await connection.execute(`
      SELECT COUNT(*) as count FROM blotter b
      WHERE b.respondent_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM residents r WHERE r.Resident_ID = b.respondent_id)
    `);
    console.log(`   Blotter cases with invalid respondent_id: ${orphanBlotter[0].count}`);

    // 4. Check for data inconsistencies
    console.log('\n⚠️  4. DATA CONSISTENCY CHECK\n');
    
    // Users without valid role_id
    const [invalidRoles] = await connection.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE role_id NOT IN (2, 3, 4, 5, 6, 12)
    `);
    console.log(`   Users with invalid role_id: ${invalidRoles[0].count}`);

    // Residents with empty required fields
    const [incompleteResidents] = await connection.execute(`
      SELECT COUNT(*) as count FROM residents 
      WHERE First_Name IS NULL OR First_Name = '' 
      OR Last_Name IS NULL OR Last_Name = ''
    `);
    console.log(`   Residents with missing names: ${incompleteResidents[0].count}`);

    // 5. Check authentication setup
    console.log('\n🔐 5. AUTHENTICATION AUDIT\n');
    
    const [usersWithPasswords] = await connection.execute(`
      SELECT COUNT(*) as count FROM users WHERE password_hash IS NOT NULL
    `);
    console.log(`   Users with passwords: ${usersWithPasswords[0].count}`);

    const [residentsWithPasswords] = await connection.execute(`
      SELECT COUNT(*) as count FROM residents WHERE password_hash IS NOT NULL
    `);
    console.log(`   Residents with passwords: ${residentsWithPasswords[0].count}`);

    // 6. Check for duplicate usernames
    console.log('\n👥 6. DUPLICATE CHECK\n');
    
    const [dupUsers] = await connection.execute(`
      SELECT username, COUNT(*) as count FROM users 
      GROUP BY username HAVING count > 1
    `);
    console.log(`   Duplicate usernames in users: ${dupUsers.length}`);

    const [dupResidents] = await connection.execute(`
      SELECT username, COUNT(*) as count FROM residents 
      WHERE username IS NOT NULL
      GROUP BY username HAVING count > 1
    `);
    console.log(`   Duplicate usernames in residents: ${dupResidents.length}`);

    // 7. Check certificate types
    console.log('\n📜 7. CERTIFICATE TYPES CHECK\n');
    const [certTypes] = await connection.execute('SELECT * FROM certificate_types WHERE is_active = true');
    console.log(`   Active certificate types: ${certTypes.length}`);
    certTypes.forEach(ct => {
      console.log(`   ✓ ${ct.name} (${ct.validity_days} days validity)`);
    });

    // 8. Check blotter status values
    console.log('\n⚖️  8. BLOTTER STATUS ANALYSIS\n');
    const [statusDist] = await connection.execute(`
      SELECT Status, COUNT(*) as count FROM blotter 
      GROUP BY Status ORDER BY count DESC
    `);
    statusDist.forEach(s => {
      console.log(`   ${s.Status || '(empty)'}: ${s.count} cases`);
    });

    // 9. Check for missing indexes on critical columns
    console.log('\n📇 9. INDEX COVERAGE CHECK\n');
    const criticalColumns = [
      { table: 'users', column: 'username' },
      { table: 'users', column: 'role_id' },
      { table: 'residents', column: 'Resident_ID' },
      { table: 'blotter', column: 'respondent_id' },
      { table: 'certificates_log', column: 'resident_id' }
    ];

    for (const col of criticalColumns) {
      const [indexes] = await connection.execute(`
        SHOW INDEX FROM ${col.table} WHERE Column_name = ?
      `, [col.column]);
      console.log(`   ${col.table}.${col.column}: ${indexes.length > 0 ? '✓ Indexed' : '❌ NOT INDEXED'}`);
    }

    // 10. Performance metrics
    console.log('\n⚡ 10. PERFORMANCE METRICS\n');
    const [tableStats] = await connection.execute(`
      SELECT 
        table_name,
        table_rows,
        ROUND(data_length / 1024 / 1024, 2) as data_mb,
        ROUND(index_length / 1024 / 1024, 2) as index_mb
      FROM information_schema.tables
      WHERE table_schema = ?
      ORDER BY data_length DESC
    `, [process.env.DB_NAME]);
    
    tableStats.forEach(stat => {
      console.log(`   ${stat.table_name}: ${stat.table_rows} rows, ${stat.data_mb}MB data, ${stat.index_mb}MB indexes`);
    });

  } catch (error) {
    console.error('❌ Audit Error:', error.message);
  } finally {
    await connection.end();
  }
}

comprehensiveAudit();
