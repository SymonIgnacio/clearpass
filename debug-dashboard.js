const db = require('./server/database');

async function debugDashboard() {
  try {
    console.log('🔍 Debugging Dashboard Data...\n');
    
    // Test database connection
    console.log('1. Testing database connection...');
    const [testResult] = await db.execute('SELECT 1 as test');
    console.log('✅ Database connected:', testResult);
    
    // Check residents table
    console.log('\n2. Checking residents table...');
    const [residents] = await db.execute('SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"');
    console.log('📊 Active residents:', residents[0].total);
    
    // Check vulnerabilities table
    console.log('\n3. Checking vulnerabilities table...');
    const [seniors] = await db.execute('SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_Senior = 1');
    const [pwd] = await db.execute('SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_PWD = 1');
    const [singleParents] = await db.execute('SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_Solo_Parent = 1');
    console.log('👴 Seniors:', seniors[0].total);
    console.log('♿ PWD:', pwd[0].total);
    console.log('👩‍👧‍👦 Single Parents:', singleParents[0].total);
    
    // Check blotter table
    console.log('\n4. Checking blotter table...');
    const [blotter] = await db.execute('SELECT COUNT(*) as total FROM blotter WHERE Status IN ("Pending", "Ongoing")');
    console.log('⚖️ Active blotter cases:', blotter[0].total);
    
    // Check certificates table
    console.log('\n5. Checking certificates table...');
    const [certificates] = await db.execute('SELECT COUNT(*) as total FROM certificates_log');
    console.log('📄 Total certificates:', certificates[0].total);
    
    // Test the exact dashboard query
    console.log('\n6. Testing dashboard endpoint query...');
    const [dashResidents] = await db.execute('SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"');
    const [dashBlotter] = await db.execute('SELECT COUNT(*) as total FROM blotter WHERE Status IN ("Pending", "Ongoing")');
    const [dashCertificates] = await db.execute('SELECT COUNT(*) as total FROM certificates_log');
    const [dashSeniors] = await db.execute('SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_Senior = 1');
    const [dashPwd] = await db.execute('SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_PWD = 1');
    const [dashSingleParents] = await db.execute('SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_Solo_Parent = 1');
    
    const dashboardData = {
      overall: {
        total_residents: dashResidents[0].total,
        total_seniors: dashSeniors[0].total,
        total_pwd: dashPwd[0].total,
        total_single_parents: dashSingleParents[0].total
      },
      residents: dashResidents[0].total,
      active_blotter: dashBlotter[0].total,
      certificates: dashCertificates[0].total
    };
    
    console.log('📊 Dashboard data structure:', JSON.stringify(dashboardData, null, 2));
    
    // Check if tables exist
    console.log('\n7. Checking table existence...');
    const [tables] = await db.execute('SHOW TABLES');
    console.log('📋 Available tables:', tables.map(t => Object.values(t)[0]));
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    process.exit(0);
  }
}

debugDashboard();