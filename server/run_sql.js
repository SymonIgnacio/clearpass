const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSQL() {
  console.log('🔧 Database config check:');
  console.log('   HOST:', process.env.DB_HOST || 'localhost');
  console.log('   USER:', process.env.DB_USER || 'root');
  console.log('   DB:', process.env.DB_NAME || 'barangay_management');

  const db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management',
  });

  try {
    console.log('🔗 Testing database connection...');
    await db.execute('SELECT 1');
    console.log('✅ Database connection successful');

    console.log('📋 Checking existing tables...');
    const [existingTables] = await db.execute('SHOW TABLES');
    console.log('Existing tables:', existingTables.map(t => Object.values(t)[0]).join(', '));

    console.log('🏗️ Creating notifications table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
        data JSON NULL,
        is_system TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type_priority (type, priority),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Notifications table created');

    console.log('🏗️ Creating user_notifications table (without foreign keys first)...');

    // First, try to drop the table if it exists to avoid constraint issues
    try {
      await db.execute('DROP TABLE IF EXISTS user_notifications');
      console.log('Dropped existing user_notifications table');
    } catch (dropError) {
      console.log('No existing table to drop');
    }

    // Create table without foreign keys initially
    await db.execute(`
      CREATE TABLE user_notifications (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        notification_id INT UNSIGNED NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_notification (user_id, notification_id),
        INDEX idx_user_read (user_id, is_read),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ User notifications table created');

    console.log('🔗 Attempting to add foreign key constraints...');

    // Now try to add foreign keys one by one
    try {
      // Check if users table exists and has the right structure
      const [userTables] = await db.execute('DESCRIBE users');
      const hasIdColumn = userTables.some(col => col.Field === 'id');
      console.log('Users table has id column:', hasIdColumn);

      if (hasIdColumn) {
        await db.execute(`
          ALTER TABLE user_notifications
          ADD CONSTRAINT fk_user_notifications_user_id
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        `);
        console.log('✅ User foreign key added');
      } else {
        console.log('⚠️ Users table structure issue - skipping user foreign key');
      }
    } catch (fkError) {
      console.log('⚠️ Could not add user foreign key:', fkError.message);
    }

    try {
      await db.execute(`
        ALTER TABLE user_notifications
        ADD CONSTRAINT fk_user_notifications_notification_id
        FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE CASCADE
      `);
      console.log('✅ Notification foreign key added');
    } catch (fkError) {
      console.log('⚠️ Could not add notification foreign key:', fkError.message);
    }

    console.log('📝 Inserting sample notification...');
    await db.execute(`
      INSERT IGNORE INTO notifications (type, title, message, priority, is_system)
      VALUES ('system', 'System Initialized', 'Barangay Management System is now operational', 'normal', 1)
    `);
    console.log('✅ Sample notification inserted');

    console.log('🔍 Verifying tables...');
    const [tables] = await db.execute('SHOW TABLES LIKE "notifications%"');
    console.log('✅ Found notifications tables:', tables.map(t => Object.values(t)[0]).join(', '));

    if (tables.length >= 2) {
      console.log('🎉 SUCCESS: All notifications tables created and ready!');
      console.log('🚀 WebSocket notifications should now work without errors');
    } else {
      console.log('❌ ERROR: Some tables are still missing');
    }
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('❌ Full error:', error);
  } finally {
    await db.end();
  }
}

runSQL();
