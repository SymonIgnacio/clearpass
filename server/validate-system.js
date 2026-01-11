const mysql = require('mysql2/promise');
require('dotenv').config();

const REQUIRED_TABLES = [
  'users', 'roles', 'residents', 'households', 'sitios',
  'blotter', 'certificates_log', 'clearance_requests', 'document_requests',
  'notifications', 'user_notifications', 'announcements',
  'login_attempts', 'audit_logs', 'system_assets'
];

const REQUIRED_ROLES = [
  { id: 1, name: 'IT Admin' },
  { id: 2, name: 'Captain' },
  { id: 3, name: 'Secretary' },
  { id: 4, name: 'Clerk' },
  { id: 6, name: 'Blotter Officer' },
  { id: 12, name: 'Resident' }
];

async function validateSystem() {
  console.log('🔍 Starting ClearPass System Validation...\n');
  
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };

  let connection;
  let errors = [];
  let warnings = [];

  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    connection = await mysql.createConnection(config);
    console.log('✅ Database connection successful\n');

    // Check required tables
    console.log('📋 Checking required tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    const existingTables = tables.map(t => Object.values(t)[0]);
    
    for (const table of REQUIRED_TABLES) {
      if (existingTables.includes(table)) {
        console.log(`  ✅ ${table}`);
      } else {
        errors.push(`Missing table: ${table}`);
        console.log(`  ❌ ${table} - MISSING`);
      }
    }
    console.log('');

    // Check roles
    console.log('👥 Checking required roles...');
    const [roles] = await connection.execute('SELECT id, role_name FROM roles');
    
    for (const reqRole of REQUIRED_ROLES) {
      const exists = roles.find(r => r.id === reqRole.id);
      if (exists) {
        console.log(`  ✅ ${reqRole.name} (ID: ${reqRole.id})`);
      } else {
        errors.push(`Missing role: ${reqRole.name} (ID: ${reqRole.id})`);
        console.log(`  ❌ ${reqRole.name} (ID: ${reqRole.id}) - MISSING`);
      }
    }
    console.log('');

    // Check environment variables
    console.log('⚙️  Checking environment variables...');
    const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'SERVER_PORT'];
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`  ✅ ${envVar}`);
      } else {
        errors.push(`Missing environment variable: ${envVar}`);
        console.log(`  ❌ ${envVar} - MISSING`);
      }
    }
    console.log('');

    // Check for admin users
    console.log('🔐 Checking admin users...');
    const [admins] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = 1');
    if (admins[0].count > 0) {
      console.log(`  ✅ ${admins[0].count} admin user(s) found`);
    } else {
      warnings.push('No admin users found - you may need to create one');
      console.log(`  ⚠️  No admin users found`);
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ SYSTEM VALIDATION PASSED');
      console.log('   All requirements met. System is ready to run.');
    } else {
      if (errors.length > 0) {
        console.log('❌ SYSTEM VALIDATION FAILED');
        console.log('\nCritical Errors:');
        errors.forEach(err => console.log(`  • ${err}`));
      }
      if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(warn => console.log(`  • ${warn}`));
      }
    }
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(errors.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

validateSystem();
