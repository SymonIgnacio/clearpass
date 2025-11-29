-- BMWs Database Setup - Simple SQL Script
-- Run this in phpMyAdmin or MySQL command line

-- Create database
CREATE DATABASE IF NOT EXISTS bmw_barangay_batia;
USE bmw_barangay_batia;

-- Table: Sitios
CREATE TABLE sitios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sitios data
INSERT INTO sitios (name, description) VALUES
('Batia Proper', 'Main residential area'),
('Northville 5', 'Northern residential district'),
('St. Martha', 'Eastern residential area'),
('AFP/PNP', 'Military/Police housing area');

-- Table: Residents
CREATE TABLE residents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    dob DATE,
    age INT,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    address TEXT NOT NULL,
    sitio_id INT NOT NULL,
    mobile_number VARCHAR(20),
    employment_status VARCHAR(100),
    income_estimate DECIMAL(10,2),
    is_senior BOOLEAN DEFAULT FALSE,
    is_pwd BOOLEAN DEFAULT FALSE,
    is_single_parent BOOLEAN DEFAULT FALSE,
    is_4ps BOOLEAN DEFAULT FALSE,
    voter_status VARCHAR(50),
    photo_url VARCHAR(255),
    qr_identity_hash VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sitio_id) REFERENCES sitios(id)
);

-- Table: Officials
CREATE TABLE officials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    position ENUM('Captain', 'Secretary', 'Clerk') NOT NULL,
    digital_signature_url VARCHAR(255),
    role_access_level ENUM('Full', 'Limited', 'Basic') DEFAULT 'Basic',
    contact_number VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'captain', 'secretary', 'clerk', 'tanod', 'resident') NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(200),
    contact_number VARCHAR(20),
    official_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (official_id) REFERENCES officials(id)
);

-- Table: Blotter
CREATE TABLE blotter (
    case_id VARCHAR(50) PRIMARY KEY,
    complainant_name VARCHAR(200) NOT NULL,
    respondent_id INT,
    incident_type VARCHAR(100) NOT NULL,
    incident_location VARCHAR(255),
    sitio_id INT,
    date_time DATETIME NOT NULL,
    status ENUM('Pending', 'Resolved', 'Forwarded to Lupon', 'Dismissed') DEFAULT 'Pending',
    confidentiality_level ENUM('Public', 'Confidential', 'Restricted') DEFAULT 'Public',
    reported_by VARCHAR(100),
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (respondent_id) REFERENCES residents(id),
    FOREIGN KEY (sitio_id) REFERENCES sitios(id)
);

-- Table: Certificates_Log
CREATE TABLE certificates_log (
    control_no VARCHAR(50) PRIMARY KEY,
    resident_id INT NOT NULL,
    certificate_type VARCHAR(100) NOT NULL,
    purpose TEXT,
    date_issued DATE NOT NULL,
    signatory_captain VARCHAR(255),
    signatory_secretary VARCHAR(255),
    qr_validation_string VARCHAR(255) UNIQUE,
    status ENUM('Paid', 'Released', 'Cancelled') DEFAULT 'Paid',
    fee_amount DECIMAL(8,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id)
);

-- Insert sample data
INSERT INTO officials (name, position, role_access_level, contact_number, email) VALUES
('Juan Dela Cruz', 'Captain', 'Full', '09123456789', 'captain@barangay-batia.gov.ph'),
('Maria Santos', 'Secretary', 'Full', '09123456790', 'secretary@barangay-batia.gov.ph'),
('Pedro Reyes', 'Clerk', 'Limited', '09123456791', 'clerk@barangay-batia.gov.ph');

INSERT INTO users (username, password_hash, role, email, full_name, official_id) VALUES
('captain', '$2b$10$8K3VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ', 'captain', 'captain@barangay-batia.gov.ph', 'Juan Dela Cruz', 1),
('secretary', '$2b$10$8K3VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ', 'secretary', 'secretary@barangay-batia.gov.ph', 'Maria Santos', 2),
('clerk', '$2b$10$8K3VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ', 'clerk', 'clerk@barangay-batia.gov.ph', 'Pedro Reyes', 3);

INSERT INTO residents (
    first_name, last_name, middle_name, dob, age, gender, address, sitio_id,
    mobile_number, employment_status, income_estimate, is_senior, is_pwd,
    is_single_parent, voter_status
) VALUES
('Jose', 'Rizal', 'Protacio', '1990-06-19', 34, 'Male', 'Block 1, Lot 1, Batia Proper', 1,
 '09123456792', 'Teacher', 25000.00, FALSE, FALSE, FALSE, 'Registered'),
('Maria', 'Clara', 'Santos', '1985-08-15', 39, 'Female', 'Block 2, Lot 3, Batia Proper', 1,
 '09123456793', 'Nurse', 30000.00, FALSE, FALSE, TRUE, 'Registered'),
('Antonio', 'Luna', 'Heroes', '1955-10-29', 69, 'Male', 'Block 3, Lot 5, Northville 5', 2,
 '09123456794', 'Retired', 8000.00, TRUE, FALSE, FALSE, 'Senior Citizen'),
('Gabriela', 'Silang', 'Revolutionary', '1995-03-19', 29, 'Female', 'Block 1, Lot 2, St. Martha', 3,
 '09123456795', 'Business Owner', 45000.00, FALSE, FALSE, FALSE, 'Registered');

INSERT INTO blotter (
    case_id, complainant_name, respondent_id, incident_type, incident_location,
    sitio_id, date_time, status, reported_by
) VALUES
('CASE-2024-001', 'Barangay Official', 1, 'Noise Complaint', 'Block 1, Lot 1',
 1, '2024-11-25 14:30:00', 'Pending', 'Clerk'),
('CASE-2024-002', 'Maria Clara', 2, 'Domestic Dispute', 'Block 2, Lot 3',
 1, '2024-11-20 09:15:00', 'Resolved', 'Secretary');

INSERT INTO certificates_log (
    control_no, resident_id, certificate_type, purpose, date_issued,
    signatory_captain, signatory_secretary, status, fee_amount
) VALUES
('CERT-2024-001', 1, 'Barangay Clearance', 'Job Application', '2024-11-25',
 '/signatures/captain.png', '/signatures/secretary.png', 'Released', 50.00),
('CERT-2024-002', 2, 'Certificate of Indigency', 'Medical Assistance', '2024-11-20',
 '/signatures/captain.png', '/signatures/secretary.png', 'Released', 25.00);

SELECT 'BMW Database Setup Complete!' as status;
