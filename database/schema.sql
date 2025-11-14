-- Barangay Management System Database Schema
-- Based on survey requirements for Barangay Batia

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
    data JSON,
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

-- Certificate requests (for online requests)
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