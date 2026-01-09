#!/usr/bin/env node

const { ROLES, ROLE_NAMES } = require('./server/config/roles');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testRoleAlignment() {
  console.log('🔍 Testing ClearPass Role System Alignment...\n');

  // Test 1: Verify ROLES constant
  console.log('📋 Code ROLES Constant:');
  Object.entries(ROLES).forEach(([name, id]) => {
    console.log(`  ${name}: ${id} (${ROLE_NAMES[id]})`);
  });

  // Test 2: Verify database roles
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barangay_management',
    });

    console.log('\n🗄️  Database Roles Table:');
    const [roles] = await connection.execute('SELECT id, role_name FROM roles ORDER BY id');
    roles.forEach(role => {
      console.log(`  ${role.id}: ${role.role_name}`);
    });

    console.log('\n👥 Database Users Table:');
    const [users] = await connection.execute('SELECT id, username, role FROM users ORDER BY role');
    users.forEach(user => {
      const roleName = ROLE_NAMES[user.role] || 'Unknown';
      console.log(`  ${user.username}: Role ${user.role} (${roleName})`);
    });

    // Test 3: Verify alignment
    console.log('\n✅ Alignment Check:');
    let aligned = true;
    for (const role of roles) {
      if (ROLE_NAMES[role.id] !== role.role_name) {
        console.log(`  ❌ Mismatch: Code says ${ROLE_NAMES[role.id]}, DB says ${role.role_name}`);
        aligned = false;
      } else {
        console.log(`  ✅ Role ${role.id}: ${role.role_name} - ALIGNED`);
      }
    }

    if (aligned) {
      console.log('\n🎉 SUCCESS: Role system is fully aligned!');
    } else {
      console.log('\n⚠️  WARNING: Role system has misalignments!');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  }
}

testRoleAlignment().catch(console.error);