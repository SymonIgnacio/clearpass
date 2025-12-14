USE barangay_management;

CREATE TABLE IF NOT EXISTS resident_verification_requests (
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
  KEY idx_status (status),
  KEY idx_user_id (user_id),
  KEY idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
