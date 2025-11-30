-- Simple test users for immediate testing
-- Run this in phpMyAdmin SQL tab

USE barangay_management;

-- Clear existing users
DELETE FROM users;

-- Insert simple test users (plain passwords for testing)
INSERT INTO users (username, password_hash, role, email, full_name, is_active) VALUES
('captain', 'captain', 'captain', 'captain@barangay.gov.ph', 'Barangay Captain', 1),
('secretary', 'secretary', 'secretary', 'secretary@barangay.gov.ph', 'Barangay Secretary', 1),
('clerk', 'clerk', 'clerk', 'clerk@barangay.gov.ph', 'Barangay Clerk', 1),
('superadmin', 'superadmin123', 'admin', 'superadmin@barangay.gov.ph', 'Super Administrator', 1);

-- Verify users were added
SELECT id, username, role, full_name FROM users;
