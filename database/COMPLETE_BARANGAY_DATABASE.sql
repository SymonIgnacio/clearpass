-- =======================================================================================================
-- COMPLETE BARANGAY MANAGEMENT SYSTEM DATABASE
-- =======================================================================================================
-- This file creates the complete database schema AND inserts all mock data in one import
-- Just run this single file in phpMyAdmin or MySQL to set up everything
--
-- Version: 2.1 | Generated: November 30, 2025
-- =======================================================================================================

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS barangay_management;
-- USE barangay_management;

-- ==========================================
-- 1. CORE ENTITIES - SCHEMA
-- ==========================================

-- Table: Sitios (Hardcoded as per requirements)
CREATE TABLE IF NOT EXISTS sitios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Households (RBIM - Registry of Barangay Inhabitants and Migrants)
CREATE TABLE IF NOT EXISTS households (
    Household_ID VARCHAR(50) PRIMARY KEY,  -- Manual ID from Census (e.g., H-2025-001)
    Household_Number VARCHAR(20) UNIQUE NOT NULL,  -- Census Household Number
    Sitio_ID INT NOT NULL,
    Street_Address TEXT NOT NULL,
    Coordinates POINT NULL,  -- Lat/Long for Heatmaps (optional)
    Head_Resident_ID VARCHAR(50) NULL,  -- Links to main head of household (UUID) - FK added later
    Total_Members INT DEFAULT 1,
    Household_Type ENUM('Nuclear', 'Extended', 'Single', 'Boarding') DEFAULT 'Nuclear',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Sitio_ID) REFERENCES sitios(id),
    INDEX idx_households_sitio (Sitio_ID),
    INDEX idx_households_head (Head_Resident_ID)
);

-- Table: Residents (Enhanced RBIM Profile)
CREATE TABLE IF NOT EXISTS residents (
    Resident_ID VARCHAR(50) PRIMARY KEY,  -- UUID format
    Household_ID VARCHAR(50) NOT NULL,
    Relation_to_Head ENUM('Head', 'Spouse', 'Child', 'Relative', 'Boarder') DEFAULT 'Head',
    First_Name VARCHAR(100) NOT NULL,
    Middle_Name VARCHAR(100),
    Last_Name VARCHAR(100) NOT NULL,
    Suffix VARCHAR(10),
    Birthdate DATE NOT NULL,
    Age INT DEFAULT 0,  -- Calculated in application layer
    Gender ENUM('Male', 'Female', 'Other') NOT NULL,
    Civil_Status ENUM('Single', 'Married', 'Widowed', 'Separated', 'Divorced') DEFAULT 'Single',
    Occupation VARCHAR(100),
    Income_Estimate DECIMAL(10,2),
    Mobile_Number VARCHAR(20),  -- Critical for SMS OTP
    Voter_Status ENUM('Registered', 'Non-Registered') DEFAULT 'Non-Registered',
    Date_Arrival DATE NULL,  -- When they moved in
    Residency_Status ENUM('Active', 'Deceased', 'Transferred Out', 'Transient') DEFAULT 'Active',
    Profile_Photo_URL VARCHAR(255),
    QR_Hash_String VARCHAR(255) UNIQUE,  -- Unique identity token
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Household_ID) REFERENCES households(Household_ID),
    INDEX idx_residents_household (Household_ID),
    INDEX idx_residents_name (Last_Name, First_Name),
    INDEX idx_residents_age (Age),
    INDEX idx_residents_mobile (Mobile_Number),
    INDEX idx_residents_status (Residency_Status),
    INDEX idx_residents_qr (QR_Hash_String)
);

-- Add foreign key constraint after both tables exist
ALTER TABLE households ADD CONSTRAINT fk_households_head_resident
FOREIGN KEY (Head_Resident_ID) REFERENCES residents(Resident_ID);

-- Table: Vulnerabilities (One-to-One with Residents - RBIM Compliance)
CREATE TABLE IF NOT EXISTS vulnerabilities (
    Resident_ID VARCHAR(50) PRIMARY KEY,
    Is_4Ps BOOLEAN DEFAULT FALSE,
    Is_PWD BOOLEAN DEFAULT FALSE,
    Is_Senior BOOLEAN DEFAULT FALSE,  -- Calculated in application layer
    Is_Solo_Parent BOOLEAN DEFAULT FALSE,
    Is_Out_of_School_Youth BOOLEAN DEFAULT FALSE,
    Disability_Type VARCHAR(100) NULL,  -- For PWD classification
    Vulnerability_Score INT DEFAULT 0,  -- Calculated in application layer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Resident_ID) REFERENCES residents(Resident_ID) ON DELETE CASCADE,
    INDEX idx_vulnerabilities_score (Vulnerability_Score)
);

-- ==========================================
-- 2. BLOTTER & INCIDENT MANAGEMENT - SCHEMA
-- ==========================================

-- Table: Blotter (Incident Reporting - Katarungang Pambarangay compliant)
CREATE TABLE IF NOT EXISTS blotter (
    Case_Number VARCHAR(50) PRIMARY KEY,  -- Format: BLOT-YYYY-MM-0001
    Complainant_Details JSON NOT NULL,  -- { Name, Address, Contact, ID_Proof }
    Respondent_Details JSON,  -- { Name, Address, Alias, Contact }
    Incident_Type ENUM(
        -- Offenses Against Persons (High Priority)
        'Physical Injury', 'Unjust Vexation', 'Grave Threats', 'Alarming and Scandal',
        -- Offenses Against Property (Medium Priority)
        'Theft (Petty)', 'Malicious Mischief', 'Estafa (Swindling)', 'Trespassing',
        -- Civil & Family Disputes (Low Priority - Mediation Only)
        'Collection of Sum of Money', 'Ejectment', 'Boundary Dispute', 'Family Dispute',
        -- Community & Ordinance (High Priority for Patrols)
        'Curfew Violation', 'Noise Barrage', 'Illegal Parking', 'Waste Management', 'Stray Animals'
    ) NOT NULL,
    Narrative TEXT NOT NULL,  -- The "Sumbong"
    DateTime_Incident DATETIME NOT NULL,
    Location_Sitio ENUM('Batia Proper', 'Northville 5', 'St. Martha', 'AFP/PNP') NOT NULL,
    Status ENUM('Pending', 'Scheduled for Mediation', 'Amicably Settled', 'Certificate to File Action Issued', 'Dismissed', 'Ongoing') DEFAULT 'Pending',
    Hearing_Schedule DATETIME NULL,  -- For Summons
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_blotter_status (Status),
    INDEX idx_blotter_date (DateTime_Incident),
    INDEX idx_blotter_sitio (Location_Sitio),
    INDEX idx_blotter_type (Incident_Type)
);

-- ==========================================
-- 3. CERTIFICATE ISSUANCE SYSTEM - SCHEMA
-- ==========================================

-- Table: Certificate_Types (Dynamic certificate types)
CREATE TABLE IF NOT EXISTS certificate_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    fee DECIMAL(8,2) DEFAULT 0.00,
    validity_days INT DEFAULT 365,
    description TEXT,
    purpose TEXT,
    when_needed TEXT,
    required_data TEXT,  -- JSON array of required fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: Certificates_Log (Document Issuance with QR)
CREATE TABLE IF NOT EXISTS certificates_log (
    control_no VARCHAR(50) PRIMARY KEY,  -- Auto-generated
    resident_id VARCHAR(50) NOT NULL,  -- References Resident_ID from residents table
    certificate_type VARCHAR(100) NOT NULL,
    purpose TEXT,
    date_issued DATE NOT NULL,
    signatory_captain VARCHAR(255),  -- Digital signature URL
    signatory_secretary VARCHAR(255), -- Digital signature URL
    qr_validation_string VARCHAR(255) UNIQUE,  -- QR code for validation
    status ENUM('Paid', 'Released', 'Cancelled') DEFAULT 'Paid',
    fee_amount DECIMAL(8,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(Resident_ID),
    INDEX idx_certificates_resident (resident_id),
    INDEX idx_certificates_type (certificate_type),
    INDEX idx_certificates_qr (qr_validation_string),
    INDEX idx_certificates_date (date_issued)
);

-- ==========================================
-- 4. STAFF MANAGEMENT - SCHEMA
-- ==========================================

-- Table: Officials (Staff Management per Survey)
CREATE TABLE IF NOT EXISTS officials (
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
-- 5. SYSTEM MANAGEMENT - SCHEMA
-- ==========================================

-- Table: Users (Authentication System)
CREATE TABLE IF NOT EXISTS users (
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
-- 6. AUDIT & LOGGING SYSTEM - SCHEMA
-- ==========================================

-- Table: Audit_Log (Complete audit trail)
CREATE TABLE IF NOT EXISTS audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,  -- e.g., "Certificate Issued", "Blotter Created"
    entity_type VARCHAR(50) NOT NULL,  -- e.g., "certificate", "blotter", "resident"
    entity_id VARCHAR(50),  -- ID of the affected entity
    details TEXT,  -- Additional action details (JSON string for compatibility)
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_date (created_at)
);

-- ==========================================
-- 7. ADDITIONAL FEATURES - SCHEMA
-- ==========================================

-- Table: Tanod_Patrol_Schedule
CREATE TABLE IF NOT EXISTS tanod_patrol_schedule (
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
CREATE TABLE IF NOT EXISTS community_programs (
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
-- 8. MOCK DATA INSERTION
-- ==========================================

-- Sitios Data
INSERT INTO sitios (name, description) VALUES
('Batia Proper', 'Main residential and commercial area, population ~2,500'),
('Northville 5', 'Northern residential district with growing community'),
('St. Martha', 'Eastern residential area with mixed housing types'),
('AFP/PNP', 'Military and police housing compound');

-- Officials Data
INSERT INTO officials (name, position, role_access_level, contact_number, email) VALUES
('Juan Dela Cruz', 'Captain', 'Full', '09123456789', 'captain@barangay-batia.gov.ph'),
('Maria Santos', 'Secretary', 'Full', '09123456790', 'secretary@barangay-batia.gov.ph'),
('Pedro Reyes', 'Clerk', 'Limited', '09123456791', 'clerk@barangay-batia.gov.ph');

-- Users Data (passwords are bcrypt hashed)
INSERT INTO users (username, password_hash, role, email, full_name, official_id) VALUES
('captain', '$2b$10$8K3VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ', 'captain', 'captain@barangay-batia.gov.ph', 'Juan Dela Cruz', 1),
('secretary', '$2b$10$8K3VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ', 'secretary', 'secretary@barangay-batia.gov.ph', 'Maria Santos', 2),
('clerk', '$2b$10$8K3VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ8VzJcXH9pZ', 'clerk', 'clerk@barangay-batia.gov.ph', 'Pedro Reyes', 3);

-- Households Data (RBIM - Sample households)
INSERT INTO households (Household_ID, Household_Number, Sitio_ID, Street_Address, Total_Members, Household_Type) VALUES
('H-2025-001', 'HH-001', 1, 'Block 1, Lot 1, Batia Proper', 4, 'Nuclear'),
('H-2025-002', 'HH-002', 1, 'Block 1, Lot 2, Batia Proper', 3, 'Nuclear'),
('H-2025-003', 'HH-003', 1, 'Block 1, Lot 3, Batia Proper', 2, 'Nuclear'),
('H-2025-004', 'HH-004', 1, 'Block 2, Lot 1, Batia Proper', 5, 'Extended'),
('H-2025-005', 'HH-005', 1, 'Block 2, Lot 2, Batia Proper', 1, 'Single'),
('H-2025-006', 'HH-006', 2, 'Phase 1, Block A, Northville 5', 6, 'Extended'),
('H-2025-007', 'HH-007', 3, 'Villa Maria, St. Martha', 3, 'Nuclear'),
('H-2025-008', 'HH-008', 4, 'Camp Area, AFP/PNP', 4, 'Extended'),
('H-2025-009', 'HH-009', 1, 'Block 3, Lot 1, Batia Proper', 4, 'Nuclear'),
('H-2025-010', 'HH-010', 2, 'Phase 2, Block B, Northville 5', 3, 'Nuclear'),
('H-2025-011', 'HH-011', 3, 'Villa Theresa, St. Martha', 5, 'Extended'),
('H-2025-012', 'HH-012', 4, 'Military Quarters, AFP/PNP', 2, 'Nuclear'),
('H-2025-013', 'HH-013', 1, 'Block 4, Lot 2, Batia Proper', 1, 'Single'),
('H-2025-014', 'HH-014', 2, 'Phase 3, Block C, Northville 5', 4, 'Extended'),
('H-2025-015', 'HH-015', 3, 'Villa Bernadette, St. Martha', 4, 'Extended');

-- Residents Data (RBIM Enhanced - Sample residents - Expanded to 50 residents with proper ages)
INSERT INTO residents (Resident_ID, Household_ID, Relation_to_Head, First_Name, Middle_Name, Last_Name, Birthdate, Age, Gender, Civil_Status, Occupation, Income_Estimate, Mobile_Number, Voter_Status, Date_Arrival, Residency_Status, Profile_Photo_URL, QR_Hash_String) VALUES
-- Household H-2025-001 (4 members)
('RES-2025-001', 'H-2025-001', 'Head', 'Juan', 'Garcia', 'Dela Cruz', '1985-03-15', 40, 'Male', 'Married', 'Construction Worker', 15000.00, '09171234567', 'Registered', '2010-01-15', 'Active', 'https://i.pravatar.cc/150?img=1', 'QR-RES-2025-001'),
('RES-2025-002', 'H-2025-001', 'Spouse', 'Maria', 'Reyes', 'Dela Cruz', '1987-08-22', 38, 'Female', 'Married', 'Teacher', 25000.00, '09171234568', 'Registered', '2010-01-15', 'Active', 'https://i.pravatar.cc/150?img=2', 'QR-RES-2025-002'),
('RES-2025-003', 'H-2025-001', 'Child', 'Jose', 'Dela Cruz', 'Dela Cruz', '2010-05-10', 15, 'Male', 'Single', 'Student', 0.00, NULL, 'Non-Registered', '2010-05-10', 'Active', 'https://i.pravatar.cc/150?img=3', 'QR-RES-2025-003'),
('RES-2025-004', 'H-2025-001', 'Child', 'Anna', 'Dela Cruz', 'Dela Cruz', '2012-12-03', 13, 'Female', 'Single', 'Student', 0.00, NULL, 'Non-Registered', '2012-12-03', 'Active', 'https://i.pravatar.cc/150?img=4', 'QR-RES-2025-004'),

-- Household H-2025-002 (3 members)
('RES-2025-005', 'H-2025-002', 'Head', 'Pedro', 'Mendoza', 'Garcia', '1990-11-10', 35, 'Male', 'Single', 'Electrician', 18000.00, '09171234569', 'Registered', '2015-03-20', 'Active', 'https://i.pravatar.cc/150?img=5', 'QR-RES-2025-005'),
('RES-2025-006', 'H-2025-002', 'Relative', 'Elena', 'Torres', 'Garcia', '1986-12-03', 39, 'Female', 'Married', 'Sales Clerk', 12000.00, '09171234572', 'Registered', '2015-03-20', 'Active', 'https://i.pravatar.cc/150?img=6', 'QR-RES-2025-006'),
('RES-2025-007', 'H-2025-002', 'Boarder', 'Carlos', 'Luna', 'Martinez', '1988-09-25', 37, 'Male', 'Single', 'Driver', 14000.00, '09171234571', 'Registered', '2020-08-15', 'Active', 'https://i.pravatar.cc/150?img=7', 'QR-RES-2025-007'),

-- Household H-2025-003 (2 members)
('RES-2025-008', 'H-2025-003', 'Head', 'Ana', 'Santos', 'Rodriguez', '1983-05-18', 42, 'Female', 'Widowed', 'Nurse', 22000.00, '09171234570', 'Registered', '2008-11-12', 'Active', 'https://i.pravatar.cc/150?img=8', 'QR-RES-2025-008'),
('RES-2025-009', 'H-2025-003', 'Child', 'Miguel', 'Rodriguez', 'Rodriguez', '2008-07-22', 17, 'Male', 'Single', 'Student', 0.00, NULL, 'Non-Registered', '2008-07-22', 'Active', 'https://i.pravatar.cc/150?img=9', 'QR-RES-2025-009'),

-- Household H-2025-004 (5 members)
('RES-2025-010', 'H-2025-004', 'Head', 'Roberto', 'Cruz', 'Fernandez', '1982-07-14', 43, 'Male', 'Married', 'Carpenter', 16000.00, '09171234573', 'Registered', '2005-09-30', 'Active', 'https://i.pravatar.cc/150?img=10', 'QR-RES-2025-010'),
('RES-2025-011', 'H-2025-004', 'Spouse', 'Carmen', 'Reyes', 'Fernandez', '1989-04-08', 36, 'Female', 'Married', 'House Helper', 9000.00, '09171234574', 'Registered', '2005-09-30', 'Active', 'https://i.pravatar.cc/150?img=11', 'QR-RES-2025-011'),
('RES-2025-012', 'H-2025-004', 'Child', 'Isabel', 'Fernandez', 'Fernandez', '2015-02-14', 10, 'Female', 'Single', 'Student', 0.00, NULL, 'Non-Registered', '2015-02-14', 'Active', 'https://i.pravatar.cc/150?img=12', 'QR-RES-2025-012'),
('RES-2025-013', 'H-2025-004', 'Relative', 'Miguel', 'Santos', 'Fernandez', '1992-01-20', 33, 'Male', 'Single', 'Security Guard', 11000.00, '09171234575', 'Registered', '2018-06-10', 'Active', 'https://i.pravatar.cc/150?img=13', 'QR-RES-2025-013'),
('RES-2025-014', 'H-2025-004', 'Relative', 'Antonio', 'Cruz', 'Villanueva', '1955-10-29', 70, 'Male', 'Widowed', 'Retired', 8000.00, '09171234577', 'Registered', '2022-01-05', 'Active', 'https://i.pravatar.cc/150?img=14', 'QR-RES-2025-014'),

-- Household H-2025-005 (1 member)
('RES-2025-015', 'H-2025-005', 'Head', 'Rosa', 'Torres', 'Aquino', '1958-03-17', 67, 'Female', 'Widowed', 'Retired Nurse', 10000.00, '09171234578', 'Registered', '1995-12-01', 'Active', 'https://i.pravatar.cc/150?img=15', 'QR-RES-2025-015'),

-- Household H-2025-006 (6 members)
('RES-2025-016', 'H-2025-006', 'Head', 'Jose', 'Luna', 'Ramos', '1952-08-05', 73, 'Male', 'Married', 'Retired Teacher', 12000.00, '09171234579', 'Registered', '1980-05-20', 'Active', 'https://i.pravatar.cc/150?img=16', 'QR-RES-2025-016'),
('RES-2025-017', 'H-2025-006', 'Spouse', 'Teresa', 'Reyes', 'Ramos', '1960-12-22', 65, 'Female', 'Married', 'Retired', 7000.00, '09171234580', 'Registered', '1980-05-20', 'Active', 'https://i.pravatar.cc/150?img=17', 'QR-RES-2025-017'),
('RES-2025-018', 'H-2025-006', 'Child', 'Francisco', 'Ramos', 'Ramos', '1985-11-08', 40, 'Male', 'Married', 'Retired Mechanic', 9000.00, '09171234581', 'Registered', '1985-11-08', 'Active', 'https://i.pravatar.cc/150?img=18', 'QR-RES-2025-018'),
('RES-2025-019', 'H-2025-006', 'Child', 'Gloria', 'Ramos', 'Ramos', '1988-03-15', 37, 'Female', 'Single', 'Unemployed', 0.00, '09171234582', 'Registered', '1988-03-15', 'Active', 'https://i.pravatar.cc/150?img=19', 'QR-RES-2025-019'),
('RES-2025-020', 'H-2025-006', 'Child', 'Hector', 'Ramos', 'Ramos', '1990-07-22', 35, 'Male', 'Single', 'Part-time Worker', 8000.00, '09171234583', 'Registered', '1990-07-22', 'Active', 'https://i.pravatar.cc/150?img=20', 'QR-RES-2025-020'),

-- Additional Households and Residents (Expanded to 50 total residents)
-- Household H-2025-007 (3 members)
('RES-2025-021', 'H-2025-007', 'Head', 'Luisa', 'Mendoza', 'Santiago', '1975-06-12', 50, 'Female', 'Married', 'Office Clerk', 13000.00, '09171234584', 'Registered', '2000-03-15', 'Active', 'https://i.pravatar.cc/150?img=21', 'QR-RES-2025-021'),
('RES-2025-022', 'H-2025-007', 'Spouse', 'Manuel', 'Cruz', 'Santiago', '1978-09-08', 47, 'Male', 'Married', 'Mechanic', 17000.00, '09171234585', 'Registered', '2000-03-15', 'Active', 'https://i.pravatar.cc/150?img=22', 'QR-RES-2025-022'),
('RES-2025-023', 'H-2025-007', 'Child', 'Sofia', 'Santiago', 'Santiago', '2005-11-20', 20, 'Female', 'Single', 'Student', 0.00, '09171234586', 'Non-Registered', '2005-11-20', 'Active', 'https://i.pravatar.cc/150?img=23', 'QR-RES-2025-023'),

-- Household H-2025-008 (4 members)
('RES-2025-024', 'H-2025-008', 'Head', 'Ricardo', 'Luna', 'Morales', '1968-04-25', 57, 'Male', 'Married', 'Farmer', 12000.00, '09171234587', 'Registered', '1990-07-10', 'Active', 'https://i.pravatar.cc/150?img=24', 'QR-RES-2025-024'),
('RES-2025-025', 'H-2025-008', 'Spouse', 'Consuelo', 'Reyes', 'Morales', '1970-01-30', 55, 'Female', 'Married', 'Housewife', 0.00, '09171234588', 'Registered', '1990-07-10', 'Active', 'https://i.pravatar.cc/150?img=25', 'QR-RES-2025-025'),
('RES-2025-026', 'H-2025-008', 'Child', 'Rafael', 'Morales', 'Morales', '1995-08-14', 30, 'Male', 'Single', 'College Student', 0.00, '09171234589', 'Non-Registered', '1995-08-14', 'Active', 'https://i.pravatar.cc/150?img=26', 'QR-RES-2025-026'),
('RES-2025-027', 'H-2025-008', 'Child', 'Patricia', 'Morales', 'Morales', '1998-12-05', 27, 'Female', 'Single', 'Nurse', 14000.00, '09171234590', 'Registered', '1998-12-05', 'Active', 'https://i.pravatar.cc/150?img=27', 'QR-RES-2025-027'),

-- New Households (H-2025-009 to H-2025-015 with complete residents)
('RES-2025-028', 'H-2025-009', 'Head', 'Fernando', 'Gomez', 'Lopez', '1980-02-18', 45, 'Male', 'Married', 'Plumber', 19000.00, '09171234591', 'Registered', '2012-05-22', 'Active', 'https://i.pravatar.cc/150?img=28', 'QR-RES-2025-028'),
('RES-2025-029', 'H-2025-009', 'Spouse', 'Victoria', 'Santos', 'Lopez', '1982-07-09', 43, 'Female', 'Married', 'Bookkeeper', 16000.00, '09171234592', 'Registered', '2012-05-22', 'Active', 'https://i.pravatar.cc/150?img=29', 'QR-RES-2025-029'),
('RES-2025-030', 'H-2025-009', 'Child', 'Daniel', 'Lopez', 'Lopez', '2010-03-12', 15, 'Male', 'Single', 'Student', 0.00, NULL, 'Non-Registered', '2010-03-12', 'Active', 'https://i.pravatar.cc/150?img=30', 'QR-RES-2025-030'),

('RES-2025-031', 'H-2025-010', 'Head', 'Celia', 'Cruz', 'Bautista', '1965-11-28', 60, 'Female', 'Widowed', 'Retired Teacher', 8000.00, '09171234593', 'Registered', '1985-09-15', 'Active', 'https://i.pravatar.cc/150?img=31', 'QR-RES-2025-031'),
('RES-2025-032', 'H-2025-010', 'Child', 'Jonathan', 'Bautista', 'Bautista', '1990-06-17', 35, 'Male', 'Married', 'Software Developer', 35000.00, '09171234594', 'Registered', '1990-06-17', 'Active', 'https://i.pravatar.cc/150?img=32', 'QR-RES-2025-032'),
('RES-2025-033', 'H-2025-010', 'Child', 'Jessica', 'Bautista', 'Bautista', '1992-09-03', 33, 'Female', 'Single', 'Graphic Designer', 20000.00, '09171234595', 'Registered', '1992-09-03', 'Active', 'https://i.pravatar.cc/150?img=33', 'QR-RES-2025-033'),

('RES-2025-034', 'H-2025-011', 'Head', 'Emilio', 'Torres', 'Castro', '1972-12-10', 53, 'Male', 'Married', 'Business Owner', 45000.00, '09171234596', 'Registered', '2005-01-08', 'Active', 'https://i.pravatar.cc/150?img=34', 'QR-RES-2025-034'),
('RES-2025-035', 'H-2025-011', 'Spouse', 'Amelia', 'Luna', 'Castro', '1974-05-25', 51, 'Female', 'Married', 'Business Owner', 45000.00, '09171234597', 'Registered', '2005-01-08', 'Active', 'https://i.pravatar.cc/150?img=35', 'QR-RES-2025-035'),
('RES-2025-036', 'H-2025-011', 'Child', 'Eduardo', 'Castro', 'Castro', '2000-08-30', 25, 'Male', 'Single', 'College Student', 0.00, '09171234598', 'Non-Registered', '2000-08-30', 'Active', 'https://i.pravatar.cc/150?img=36', 'QR-RES-2025-036'),
('RES-2025-037', 'H-2025-011', 'Child', 'Camila', 'Castro', 'Castro', '2003-11-15', 22, 'Female', 'Single', 'High School Student', 0.00, '09171234599', 'Non-Registered', '2003-11-15', 'Active', 'https://i.pravatar.cc/150?img=37', 'QR-RES-2025-037'),

('RES-2025-038', 'H-2025-012', 'Head', 'Gabriel', 'Reyes', 'Domingo', '1950-03-22', 75, 'Male', 'Widowed', 'Retired Fisherman', 6000.00, '09171234600', 'Registered', '1970-12-05', 'Active', 'https://i.pravatar.cc/150?img=38', 'QR-RES-2025-038'),
('RES-2025-039', 'H-2025-012', 'Child', 'Rodrigo', 'Domingo', 'Domingo', '1980-07-18', 45, 'Male', 'Married', 'Fisherman', 15000.00, '09171234601', 'Registered', '1980-07-18', 'Active', 'https://i.pravatar.cc/150?img=39', 'QR-RES-2025-039'),

('RES-2025-040', 'H-2025-013', 'Head', 'Nora', 'Mendoza', 'Villanueva', '1968-10-14', 57, 'Female', 'Single', 'Tailor', 10000.00, '09171234602', 'Registered', '1995-04-20', 'Active', 'https://i.pravatar.cc/150?img=40', 'QR-RES-2025-040'),

('RES-2025-041', 'H-2025-014', 'Head', 'Alfredo', 'Santos', 'Rivera', '1976-01-09', 49, 'Male', 'Married', 'Taxi Driver', 12000.00, '09171234603', 'Registered', '2008-06-12', 'Active', 'https://i.pravatar.cc/150?img=41', 'QR-RES-2025-041'),
('RES-2025-042', 'H-2025-014', 'Spouse', 'Leticia', 'Cruz', 'Rivera', '1978-04-27', 47, 'Female', 'Married', 'Vendor', 8000.00, '09171234604', 'Registered', '2008-06-12', 'Active', 'https://i.pravatar.cc/150?img=42', 'QR-RES-2025-042'),
('RES-2025-043', 'H-2025-014', 'Child', 'Mario', 'Rivera', 'Rivera', '2005-09-08', 20, 'Male', 'Single', 'Student', 0.00, '09171234605', 'Non-Registered', '2005-09-08', 'Active', 'https://i.pravatar.cc/150?img=43', 'QR-RES-2025-043'),
('RES-2025-044', 'H-2025-014', 'Child', 'Angela', 'Rivera', 'Rivera', '2008-12-21', 17, 'Female', 'Single', 'Student', 0.00, '09171234606', 'Non-Registered', '2008-12-21', 'Active', 'https://i.pravatar.cc/150?img=44', 'QR-RES-2025-044'),

('RES-2025-045', 'H-2025-015', 'Head', 'Bernardo', 'Luna', 'Pascual', '1945-08-16', 80, 'Male', 'Married', 'Retired Government Employee', 15000.00, '09171234607', 'Registered', '1965-02-14', 'Active', 'https://i.pravatar.cc/150?img=45', 'QR-RES-2025-045'),
('RES-2025-046', 'H-2025-015', 'Spouse', 'Esperanza', 'Torres', 'Pascual', '1948-11-03', 77, 'Female', 'Married', 'Retired Nurse', 12000.00, '09171234608', 'Registered', '1965-02-14', 'Active', 'https://i.pravatar.cc/150?img=46', 'QR-RES-2025-046'),
('RES-2025-047', 'H-2025-015', 'Child', 'Benedicto', 'Pascual', 'Pascual', '1975-05-29', 50, 'Male', 'Divorced', 'Engineer', 30000.00, '09171234609', 'Registered', '1975-05-29', 'Active', 'https://i.pravatar.cc/150?img=47', 'QR-RES-2025-047'),
('RES-2025-048', 'H-2025-015', 'Child', 'Bernadette', 'Pascual', 'Pascual', '1978-09-12', 47, 'Female', 'Married', 'Teacher', 22000.00, '09171234610', 'Registered', '1978-09-12', 'Active', 'https://i.pravatar.cc/150?img=48', 'QR-RES-2025-048'),

-- Additional scattered residents to reach 50 total
('RES-2025-049', 'H-2025-009', 'Boarder', 'Leonardo', 'Garcia', 'Silva', '1995-03-07', 30, 'Male', 'Single', 'Laborer', 10000.00, '09171234611', 'Registered', '2022-01-10', 'Active', 'https://i.pravatar.cc/150?img=49', 'QR-RES-2025-049'),
('RES-2025-050', 'H-2025-011', 'Relative', 'Felipe', 'Mendoza', 'Castro', '1960-07-22', 65, 'Male', 'Married', 'Retired', 9000.00, '09171234612', 'Registered', '2010-08-05', 'Active', 'https://i.pravatar.cc/150?img=50', 'QR-RES-2025-050');

-- Update household head references
UPDATE households SET Head_Resident_ID = 'RES-2025-001' WHERE Household_ID = 'H-2025-001';
UPDATE households SET Head_Resident_ID = 'RES-2025-005' WHERE Household_ID = 'H-2025-002';
UPDATE households SET Head_Resident_ID = 'RES-2025-008' WHERE Household_ID = 'H-2025-003';
UPDATE households SET Head_Resident_ID = 'RES-2025-010' WHERE Household_ID = 'H-2025-004';
UPDATE households SET Head_Resident_ID = 'RES-2025-015' WHERE Household_ID = 'H-2025-005';
UPDATE households SET Head_Resident_ID = 'RES-2025-016' WHERE Household_ID = 'H-2025-006';
UPDATE households SET Head_Resident_ID = 'RES-2025-007' WHERE Household_ID = 'H-2025-007';
UPDATE households SET Head_Resident_ID = 'RES-2025-018' WHERE Household_ID = 'H-2025-008';

-- Vulnerabilities Data (RBIM Compliance)
INSERT INTO vulnerabilities (Resident_ID, Is_4Ps, Is_PWD, Is_Solo_Parent, Is_Out_of_School_Youth, Disability_Type) VALUES
('RES-2025-001', TRUE, FALSE, FALSE, FALSE, NULL),
('RES-2025-002', FALSE, FALSE, FALSE, FALSE, NULL),
('RES-2025-005', FALSE, FALSE, FALSE, FALSE, NULL),
('RES-2025-006', FALSE, FALSE, FALSE, FALSE, NULL),
('RES-2025-007', TRUE, FALSE, FALSE, FALSE, NULL),
('RES-2025-008', FALSE, FALSE, TRUE, FALSE, NULL),
('RES-2025-014', FALSE, FALSE, FALSE, FALSE, NULL), -- Senior Citizen (auto-calculated)
('RES-2025-015', FALSE, FALSE, FALSE, FALSE, NULL), -- Senior Citizen (auto-calculated)
('RES-2025-016', FALSE, FALSE, FALSE, FALSE, NULL), -- Senior Citizen (auto-calculated)
('RES-2025-017', FALSE, TRUE, FALSE, FALSE, 'Mobility Impairment'), -- Senior + PWD
('RES-2025-018', FALSE, FALSE, FALSE, FALSE, NULL), -- Senior Citizen (auto-calculated)
('RES-2025-019', FALSE, FALSE, TRUE, FALSE, NULL), -- Solo Parent
('RES-2025-020', FALSE, TRUE, FALSE, TRUE, 'Hearing Impairment'); -- PWD + OSY

-- Blotter Cases (Sample - 10 cases - Updated for Katarungang Pambarangay compliance)
INSERT INTO blotter (Case_Number, Complainant_Details, Respondent_Details, Incident_Type, Narrative, DateTime_Incident, Location_Sitio, Status, Hearing_Schedule) VALUES
('BLOT-2024-11-0001', '{"Name": "Barangay Official", "Address": "Barangay Hall, Batia Proper", "Contact": "09123456789", "ID_Proof": "Official ID"}', '{"Name": "Juan Dela Cruz", "Address": "Block 1, Lot 1, Batia Proper", "Alias": null, "Contact": "09171234567"}', 'Noise Barrage', 'Complaint about excessive noise from neighbor''s party affecting residents', '2024-11-25 14:30:00', 'Batia Proper', 'Pending', NULL),
('BLOT-2024-11-0002', '{"Name": "Maria Santos", "Address": "Block 1, Lot 2, Batia Proper", "Contact": "09171234568", "ID_Proof": "Voter ID"}', '{"Name": "Pedro Garcia", "Address": "Block 1, Lot 3, Batia Proper", "Alias": null, "Contact": "09171234569"}', 'Family Dispute', 'Domestic dispute between family members regarding property inheritance', '2024-11-24 09:15:00', 'Batia Proper', 'Pending', NULL),
('BLOT-2024-11-0003', '{"Name": "Barangay Official", "Address": "Barangay Hall, Batia Proper", "Contact": "09123456789", "ID_Proof": "Official ID"}', NULL, 'Illegal Parking', 'Unauthorized parking blocking public road and emergency access', '2024-11-23 16:45:00', 'Batia Proper', 'Scheduled for Mediation', '2024-11-28 10:00:00'),
('BLOT-2024-11-0004', '{"Name": "Elena Gonzales", "Address": "Block 2, Lot 3, Batia Proper", "Contact": "09171234572", "ID_Proof": "Driver License"}', '{"Name": "Roberto Fernandez", "Address": "Block 3, Lot 1, Batia Proper", "Alias": null, "Contact": "09171234573"}', 'Unjust Vexation', 'Continuous harassment and verbal abuse causing emotional distress', '2024-11-22 11:20:00', 'Batia Proper', 'Pending', NULL),
('BLOT-2024-11-0005', '{"Name": "Pedro Garcia", "Address": "Block 1, Lot 3, Batia Proper", "Contact": "09171234569", "ID_Proof": "Voter ID"}', '{"Name": "Carmen Lopez", "Address": "Block 3, Lot 2, Batia Proper", "Alias": null, "Contact": "09171234574"}', 'Malicious Mischief', 'Property damage caused by intentional vandalism', '2024-11-21 13:10:00', 'Batia Proper', 'Amicably Settled', NULL),
('BLOT-2024-11-0006', '{"Name": "Barangay Official", "Address": "Barangay Hall, Northville 5", "Contact": "09123456789", "ID_Proof": "Official ID"}', NULL, 'Stray Animals', 'Stray dogs roaming freely and causing disturbance to residents', '2024-11-15 08:30:00', 'Northville 5', 'Amicably Settled', NULL),
('BLOT-2024-11-0007', '{"Name": "Rosa Aquino", "Address": "Block 4, Lot 3, Batia Proper", "Contact": "09171234578", "ID_Proof": "Senior Citizen ID"}', NULL, 'Medical Emergency', 'Senior citizen requires immediate medical assistance', '2024-11-14 19:45:00', 'Northville 5', 'Amicably Settled', NULL),
('BLOT-2024-11-0008', '{"Name": "Francisco Bautista", "Address": "Block 5, Lot 3, Batia Proper", "Contact": "09171234581", "ID_Proof": "Voter ID"}', '{"Name": "Hector Vega", "Address": "Block 6, Lot 2, Batia Proper", "Alias": null, "Contact": "09171234583"}', 'Theft (Petty)', 'Personal belongings stolen from residence', '2024-11-13 14:20:00', 'Northville 5', 'Certificate to File Action Issued', NULL),
('BLOT-2024-11-0009', '{"Name": "Barangay Official", "Address": "Barangay Hall, St. Martha", "Contact": "09123456789", "ID_Proof": "Official ID"}', NULL, 'Waste Management', 'Illegal dumping of waste in public areas', '2024-11-12 10:15:00', 'St. Martha', 'Amicably Settled', NULL),
('BLOT-2024-11-0010', '{"Name": "Cristina Pascual", "Address": "Block 7, Lot 2, Batia Proper", "Contact": "09171234586", "ID_Proof": "Professional ID"}', NULL, 'Collection of Sum of Money', 'Unpaid debt collection dispute requiring mediation', '2024-11-11 16:30:00', 'St. Martha', 'Amicably Settled', NULL);

-- Certificate Types (Dynamic certificate types - removed hardcoded data from server)
INSERT INTO certificate_types (name, fee, validity_days, description, purpose, when_needed, required_data) VALUES
('Barangay Indigency', 0.00, 90, 'Proving a resident has no or limited income.', 'To qualify the resident for financial discount', 'For assistance', '["Full Name of Applicant", "Complete Address", "Categorical Statement", "Specific Purpose", "Date of Issuance and Validity", "Signature of Barangay Captain and Secretary"]'),
('Barangay Residency', 30.00, 180, 'Certifies an individual\'s residence within the barangay', 'Confirms that an individual is a resident of the barangay.', 'Applying for government ID, Business permit, License', '["Full name of the resident.", "Address within the barangay.", "Period of residency (start date and up to present).", "Purpose for which the certificate is issued.", "Date of issuance and signature of the Barangay Captain and Secretary", "Barangay seal and control number."]'),
('Barangay Certification', 25.00, 180, 'Specific information of individuals', 'Proof or Residency, Legal Administrative Confirmation', 'Applying for government ID, Business permit', '["Full name of individual", "Complete address", "Date of residency or length of stay.", "Purpose of the certification", "Date of issuance of the certificate.", "Signature of the Punong Barangay or authorized official.", "Barangay seal or stamp to authenticate the document."]'),
('Barangay Clearance', 50.00, 365, 'Proves you have no issue or file complaint', 'Certify a person is law-abiding resident', 'Apply for other clearances / job', '["Valid ID", "Proof of Residency", "CEDULA", "Purpose", "Payment", "Personal Information (Name, Date of Birth, Address, Contact Number, Length of stay in barangay)", "Signature of Barangay Captain and Secretary"]'),
('Business Clearance', 100.00, 365, 'Business allowed to operate in the barangay', 'Verify Business is legitimate and follow the barangay regulation', 'Register or Renew your Business', '["Business Name", "Business Address", "Name of Owner", "Type of Business", "Valid ID of Owner", "Barangay Residency", "CEDULA", "Payment", "Signature of Barangay Captain and Secretary"]'),
('Oath of Undertaking', 25.00, 180, 'Individual promises to follow certain rules and responsibility', 'Show a person\'s commitment to comply with rules, serves as a supporting document for the legal process.', 'Need to promise compliance with government requirements, Register for certain ID\'s', '["Full Name of the Person", "Address", "Statement of the promise/undertaking", "Date signed", "Signature of the applicant", "Signature and Seal of the official administering the oath"]'),
('Good Moral', 25.00, 180, 'A person has good behavior, no major issues and conduct themselves properly', 'Prove a person that has good character, Support Application', 'Enroll or Transfer in School, Apply for Scholarship or Job', '["Full Name of the Person", "Date of Birth", "Address", "School year or Purpose", "Name of barangay/school issuing the certificate", "Statement confirming good moral character", "Signature of the issuing officer", "Date Issued"]'),
('Low Income Certificate', 0.00, 90, 'Certifies a person or family belongs to the low-income sector', 'Prove a person or family has limited financial resources, Eligibility for discounts, social services, qualify for medical assistance', 'Applying scholarship, Applying for government assistance programs, Processing social welfare documents', '["Full Name of Applicant", "Address / Proof of Residency", "Valid ID", "Household Information (Number of Family Member)", "Source of Income", "Estimate Monthly Income", "Purpose of the Certificate", "Date of Issuance", "Signature of Barangay Captain and Secretary"]'),
('Birth Certificate', 50.00, 0, 'Local Civil Registry that records a person\'s birth details', 'Prove\'s a person identity, age, citizenship / Support Legal Transaction / Serves as a requirements', 'Enrollment, Applying Government ID / Employment, Processing Marriage/Divorce', '["Full Name of the Child", "Date and place of Birth", "Sex/Gender", "Full Name of Parents", "Nationality of Parents", "Occupation of Parents", "Address of parents at the time of birth", "Registration Number / PSA Serial Number", "Date of Registration", "Signature of the Civil Registrar", "Barangay Seal"]');

-- Certificates (Sample - 10 certificates)
INSERT INTO certificates_log (control_no, resident_id, certificate_type, purpose, date_issued, signatory_captain, signatory_secretary, qr_validation_string, status, fee_amount) VALUES
('CERT-2024-001', 'RES-2025-001', 'Barangay Clearance', 'Job Application at ABC Corporation', '2024-11-25', 'Captain Juan Dela Cruz', 'Secretary Maria Santos', 'QR-CERT-2024-001-ABC123', 'Released', 50.00),
('CERT-2024-002', 'RES-2025-002', 'Barangay Clearance', 'Bank Loan Application', '2024-11-24', 'Captain Juan Dela Cruz', 'Secretary Maria Santos', 'QR-CERT-2024-002-DEF456', 'Released', 50.00),
('CERT-2024-003', 'RES-2025-005', 'Barangay Clearance', 'Business Permit Application', '2024-11-23', 'Captain Juan Dela Cruz', 'Secretary Maria Santos', 'QR-CERT-2024-003-GHI789', 'Released', 50.00),
('CERT-2024-004', 'RES-2025-007', 'Barangay Clearance', 'Government Employment', '2024-11-22', 'Captain Juan Dela Cruz', 'Secretary Maria Santos', 'QR-CERT-2024-004-JKL012', 'Released', 50.00),
('CERT-2024-005', 'RES-2025-011', 'Barangay Clearance', 'Overseas Employment', '2024-11-21', 'Captain Juan Dela Cruz', 'Secretary Maria Santos', 'QR-CERT-2024-005-MNO345', 'Released', 50.00),
('CERT-2024-006', 'RES-2025-003', 'Barangay Residency', 'School Enrollment', '2024-11-15', 'Captain Juan Dela Cruz', 'Secretary Maria Santos', 'QR-CERT-2024-006-EFG123', 'Released', 30.00),
('CERT-2024-007', 'RES-2025-004', 'Certificate of Indigency', 'Medical Assistance Application', '2024-11-10', 'Captain Juan Dela Cruz', 'Secretary Maria Santos', 'QR-CERT-2024-007-TUV678', 'Released', 0.00),
('CERT-2024-008', 'RES-2025-006', 'Barangay Residency', 'Bank Account Opening', '2024-11-14', 'Captain Juan Dela Cruz', 'Secretary Maria Santos', 'QR-CERT-2024-008-HIJ456', 'Released', 30.00),
('CERT-2024-009', 'RES-2025-010', 'Certificate of Indigency', 'Scholarship Application', '2024-11-09', 'Captain Juan Dela Cruz', 'Secretary Maria Santos', 'QR-CERT-2024-009-WXY901', 'Released', 0.00),
('CERT-2024-010', 'RES-2025-019', 'Business Clearance', 'Sari-sari Store Operation', '2024-11-05', 'Captain Juan Dela Cruz', 'Secretary Maria Santos', 'QR-CERT-2024-010-IJK123', 'Released', 100.00);

-- Tanod Patrol Schedules (Sample - 5 schedules)
INSERT INTO tanod_patrol_schedule (patrol_area, sitio_id, assigned_tanods, shift_start, shift_end, patrol_date, status, ai_recommended, notes) VALUES
('Batia Proper - Central Area', 1, '["Tanod Mario", "Tanod Jose"]', '06:00:00', '12:00:00', '2024-11-26', 'Active', FALSE, 'Morning patrol of main commercial area'),
('Batia Proper - Residential Blocks', 1, '["Tanod Pedro", "Tanod Juan"]', '12:00:00', '18:00:00', '2024-11-26', 'Scheduled', TRUE, 'Afternoon patrol focusing on residential safety'),
('Northville 5 - Phase 1 Patrol', 2, '["Tanod Carlos", "Tanod Daniel"]', '07:00:00', '13:00:00', '2024-11-26', 'Active', FALSE, 'Morning coverage of Phase 1 residential area'),
('St. Martha - Villa Patrol', 3, '["Tanod Gabriel", "Tanod Henry"]', '08:00:00', '14:00:00', '2024-11-26', 'Scheduled', FALSE, 'Morning patrol of villa communities'),
('AFP/PNP - Camp Security', 4, '["Sgt. Lucas", "Cpl. Nathan"]', '06:00:00', '18:00:00', '2024-11-26', 'Active', FALSE, 'Standard military police patrol');

-- Community Programs (Sample - 3 programs)
INSERT INTO community_programs (program_name, description, program_date, sitio_id, target_beneficiaries, status, organizer, budget_allocated, actual_cost, participants_count, success_rating, notes) VALUES
('Christmas Relief Distribution 2024', 'Distribution of food packs and gifts for low-income families during Christmas season', '2024-12-20', 1, '["Low-income families", "Single parents", "Senior citizens", "PWDs"]', 'Planned', 'Barangay Captain', 50000.00, 0.00, 0, NULL, 'Annual Christmas program for vulnerable residents'),
('Senior Citizens Health Seminar', 'Health awareness and checkup session for senior citizens', '2024-11-30', 1, '["Senior citizens", "Elderly residents"]', 'Completed', 'Health Center', 8000.00, 7500.00, 45, 5, 'Well-attended seminar with free blood pressure monitoring'),
('Environmental Clean-up Drive', 'Community clean-up of streets, drainage, and public spaces', '2024-11-25', 1, '["All residents", "Community volunteers"]', 'Completed', 'Environmental Committee', 5000.00, 4800.00, 78, 4, 'Collected 15 sacks of garbage, improved drainage systems');

-- Audit Logs (Sample - 5 entries)
INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES
(1, 'Certificate Issued', 'certificate', 'CERT-2024-001', 'Barangay Clearance issued', '192.168.1.100', 'Chrome'),
(2, 'Blotter Created', 'blotter', 'CASE-2024-001', 'Noise complaint filed', '192.168.1.101', 'Chrome'),
(1, 'Resident Updated', 'resident', '1', 'Profile updated', '192.168.1.100', 'Chrome'),
(3, 'Certificate Issued', 'certificate', 'CERT-2024-006', 'Barangay Residency issued', '192.168.1.102', 'Chrome'),
(2, 'Blotter Resolved', 'blotter', 'CASE-2024-006', 'Case resolved', '192.168.1.101', 'Chrome');

-- ==========================================
-- SETUP COMPLETE
-- ==========================================

COMMIT;

-- ==========================================
-- SUMMARY
-- ==========================================
/*
BARANGAY MANAGEMENT SYSTEM - READY FOR TESTING!

✅ DATABASE CREATED WITH:
   - 9 Core Tables (sitios, households, residents, vulnerabilities, blotter, certificates, officials, users, audit_log, tanod_schedule, community_programs)

✅ MOCK DATA INSERTED:
   - 4 Sitios (Batia Proper, Northville 5, St. Martha, AFP/PNP)
   - 15 Households with complete family structures
   - 50 Residents with complete RBIM profiles
   - 3 Officials (Captain, Secretary, Clerk)
   - 3 User Accounts (captain/secretary/clerk)
   - 13 Vulnerability records (4Ps, PWD, Senior, Solo Parent, OSY)
   - 10 Sample Blotter Cases
   - 10 Sample Certificates
   - 5 Tanod Patrol Schedules
   - 3 Community Programs
   - 5 Audit Log Entries

✅ BUSINESS RULES READY TO TEST:
   - RBIM-compliant resident profiling
   - Certificate blocking for active blotter cases
   - QR code validation system
   - AI patrol recommendations
   - Social aid priority scoring
   - Vulnerability assessment
   - Household management
   - User role permissions

LOGIN CREDENTIALS:
- Username: captain, secretary, clerk
- Password: (bcrypt hashed - reset if needed)

START TESTING YOUR BARANGAY SYSTEM! 🎉
*/
