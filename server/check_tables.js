const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management',
  });

  try {
    console.log('Checking for notifications tables...');
    const [tables] = await db.execute('SHOW TABLES LIKE "notifications%"');
    console.log(
      'Found tables with "notifications%" pattern:',
      tables.map(t => Object.values(t)[0])
    );

    // Also check for user_notifications specifically
    const [userNotifTables] = await db.execute('SHOW TABLES LIKE "user_notifications"');
    console.log('Found user_notifications table:', userNotifTables.length > 0);

    const totalTables = tables.length + (userNotifTables.length > 0 ? 1 : 0);

    if (totalTables >= 2) {
      console.log('✅ SUCCESS: Both notifications tables exist!');

      // Test if we can query them
      const [notifications] = await db.execute('SELECT COUNT(*) as count FROM notifications');
      const [userNotifications] = await db.execute(
        'SELECT COUNT(*) as count FROM user_notifications'
      );

      console.log(`Notifications: ${notifications[0].count} records`);
      console.log(`User notifications: ${userNotifications[0].count} records`);

      console.log('🎉 WebSocket notifications should now work!');
    } else {
      console.log('❌ Still missing tables');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.end();
  }
}

checkTables();
