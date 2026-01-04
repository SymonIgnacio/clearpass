-- Missing tables for ClearPass system

-- Announcements table for resident announcements feature
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` varchar(50) DEFAULT 'general',
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `expires_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_active_expires` (`is_active`, `expires_at`),
  KEY `idx_created` (`created_at`),
  KEY `fk_announcements_user` (`created_by`),
  CONSTRAINT `fk_announcements_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Document requests table (if not exists from migrations)
CREATE TABLE IF NOT EXISTS `document_requests` (
  `request_id` varchar(50) NOT NULL,
  `resident_id` varchar(50) NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `status` enum('pending','approved','rejected','completed') DEFAULT 'pending',
  `request_data` json NOT NULL,
  `resident_data` json NOT NULL,
  `approval_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` varchar(50) DEFAULT NULL,
  `valid_until` timestamp NULL DEFAULT NULL,
  `qr_code` text DEFAULT NULL,
  `control_number` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  KEY `idx_resident` (`resident_id`),
  KEY `idx_type` (`document_type`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`),
  KEY `idx_control` (`control_number`),
  CONSTRAINT `fk_doc_req_resident` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`Resident_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- System settings table for admin configuration
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default system settings
INSERT IGNORE INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `description`) VALUES
('barangay_name', 'Barangay Batia', 'string', 'Official barangay name'),
('barangay_address', 'Bocaue, Bulacan', 'string', 'Barangay address'),
('enable_resident_registration', 'true', 'boolean', 'Allow residents to self-register'),
('enable_online_blotter', 'true', 'boolean', 'Allow residents to file blotter online'),
('certificate_fee_clearance', '50', 'number', 'Fee for barangay clearance'),
('certificate_fee_indigency', '0', 'number', 'Fee for certificate of indigency'),
('certificate_fee_residency', '30', 'number', 'Fee for certificate of residency');
