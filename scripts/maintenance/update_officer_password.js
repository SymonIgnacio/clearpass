const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function updateOfficerPassword() {
  try {
    // Generate correct hash for officer123
    const correctHash = await bcrypt.hash('officer123', 12);
    console.log('Generated hash:', correctHash);

    // Connect to database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'barangay_management'
    });

    // Update officer password
    const [result] = await connection.execute(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [correctHash, 'officer']
    );

    console.log('Update result:', result);

    // Verify the update
    const [rows] = await connection.execute(
      'SELECT username, password_hash FROM users WHERE username = ?',
      ['officer']
    );

    console.log('Updated officer user:', rows[0]);

    await connection.end();
    console.log('Officer password updated successfully!');
  } catch (error) {
    console.error('Error updating officer password:', error);
  }
}

updateOfficerPassword();
