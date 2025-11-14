-- Barangay Management System Database Setup for phpMyAdmin
-- Copy and paste this entire script into phpMyAdmin SQL tab

-- Create database
CREATE DATABASE IF NOT EXISTS barangay_batia;
USE barangay_batia;

-- Users table for authentication
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'captain', 'secretary', 'clerk', 'blotter_officer', 'issuance_officer', 'resident') NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sitios table
CREATE TABLE sitios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Residents table
CREATE TABLE residents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(10),
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female') NOT NULL,
    civil_status ENUM('Single', 'Married', 'Widowed', 'Separated', 'Divorced') NOT NULL,
    nationality VARCHAR(50) DEFAULT 'Filipino',
    occupation VARCHAR(100),
    monthly_income DECIMAL(10,2),
    education_level VARCHAR(50),
    contact_number VARCHAR(20),
    email VARCHAR(100),
    sitio_id INT NOT NULL,
    house_number VARCHAR(20),
    street VARCHAR(100),
    is_voter BOOLEAN DEFAULT FALSE,
    is_4ps BOOLEAN DEFAULT FALSE,
    is_senior BOOLEAN DEFAULT FALSE,
    is_pwd BOOLEAN DEFAULT FALSE,
    is_single_parent BOOLEAN DEFAULT FALSE,
    cedula_number VARCHAR(50),
    voter_id VARCHAR(50),
    photo_url VARCHAR(255),
    residency_start_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sitio_id) REFERENCES sitios(id)
);

-- Households table
CREATE TABLE households (
    id INT PRIMARY KEY AUTO_INCREMENT,
    household_head_id INT NOT NULL,
    sitio_id INT NOT NULL,
    house_number VARCHAR(20),
    street VARCHAR(100),
    total_members INT DEFAULT 1,
    total_income DECIMAL(10,2),
    house_type ENUM('Owned', 'Rented', 'Shared') DEFAULT 'Owned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (household_head_id) REFERENCES residents(id),
    FOREIGN KEY (sitio_id) REFERENCES sitios(id)
);

-- Household members relationship
CREATE TABLE household_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    household_id INT NOT NULL,
    resident_id INT NOT NULL,
    relationship ENUM('Head', 'Spouse', 'Child', 'Parent', 'Sibling', 'Other') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id),
    FOREIGN KEY (resident_id) REFERENCES residents(id)
);

-- Certificate types
CREATE TABLE certificate_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    requirements TEXT,
    fee DECIMAL(8,2) DEFAULT 0.00,
    validity_days INT DEFAULT 365,
    template TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Certificates issued
CREATE TABLE certificates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    resident_id INT NOT NULL,
    certificate_type_id INT NOT NULL,
    purpose TEXT NOT NULL,
    issued_by INT NOT NULL,
    approved_by INT,
    status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
    issue_date DATE,
    expiry_date DATE,
    fee_paid DECIMAL(8,2) DEFAULT 0.00,
    qr_code VARCHAR(255),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id),
    FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id),
    FOREIGN KEY (issued_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Blotter records
CREATE TABLE blotter_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    complainant_id INT NOT NULL,
    respondent_id INT,
    respondent_name VARCHAR(200),
    incident_type VARCHAR(100) NOT NULL,
    incident_date DATE NOT NULL,
    incident_time TIME,
    location VARCHAR(255),
    sitio_id INT,
    description TEXT NOT NULL,
    status ENUM('active', 'resolved', 'dismissed', 'referred') DEFAULT 'active',
    severity ENUM('minor', 'moderate', 'major', 'critical') DEFAULT 'minor',
    recorded_by INT NOT NULL,
    resolution TEXT,
    resolved_date DATE,
    resolved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (complainant_id) REFERENCES residents(id),
    FOREIGN KEY (respondent_id) REFERENCES residents(id),
    FOREIGN KEY (sitio_id) REFERENCES sitios(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Business permits
CREATE TABLE business_permits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    permit_number VARCHAR(50) UNIQUE NOT NULL,
    business_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    owner_id INT NOT NULL,
    business_address TEXT NOT NULL,
    sitio_id INT NOT NULL,
    status ENUM('active', 'expired', 'suspended', 'revoked') DEFAULT 'active',
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    fee_paid DECIMAL(10,2) DEFAULT 0.00,
    issued_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES residents(id),
    FOREIGN KEY (sitio_id) REFERENCES sitios(id),
    FOREIGN KEY (issued_by) REFERENCES users(id)
);

-- QR validation sessions
CREATE TABLE qr_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_code VARCHAR(100) UNIQUE NOT NULL,
    resident_id INT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id)
);

-- Certificate requests
CREATE TABLE certificate_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    resident_id INT NOT NULL,
    certificate_type_id INT NOT NULL,
    purpose TEXT NOT NULL,
    qr_session_id INT,
    status ENUM('pending', 'processing', 'ready', 'released', 'cancelled') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INT,
    notes TEXT,
    FOREIGN KEY (resident_id) REFERENCES residents(id),
    FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id),
    FOREIGN KEY (qr_session_id) REFERENCES qr_sessions(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Audit logs
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- System settings
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Insert Sitios
INSERT INTO sitios (name, description) VALUES
('Batia Proper', 'Central sitio of Barangay Batia'),
('Northville 5', 'Northern residential area'),
('St. Martha', 'Eastern residential subdivision'),
('AFP/PNP', 'Military and police housing area');

-- Insert Users
INSERT INTO users (username, password, role, email, phone, is_active) VALUES
('admin', 'admin123', 'admin', 'admin@barangaybatia.gov.ph', '09171234567', TRUE),
('captain', 'captain123', 'captain', 'captain@barangaybatia.gov.ph', '09171234568', TRUE),
('secretary', 'secretary123', 'secretary', 'secretary@barangaybatia.gov.ph', '09171234569', TRUE),
('clerk', 'clerk123', 'clerk', 'clerk@barangaybatia.gov.ph', '09171234570', TRUE),
('blotter_officer', 'blotter123', 'blotter_officer', 'blotter@barangaybatia.gov.ph', '09171234571', TRUE),
('issuance_officer', 'issuance123', 'issuance_officer', 'issuance@barangaybatia.gov.ph', '09171234572', TRUE),
('juan.dela.cruz', 'juan123', 'resident', 'juan@email.com', '09171234573', TRUE),
('maria.santos', 'maria123', 'resident', 'maria@email.com', '09171234574', TRUE),
('pedro.garcia', 'pedro123', 'resident', 'pedro@email.com', '09171234575', TRUE),
('ana.reyes', 'ana123', 'resident', 'ana@email.com', '09171234576', TRUE);

-- Insert Certificate Types
INSERT INTO certificate_types (name, description, requirements, fee, validity_days, is_active) VALUES
('Barangay Clearance', 'Proves you have no issue or file complaint', 'Valid ID, Proof of Residency, CEDULA, Payment', 50.00, 365, TRUE),
('Certificate of Residency', 'Certifies an individual residence within the barangay', 'Full name, Address, Period of residency, Purpose', 30.00, 365, TRUE),
('Certificate of Indigency', 'Proving a resident has no or limited income', 'Full Name, Complete Address, Specific Purpose', 20.00, 180, TRUE),
('Business Clearance', 'Business allowed to operate in the barangay', 'Business Name, Owner Info, Valid ID, Barangay Residency, CEDULA', 100.00, 365, TRUE),
('Good Moral Certificate', 'A person has good behavior and conduct', 'Full Name, Date of Birth, Address, Purpose', 25.00, 365, TRUE),
('Low Income Certificate', 'Certifies a person belongs to low-income sector', 'Full Name, Address, Household Info, Income Details', 15.00, 180, TRUE),
('Barangay Certification', 'Specific information of individuals', 'Full name, Complete address, Purpose', 35.00, 365, TRUE),
('Oath of Undertaking', 'Individual promises to follow certain rules', 'Full Name, Address, Statement of promise', 40.00, 365, TRUE);

-- Insert Residents
INSERT INTO residents (user_id, first_name, middle_name, last_name, date_of_birth, gender, civil_status, occupation, monthly_income, education_level, contact_number, email, sitio_id, house_number, street, is_voter, is_4ps, is_senior, is_pwd, is_single_parent, cedula_number, voter_id, residency_start_date, is_active) VALUES
(7, 'Juan', 'Dela', 'Cruz', '1985-03-15', 'Male', 'Married', 'Tricycle Driver', 15000.00, 'High School', '09171234573', 'juan@email.com', 1, '123', 'Main Street', TRUE, FALSE, FALSE, FALSE, FALSE, 'CED-2024-001', 'VID-001', '2020-01-15', TRUE),
(8, 'Maria', 'Santos', 'Garcia', '1990-07-22', 'Female', 'Single', 'Store Owner', 25000.00, 'College', '09171234574', 'maria@email.com', 1, '124', 'Main Street', TRUE, FALSE, FALSE, FALSE, TRUE, 'CED-2024-002', 'VID-002', '2019-05-10', TRUE),
(9, 'Pedro', 'Ramos', 'Garcia', '1978-12-08', 'Male', 'Married', 'Construction Worker', 18000.00, 'Elementary', '09171234575', 'pedro@email.com', 2, '45', 'North Avenue', TRUE, TRUE, FALSE, FALSE, FALSE, 'CED-2024-003', 'VID-003', '2018-03-20', TRUE),
(10, 'Ana', 'Cruz', 'Reyes', '1965-09-30', 'Female', 'Widowed', 'Retired', 8000.00, 'High School', '09171234576', 'ana@email.com', 3, '67', 'Martha Street', TRUE, FALSE, TRUE, FALSE, FALSE, 'CED-2024-004', 'VID-004', '2015-11-05', TRUE),
(NULL, 'Roberto', 'Mendoza', 'Silva', '1992-04-18', 'Male', 'Single', 'Security Guard', 16000.00, 'High School', '09171234577', 'roberto@email.com', 4, '89', 'AFP Road', TRUE, FALSE, FALSE, FALSE, FALSE, 'CED-2024-005', 'VID-005', '2021-02-14', TRUE),
(NULL, 'Carmen', 'Torres', 'Lopez', '1988-11-25', 'Female', 'Married', 'Teacher', 35000.00, 'College', '09171234578', 'carmen@email.com', 1, '101', 'Central Avenue', TRUE, FALSE, FALSE, FALSE, FALSE, 'CED-2024-006', 'VID-006', '2017-08-12', TRUE),
(NULL, 'Jose', 'Fernandez', 'Morales', '1975-06-14', 'Male', 'Married', 'Jeepney Driver', 20000.00, 'High School', '09171234579', 'jose@email.com', 2, '23', 'Northville Street', TRUE, TRUE, FALSE, FALSE, FALSE, 'CED-2024-007', 'VID-007', '2016-12-03', TRUE),
(NULL, 'Luz', 'Gonzales', 'Aquino', '1982-01-09', 'Female', 'Single', 'Nurse', 40000.00, 'College', '09171234580', 'luz@email.com', 3, '156', 'St. Martha Avenue', TRUE, FALSE, FALSE, FALSE, TRUE, 'CED-2024-008', 'VID-008', '2019-09-18', TRUE),
(NULL, 'Ricardo', 'Villanueva', 'Castro', '1970-08-27', 'Male', 'Married', 'Carpenter', 22000.00, 'Vocational', '09171234581', 'ricardo@email.com', 4, '78', 'PNP Street', TRUE, FALSE, FALSE, TRUE, FALSE, 'CED-2024-009', 'VID-009', '2020-04-22', TRUE),
(NULL, 'Elena', 'Ramirez', 'Flores', '1995-02-11', 'Female', 'Married', 'Housewife', 0.00, 'High School', '09171234582', 'elena@email.com', 1, '234', 'Proper Street', FALSE, TRUE, FALSE, FALSE, FALSE, 'CED-2024-010', NULL, '2022-01-30', TRUE);

-- Insert System Settings
INSERT INTO system_settings (setting_key, setting_value, description, updated_by) VALUES
('barangay_name', 'Barangay Batia', 'Official name of the barangay', 1),
('barangay_captain', 'Hon. [Captain Name]', 'Current Barangay Captain', 1),
('barangay_secretary', 'Ms. Maria Cruz', 'Current Barangay Secretary', 1),
('certificate_validity_days', '365', 'Default validity period for certificates', 1),
('qr_session_duration', '60', 'QR session duration in minutes', 1),
('population_count', '48000', 'Approximate total population', 1);