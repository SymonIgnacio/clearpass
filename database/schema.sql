-- BMWs (Barangay Management Web Application System) Database Schema
-- Certificate Issuance, Blotter Management & AI-Driven Decision Support

-- Note: Database should be created separately before running this schema

-- ==========================================
-- CORE ENTITIES
-- ==========================================

-- Table: Sitios (Hardcoded as per requirements)
CREATE TABLE sitios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert hardcoded sitios as per survey requirements
INSERT INTO sitios (name, description) VALUES
('Batia Proper', 'Main residential area'),
('Northville 5', 'Northern residential district'),
('St. Martha', 'Eastern residential area'),
('AFP/PNP', 'Military/Police housing area');

-- Table: Residents (Complete Profile per Survey Sec 2)
CREATE TABLE residents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    dob DATE,  -- Date of Birth (Survey Sec 2)
    age INT,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    address TEXT NOT NULL,
    sitio_id INT NOT NULL,
    mobile_number VARCHAR(20),  -- Contact number
    employment_status VARCHAR(100),
    income_estimate DECIMAL(10,2),  -- Monthly income
    is_senior BOOLEAN DEFAULT FALSE,
    is_pwd BOOLEAN DEFAULT FALSE,
    is_single_parent BOOLEAN DEFAULT FALSE,
    is_4ps BOOLEAN DEFAULT FALSE,  -- 4Ps member
    voter_status VARCHAR(50),
    photo_url VARCHAR(255),  -- Survey Sec 2 requirement
    qr_identity_hash VARCHAR(255) UNIQUE,  -- Unique QR code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sitio_id) REFERENCES sitios(id),
    INDEX idx_residents_sitio (sitio_id),
    INDEX idx_residents_vulnerable (is_senior, is_pwd, is_single_parent),
    INDEX idx_residents_qr (qr_identity_hash)
);

-- ==========================================
-- BLOTTER & INCIDENT MANAGEMENT
-- ==========================================

-- Table: Blotter (Incident Reporting - Survey aligned)
CREATE TABLE blotter (
    case_id VARCHAR(50) PRIMARY KEY,  -- Auto-generated
    complainant_name VARCHAR(200) NOT NULL,
    respondent_id INT,  -- Links to Residents
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
    FOREIGN KEY (sitio_id) REFERENCES sitios(id),
    INDEX idx_blotter_status (status),
    INDEX idx_blotter_date (date_time),
    INDEX idx_blotter_sitio (sitio_id),
    INDEX idx_blotter_type (incident_type)
);

-- ==========================================
-- CERTIFICATE ISSUANCE SYSTEM
-- ==========================================

-- Table: Certificates_Log (Document Issuance with QR)
CREATE TABLE certificates_log (
    control_no VARCHAR(50) PRIMARY KEY,  -- Auto-generated
    resident_id INT NOT NULL,
    certificate_type VARCHAR(100) NOT NULL,
    purpose TEXT,
    date_issued DATE NOT NULL,
    signatory_captain VARCHAR(255),  -- Digital signature URL
    signatory_secretary VARCHAR(255), -- Digital signature URL
    qr_validation_string VARCHAR(255) UNIQUE,  -- QR code for validation
    status ENUM('Paid', 'Released', 'Cancelled') DEFAULT 'Paid',
    fee_amount DECIMAL(8,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id),
    INDEX idx_certificates_resident (resident_id),
    INDEX idx_certificates_type (certificate_type),
    INDEX idx_certificates_qr (qr_validation_string),
    INDEX idx_certificates_date (date_issued)
);

-- ==========================================
-- STAFF MANAGEMENT
-- ==========================================

-- Table: Officials (Staff Management per Survey)
CREATE TABLE officials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    position ENUM('Captain', 'Secretary', 'Clerk') NOT NULL,
    digital_signature_url VARCHAR(255),
    role_access_level ENUM('Full', 'Limited', 'Basic') DEFAULT 'Basic',
    contact_number VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_officials_position (position),
    INDEX idx_officials_active (is_active)
);

-- ==========================================
-- SYSTEM MANAGEMENT
-- ==========================================

-- Table: Users (Authentication System)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'captain', 'secretary', 'clerk', 'tanod', 'resident') NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(200),
    contact_number VARCHAR(20),
    official_id INT,  -- Links to officials table
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (official_id) REFERENCES officials(id),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active),
    INDEX idx_users_official (official_id)
);

-- ==========================================
-- AUDIT & LOGGING SYSTEM
-- ==========================================

-- Table: Audit_Log (Complete audit trail)
CREATE TABLE audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,  -- e.g., "Certificate Issued", "Blotter Created"
    entity_type VARCHAR(50) NOT NULL,  -- e.g., "certificate", "blotter", "resident"
    entity_id VARCHAR(50),  -- ID of the affected entity
    details JSON,  -- Additional action details
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_date (created_at)
);

-- ==========================================
-- ADDITIONAL FEATURES
-- ==========================================

-- Table: Tanod_Patrol_Schedule
CREATE TABLE tanod_patrol_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patrol_area VARCHAR(100) NOT NULL,
    sitio_id INT,
    assigned_tanods TEXT,  -- JSON array of tanod IDs/names
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    patrol_date DATE NOT NULL,
    status ENUM('Scheduled', 'Active', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    ai_recommended BOOLEAN DEFAULT FALSE,  -- Whether AI suggested this patrol
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sitio_id) REFERENCES sitios(id),
    INDEX idx_tanod_date (patrol_date),
    INDEX idx_tanod_sitio (sitio_id),
    INDEX idx_tanod_status (status)
);

-- Table: Community_Programs
CREATE TABLE community_programs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    program_name VARCHAR(200) NOT NULL,
    description TEXT,
    program_date DATE NOT NULL,
    sitio_id INT,
    target_beneficiaries TEXT,  -- Who the program targets
    status ENUM('Planned', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Planned',
    organizer VARCHAR(100),
    budget_allocated DECIMAL(10,2) DEFAULT 0.00,
    actual_cost DECIMAL(10,2) DEFAULT 0.00,
    participants_count INT DEFAULT 0,
    success_rating INT,  -- 1-5 scale
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sitio_id) REFERENCES sitios(id),
    INDEX idx_programs_date (program_date),
    INDEX idx_programs_sitio (sitio_id),
    INDEX idx_programs_status (status)
);

-- ==========================================
-- INITIAL DATA SETUP
-- ==========================================

-- Insert default officials
INSERT INTO officials (name, position, role_access_level, contact_number, email) VALUES
('Juan Dela Cruz', 'Captain', 'Full', '09123456789', 'captain@barangay-batia.gov.ph'),
('Maria Santos', 'Secretary', 'Full', '09123456790', 'secretary@barangay-batia.gov.ph'),
('Pedro Reyes', 'Clerk', 'Limited', '09123456791', 'clerk@barangay-batia.gov.ph');

-- Insert default users (passwords should be hashed in production)
INSERT INTO users (username, password_hash, role, email, full_name, official_id) VALUES
('captain', '$2b$10$8K3VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ', 'captain', 'captain@barangay-batia.gov.ph', 'Juan Dela Cruz', 1),
('secretary', '$2b$10$8K3VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ', 'secretary', 'secretary@barangay-batia.gov.ph', 'Maria Santos', 2),
('clerk', '$2b$10$8K3VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ', 'clerk', 'clerk@barangay-batia.gov.ph', 'Pedro Reyes', 3);

-- Insert sample residents for testing
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

-- Insert sample blotter cases for testing blocking logic
INSERT INTO blotter (
    case_id, complainant_name, respondent_id, incident_type, incident_location,
    sitio_id, date_time, status, reported_by
) VALUES
('CASE-2024-001', 'Barangay Official', 1, 'Noise Complaint', 'Block 1, Lot 1',
 1, '2024-11-25 14:30:00', 'Pending', 'Clerk'),
('CASE-2024-002', 'Maria Clara', 2, 'Domestic Dispute', 'Block 2, Lot 3',
 1, '2024-11-20 09:15:00', 'Resolved', 'Secretary');

-- Insert sample certificates for testing
INSERT INTO certificates_log (
    control_no, resident_id, certificate_type, purpose, date_issued,
    signatory_captain, signatory_secretary, status, fee_amount
) VALUES
('CERT-2024-001', 1, 'Barangay Clearance', 'Job Application', '2024-11-25',
 '/signatures/captain.png', '/signatures/secretary.png', 'Released', 50.00),
('CERT-2024-002', 2, 'Certificate of Indigency', 'Medical Assistance', '2024-11-20',
 '/signatures/captain.png', '/signatures/secretary.png', 'Released', 25.00);
