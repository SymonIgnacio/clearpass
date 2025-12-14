-- Create residency_verifications table to match server expectations
USE barangay_management;

CREATE TABLE IF NOT EXISTS residency_verifications (
  id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id int unsigned NOT NULL,
  resident_id varchar(50) DEFAULT NULL, -- Can be temp resident ID initially
  firebase_uid varchar(128) NOT NULL,
  proof_type varchar(50) DEFAULT NULL,
  proof_document_path varchar(500) DEFAULT NULL,
  notes text,
  status enum('pending', 'approved', 'rejected', 'archived') DEFAULT 'pending',
  officer_notes text,
  review_reason text,
  submitted_at timestamp DEFAULT CURRENT_TIMESTAMP,
  reviewed_at timestamp NULL DEFAULT NULL,
  reviewed_by int unsigned DEFAULT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes for performance
  INDEX idx_user_id (user_id),
  INDEX idx_firebase_uid (firebase_uid),
  INDEX idx_status (status),
  INDEX idx_submitted_at (submitted_at),
  INDEX idx_resident_id (resident_id),

  -- Foreign key constraints
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Show table structure for verification
DESCRIBE residency_verifications;
