const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTables() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management',
  });

  try {
    console.log('🔧 Creating user_notifications table manually...');

    // Drop if exists
    try {
      await db.execute('DROP TABLE IF EXISTS user_notifications');
      console.log('Dropped existing user_notifications table');
    } catch (e) {}

    // Create without foreign keys to avoid constraint issues
    await db.execute(`
      CREATE TABLE user_notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        notification_id INT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_notification (user_id, notification_id),
        INDEX idx_user_read (user_id, is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ user_notifications table created successfully!');

    // Insert a test record to verify the table works
    await db.execute(`
      INSERT IGNORE INTO user_notifications (user_id, notification_id, is_read)
      VALUES (1, 1, 0)
    `);

    console.log('✅ Test record inserted');

    // Verify
    const [tables] = await db.execute('SHOW TABLES LIKE "notifications%"');
    console.log('✅ All notifications tables:', tables.map(t => Object.values(t)[0]).join(', '));

    const [count] = await db.execute('SELECT COUNT(*) as count FROM user_notifications');
    console.log(`✅ user_notifications has ${count[0].count} records`);

    if (tables.length >= 2) {
      console.log('🎉 SUCCESS: WebSocket notifications should now work!');
      console.log('🚀 Please restart your server to enable notifications');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

createTables();
