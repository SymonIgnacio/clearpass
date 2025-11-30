-- Create users for testing authentication
-- Run this in phpMyAdmin or MySQL command line

USE barangay_management;

-- Insert test users with bcrypt hashed passwords
INSERT INTO users (username, password_hash, role, email, full_name, is_active) VALUES
('superadmin', '$2b$10$8K3VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ', 'admin', 'superadmin@barangay.gov.ph', 'Super Administrator', 1),
('captain', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'captain', 'captain@barangay.gov.ph', 'Barangay Captain', 1),
('secretary', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'secretary', 'secretary@barangay.gov.ph', 'Barangay Secretary', 1),
('clerk', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'clerk', 'clerk@barangay.gov.ph', 'Barangay Clerk', 1);

-- Show the users that were created
SELECT id, username, role, full_name FROM users;
