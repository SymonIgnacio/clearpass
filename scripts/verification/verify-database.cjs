require('dotenv').config({ path: '../../server/.env' });
const mysql = require('mysql2/promise');

async function verifyDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  console.log('🔍 THEMIS Database Verification Report\n');

  try {
    // 1. Check users table structure and roles
    console.log('📊 1. USERS TABLE - Role Analysis');
    const [users] = await connection.execute(`
      SELECT id, username, role_id, full_name, is_active 
      FROM users 
      ORDER BY role_id
    `);
    
    const roleDistribution = {};
    users.forEach(u => {
      roleDistribution[u.role_id] = (roleDistribution[u.role_id] || 0) + 1;
    });
    
    console.log('   Role Distribution:', roleDistribution);
    console.log('   Sample users:', users.slice(0, 5));

    // 2. Check residents table structure
    console.log('\n📊 2. RESIDENTS TABLE - Structure Check');
    const [residentCols] = await connection.execute(`
      SHOW COLUMNS FROM residents
    `);
    const hasPasswordHash = residentCols.some(c => c.Field === 'password_hash');
    const hasRoleId = residentCols.some(c => c.Field === 'role_id');
    const hasUsername = residentCols.some(c => c.Field === 'username');
    console.log('   Has password_hash:', hasPasswordHash);
    console.log('   Has role_id:', hasRoleId);
    console.log('   Has username:', hasUsername);

    // 3. Check blotter table
    console.log('\n📊 3. BLOTTER TABLE - Status Values');
    const [blotterStatuses] = await connection.execute(`
      SELECT DISTINCT Status FROM blotter
    `);
    console.log('   Statuses:', blotterStatuses.map(s => s.Status));

    // 4. Check certificates_log table
    console.log('\n📊 4. CERTIFICATES_LOG TABLE - Structure');
    const [certCols] = await connection.execute(`
      SHOW COLUMNS FROM certificates_log
    `);
    console.log('   Key columns:', certCols.filter(c => 
      ['id', 'resident_id', 'certificate_type', 'status', 'control_no'].includes(c.Field)
    ).map(c => c.Field));

    // 5. Check for missing tables
    console.log('\n📊 5. TABLE EXISTENCE CHECK');
    const requiredTables = [
      'users', 'residents', 'blotter', 'certificates_log', 
      'households', 'sitios', 'vulnerabilities', 'certificate_types'
    ];
    
    for (const table of requiredTables) {
      try {
        await connection.execute(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`   ✅ ${table}`);
      } catch (e) {
        console.log(`   ❌ ${table} - MISSING`);
      }
    }

    // 6. Check role_id values in users table
    console.log('\n📊 6. ACTUAL ROLE IDs IN USE');
    const [roleIds] = await connection.execute(`
      SELECT DISTINCT role_id, COUNT(*) as count 
      FROM users 
      GROUP BY role_id 
      ORDER BY role_id
    `);
    console.log('   Role IDs in database:', roleIds);

    // 7. Check indexes
    console.log('\n📊 7. INDEX CHECK');
    const [indexes] = await connection.execute(`
      SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('residents', 'blotter', 'certificates_log', 'users')
      ORDER BY TABLE_NAME, INDEX_NAME
    `, [process.env.DB_NAME]);
    
    const indexByTable = {};
    indexes.forEach(idx => {
      if (!indexByTable[idx.TABLE_NAME]) indexByTable[idx.TABLE_NAME] = [];
      indexByTable[idx.TABLE_NAME].push(`${idx.INDEX_NAME}(${idx.COLUMN_NAME})`);
    });
    console.log('   Indexes by table:', indexByTable);

    // 8. Check users table columns
    console.log('\n📊 8. USERS TABLE - Column Structure');
    const [userCols] = await connection.execute(`SHOW COLUMNS FROM users`);
    console.log('   Columns:', userCols.map(c => c.Field).join(', '));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await connection.end();
  }
}

verifyDatabase();
