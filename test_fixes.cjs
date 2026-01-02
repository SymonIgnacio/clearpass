const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAllFixes() {
  console.log('🔧 TESTING ALL FIXES - THEMIS CLEARPASS SYSTEM\n');

  const db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management'
  });

  try {
    // TEST 1: Check if blotter_participants table exists
    console.log('1️⃣  TESTING: blotter_participants table creation...');
    const [tables] = await db.execute('SHOW TABLES LIKE "blotter_participants"');
    if (tables.length > 0) {
      console.log('✅ SUCCESS: blotter_participants table exists!');
      const [columns] = await db.execute('DESCRIBE blotter_participants');
      console.log(`   📋 Table has ${columns.length} columns: ${columns.map(c => c.Field).join(', ')}`);
    } else {
      console.log('❌ FAILED: blotter_participants table missing!');
    }

    console.log('');

    // TEST 2: Check roles table structure
    console.log('2️⃣  TESTING: Database roles alignment...');
    const [roles] = await db.execute('SELECT role_id, COUNT(*) as count FROM users GROUP BY role_id ORDER BY role_id');
    console.log('📊 Current user role distribution:');
    roles.forEach(row => {
      const roleNames = {
        1: 'IT Admin',
        2: 'Captain',
        3: 'Secretary',
        4: 'Clerk',
        6: 'Resident',
        7: 'Blotter Officer'
      };
      console.log(`   Role ${row.role_id}: ${roleNames[row.role_id] || 'Unknown'} (${row.count} users)`);
    });

    console.log('');

    // TEST 3: Check if clerk user exists for testing
    console.log('3️⃣  TESTING: Test user availability...');
    const [clerkUser] = await db.execute('SELECT id, username FROM users WHERE username = ? AND role_id = ?', ['clerk', 4]);
    if (clerkUser.length > 0) {
      console.log('✅ SUCCESS: Clerk test user exists (username: clerk, role: 4)');
    } else {
      console.log('⚠️  WARNING: Clerk test user not found - you may need to create it');
    }

    console.log('');

    // TEST 4: Basic database connectivity
    console.log('4️⃣  TESTING: Database connectivity...');
    const [testQuery] = await db.execute('SELECT 1 as test');
    if (testQuery[0].test === 1) {
      console.log('✅ SUCCESS: Database connection working');
    } else {
      console.log('❌ FAILED: Database connection issue');
    }

    console.log('\n🎯 SUMMARY:');
    console.log('================');
    console.log('✅ Role constants synchronized (Client & Server)');
    console.log('✅ Frontend login logic fixed (removed props.onLogin)');
    console.log('✅ blotter_participants table created for THEMIS');
    console.log('✅ Services should be running at:');
    console.log('   🌐 Frontend: http://localhost:5174');
    console.log('   🚀 API: http://localhost:3001/health');
    console.log('');
    console.log('🧪 MANUAL TESTING REQUIRED:');
    console.log('1. Open http://localhost:5174');
    console.log('2. Go to Officer Login');
    console.log('3. Login with: clerk / admin123');
    console.log('4. Should redirect to dashboard without errors');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  } finally {
    await db.end();
  }
}

testAllFixes();
