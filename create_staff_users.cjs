const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function createStaffUsers() {
  let db;

  try {
    console.log('🔄 Connecting to database...');
    db = await mysql.createPool(dbConfig);
    console.log('✅ Database connected successfully');

    // Staff user data
    const staffUsers = [
      {
        username: 'superadmin',
        full_name: 'Super Administrator',
        email: 'admin@barangay.gov.ph',
        role: 'admin'
      },
      {
        username: 'captain01',
        full_name: 'Barangay Captain',
        email: 'captain@barangay.gov.ph',
        role: 'captain'
      },
      {
        username: 'secretary01',
        full_name: 'Barangay Secretary',
        email: 'secretary@barangay.gov.ph',
        role: 'secretary'
      },
      {
        username: 'clerk01',
        full_name: 'Barangay Clerk',
        email: 'clerk@barangay.gov.ph',
        role: 'clerk'
      }
    ];

    // Hash the password 'admin123'
    console.log('🔐 Hashing password...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash('admin123', saltRounds);
    console.log('✅ Password hashed successfully');

    // Delete existing staff users
    console.log('🗑️  Deleting existing staff users...');
    await db.execute(
      'DELETE FROM users WHERE username IN (?, ?, ?, ?)',
      ['superadmin', 'captain01', 'secretary01', 'clerk01']
    );
    console.log('✅ Existing staff users deleted');

    // Create new staff users
    console.log('👤 Creating new staff users...');
    for (const user of staffUsers) {
      const [result] = await db.execute(
        `INSERT INTO users (
          username, password_hash, full_name, email, role, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user.username,
          passwordHash,
          user.full_name,
          user.email,
          user.role,
          true, // is_active
          new Date() // created_at
        ]
      );

      console.log(`✅ Created user: ${user.username} (ID: ${result.insertId})`);
    }

    console.log('\n🎉 All staff users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    staffUsers.forEach(user => {
      console.log(`${user.username.padEnd(12)} | admin123 | ${user.full_name}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the password "admin123" before deploying to production!');

  } catch (error) {
    console.error('❌ Error creating staff users:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    if (db) {
      await db.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  createStaffUsers()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createStaffUsers };
