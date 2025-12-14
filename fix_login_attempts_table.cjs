const mysql = require('mysql2/promise');

async function fixDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'barangay_management'
    });

    console.log('Connected to database');

    // Check if login_attempts table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'login_attempts'"
    );

    if (tables.length === 0) {
      console.log('Creating login_attempts table...');

      await connection.execute(`
        CREATE TABLE login_attempts (
          id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
          username varchar(50) NOT NULL,
          ip_address varchar(45) DEFAULT NULL,
          success tinyint(1) DEFAULT 1,
          reason varchar(100) DEFAULT NULL,
          created_at timestamp DEFAULT CURRENT_TIMESTAMP,
          KEY idx_username (username),
          KEY idx_ip_address (ip_address),
          KEY idx_success (success),
          KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);

      console.log('✅ login_attempts table created successfully');
    } else {
      console.log('✅ login_attempts table already exists');
    }

    // Check and create resident_signup_requests table if missing
    const [signupTables] = await connection.execute(
      "SHOW TABLES LIKE 'resident_signup_requests'"
    );

    if (signupTables.length === 0) {
      console.log('Creating resident_signup_requests table...');

      await connection.execute(`
        CREATE TABLE resident_signup_requests (
          id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
          request_id varchar(100) NOT NULL UNIQUE,
          resident_id varchar(50) DEFAULT NULL,
          username varchar(50) NOT NULL,
          password_hash varchar(255) NOT NULL,
          full_name varchar(200) NOT NULL,
          email varchar(100) DEFAULT NULL,
          mobile_number varchar(20) DEFAULT NULL,
          proof_of_residency_path varchar(255) DEFAULT NULL,
          proof_type varchar(100) DEFAULT NULL,
          notes text,
          status enum('pending','approved','rejected') DEFAULT 'pending',
          reviewed_by int unsigned DEFAULT NULL,
          reviewed_at timestamp NULL DEFAULT NULL,
          approved_at timestamp NULL DEFAULT NULL,
          submitted_at timestamp DEFAULT CURRENT_TIMESTAMP,
          created_at timestamp DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_status (status),
          KEY idx_username (username),
          KEY idx_resident_id (resident_id),
          KEY idx_submitted_at (submitted_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);

      console.log('✅ resident_signup_requests table created successfully');
    } else {
      console.log('✅ resident_signup_requests table already exists');
    }

    // Check and create resident_verification_requests table if missing
    const [verificationTables] = await connection.execute(
      "SHOW TABLES LIKE 'resident_verification_requests'"
    );

    if (verificationTables.length === 0) {
      console.log('Creating resident_verification_requests table...');

      await connection.execute(`
        CREATE TABLE resident_verification_requests (
          id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
          request_id varchar(100) NOT NULL UNIQUE,
          user_id int unsigned NOT NULL,
          proof_of_residency_path varchar(255) DEFAULT NULL,
          proof_type varchar(100) DEFAULT NULL,
          status enum('draft','pending','approved','rejected') DEFAULT 'draft',
          notes text,
          reviewed_by int unsigned DEFAULT NULL,
          reviewed_at timestamp NULL DEFAULT NULL,
          submitted_at timestamp NULL DEFAULT NULL,
          created_at timestamp DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (reviewed_by) REFERENCES users(id),
          KEY idx_status (status),
          KEY idx_user_id (user_id),
          KEY idx_submitted_at (submitted_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);

      console.log('✅ resident_verification_requests table created successfully');
    } else {
      console.log('✅ resident_verification_requests table already exists');
    }

    console.log('✅ Database fix completed successfully');

  } catch (error) {
    console.error('❌ Database fix failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixDatabase();
