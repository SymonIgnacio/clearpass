-- Create notifications tables manually
-- This script creates the missing notifications and user_notifications tables

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `type` varchar(50) NOT NULL DEFAULT 'info',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `priority` varchar(20) NOT NULL DEFAULT 'normal',
  `data` json NULL,
  `is_system` tinyint(1) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type_priority` (`type`, `priority`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_notifications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int unsigned NOT NULL,
  `notification_id` int unsigned NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_notification` (`user_id`, `notification_id`),
  INDEX `idx_user_read` (`user_id`, `is_read`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_user_notifications_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_notifications_notification_id` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert a sample notification to test
INSERT IGNORE INTO `notifications` (`type`, `title`, `message`, `priority`, `is_system`) VALUES
('system', 'System Initialized', 'Barangay Management System is now operational', 'normal', 1);
