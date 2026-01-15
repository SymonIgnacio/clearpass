const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function healthCheck() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║       ClearPass System Health Check                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const results = {
    database: false,
    tables: false,
    roles: false,
    routes: false,
    env: false
  };

  try {
    // 1. Database Connection
    console.log('📊 Database Connection...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('   ✅ Connected to database: ' + process.env.DB_NAME);
    results.database = true;

    // 2. Check Tables
    console.log('\n📋 Required Tables...');
    const requiredTables = [
      'users', 'roles', 'residents', 'households', 'blotter',
      'certificates_log', 'clearance_requests', 'document_requests', 'notifications',
      'user_notifications', 'announcements', 'login_attempts', 'audit_logs', 'system_assets'
    ];
    
    const [tables] = await connection.execute('SHOW TABLES');
    const existingTables = tables.map(t => Object.values(t)[0]);
    
    let allTablesExist = true;
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING`);
        allTablesExist = false;
      }
    }
    results.tables = allTablesExist;

    // 3. Check Roles
    console.log('\n👥 System Roles...');
    const [roles] = await connection.execute('SELECT id, role_name FROM roles ORDER BY id');
    const requiredRoles = [
      { id: 1, name: 'IT Admin' },
      { id: 2, name: 'Captain' },
      { id: 3, name: 'Secretary' },
      { id: 4, name: 'Clerk' },
      { id: 6, name: 'Blotter Officer' },
      { id: 12, name: 'Resident' }
    ];
    
    let allRolesExist = true;
    for (const reqRole of requiredRoles) {
      const exists = roles.find(r => r.id === reqRole.id);
      if (exists) {
        console.log(`   ✅ ${reqRole.name} (ID: ${reqRole.id})`);
      } else {
        console.log(`   ❌ ${reqRole.name} (ID: ${reqRole.id}) - MISSING`);
        allRolesExist = false;
      }
    }
    results.roles = allRolesExist;

    // 4. Check Routes
    console.log('\n🛣️  API Routes...');
    const routeFiles = [
      'residentRoutes.js',
      'blotterRoutes.js',
      'certificateRoutes.js',
      'documentRoutes.js',
      'userRoutes.js',
      'adminRoutes.js',
      'notificationRoutes.js',
      'announcementRoutes.js'
    ];
    
    let allRoutesExist = true;
    for (const file of routeFiles) {
      const filePath = path.join(__dirname, 'routes', file);
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}`);
      } else {
        console.log(`   ❌ ${file} - MISSING`);
        allRoutesExist = false;
      }
    }
    results.routes = allRoutesExist;

    // 5. Environment Variables
    console.log('\n⚙️  Environment Variables...');
    const requiredEnv = [
      'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
      'JWT_SECRET', 'SERVER_PORT'
    ];
    
    let allEnvExist = true;
    for (const envVar of requiredEnv) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar}`);
      } else {
        console.log(`   ❌ ${envVar} - MISSING`);
        allEnvExist = false;
      }
    }
    results.env = allEnvExist;

    // 6. User Statistics
    console.log('\n📊 System Statistics...');
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [residentCount] = await connection.execute('SELECT COUNT(*) as count FROM residents');
    const [blotterCount] = await connection.execute('SELECT COUNT(*) as count FROM blotter');
    const [certCount] = await connection.execute('SELECT COUNT(*) as count FROM certificates_log');
    
    console.log(`   👤 Users: ${userCount[0].count}`);
    console.log(`   🏠 Residents: ${residentCount[0].count}`);
    console.log(`   📋 Blotter Cases: ${blotterCount[0].count}`);
    console.log(`   📄 Certificates: ${certCount[0].count}`);

    await connection.end();

    // Final Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    const allPassed = Object.values(results).every(v => v === true);
    if (allPassed) {
      console.log('║  ✅ SYSTEM HEALTH: EXCELLENT                          ║');
      console.log('║  All components are operational                        ║');
      console.log('║  Server is ready to start                              ║');
    } else {
      console.log('║  ⚠️  SYSTEM HEALTH: NEEDS ATTENTION                   ║');
      console.log('║  Some components require configuration                 ║');
      if (!results.database) console.log('║  - Database connection failed                          ║');
      if (!results.tables) console.log('║  - Missing required tables                             ║');
      if (!results.roles) console.log('║  - Missing required roles                              ║');
      if (!results.routes) console.log('║  - Missing route files                                 ║');
      if (!results.env) console.log('║  - Missing environment variables                       ║');
    }
    console.log('╚════════════════════════════════════════════════════════╝\n');

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ❌ SYSTEM HEALTH: CRITICAL ERROR                     ║');
    console.log('║  ' + error.message.padEnd(54) + '║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    process.exit(1);
  }
}

healthCheck();
