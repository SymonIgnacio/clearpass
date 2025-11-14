-- Mock Data for Barangay Management System
-- Based on Barangay Batia survey data

-- Insert Sitios (4 sitios as mentioned in survey)
INSERT INTO sitios (name, description) VALUES
('Batia Proper', 'Central sitio of Barangay Batia'),
('Northville 5', 'Northern residential area'),
('St. Martha', 'Eastern residential subdivision'),
('AFP/PNP', 'Military and police housing area');

-- Insert Users (Staff and some residents)
INSERT INTO users (username, password, role, email, phone, is_active) VALUES
('admin', '$2b$10$hash', 'admin', 'admin@barangaybatia.gov.ph', '09171234567', TRUE),
('captain', '$2b$10$hash', 'captain', 'captain@barangaybatia.gov.ph', '09171234568', TRUE),
('secretary', '$2b$10$hash', 'secretary', 'secretary@barangaybatia.gov.ph', '09171234569', TRUE),
('clerk', '$2b$10$hash', 'clerk', 'clerk@barangaybatia.gov.ph', '09171234570', TRUE),
('blotter_officer', '$2b$10$hash', 'blotter_officer', 'blotter@barangaybatia.gov.ph', '09171234571', TRUE),
('issuance_officer', '$2b$10$hash', 'issuance_officer', 'issuance@barangaybatia.gov.ph', '09171234572', TRUE),
('juan.dela.cruz', '$2b$10$hash', 'resident', 'juan@email.com', '09171234573', TRUE),
('maria.santos', '$2b$10$hash', 'resident', 'maria@email.com', '09171234574', TRUE),
('pedro.garcia', '$2b$10$hash', 'resident', 'pedro@email.com', '09171234575', TRUE),
('ana.reyes', '$2b$10$hash', 'resident', 'ana@email.com', '09171234576', TRUE);

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

-- Insert Residents (Sample data representing ~48,000 population)
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

-- Insert Households
INSERT INTO households (household_head_id, sitio_id, house_number, street, total_members, total_income, house_type) VALUES
(1, 1, '123', 'Main Street', 4, 15000.00, 'Owned'),
(2, 1, '124', 'Main Street', 2, 25000.00, 'Rented'),
(3, 2, '45', 'North Avenue', 5, 18000.00, 'Owned'),
(4, 3, '67', 'Martha Street', 1, 8000.00, 'Owned'),
(5, 4, '89', 'AFP Road', 3, 16000.00, 'Rented'),
(6, 1, '101', 'Central Avenue', 4, 35000.00, 'Owned'),
(7, 2, '23', 'Northville Street', 6, 20000.00, 'Owned'),
(8, 3, '156', 'St. Martha Avenue', 2, 40000.00, 'Rented'),
(9, 4, '78', 'PNP Street', 3, 22000.00, 'Owned'),
(10, 1, '234', 'Proper Street', 3, 0.00, 'Shared');

-- Insert Household Members
INSERT INTO household_members (household_id, resident_id, relationship) VALUES
(1, 1, 'Head'),
(2, 2, 'Head'),
(3, 3, 'Head'),
(4, 4, 'Head'),
(5, 5, 'Head'),
(6, 6, 'Head'),
(7, 7, 'Head'),
(8, 8, 'Head'),
(9, 9, 'Head'),
(10, 10, 'Head');

-- Insert Blotter Records (Sample incidents)
INSERT INTO blotter_records (case_number, complainant_id, respondent_id, respondent_name, incident_type, incident_date, incident_time, location, sitio_id, description, status, severity, recorded_by) VALUES
('BLT-2024-001', 1, 3, 'Pedro Ramos Garcia', 'Noise Complaint', '2024-01-15', '22:30:00', 'North Avenue', 2, 'Loud music during late hours disturbing neighbors', 'resolved', 'minor', 5),
('BLT-2024-002', 2, NULL, 'Unknown', 'Theft', '2024-01-20', '14:00:00', 'Main Street', 1, 'Motorcycle parts stolen from parking area', 'active', 'moderate', 5),
('BLT-2024-003', 4, 5, 'Roberto Mendoza Silva', 'Verbal Altercation', '2024-02-05', '16:45:00', 'Martha Street', 3, 'Argument over property boundary', 'active', 'minor', 5),
('BLT-2024-004', 6, 7, 'Jose Fernandez Morales', 'Traffic Incident', '2024-02-10', '08:15:00', 'Central Avenue', 1, 'Minor vehicle collision, no injuries', 'resolved', 'minor', 5),
('BLT-2024-005', 8, NULL, 'Unknown', 'Vandalism', '2024-02-15', '03:00:00', 'St. Martha Avenue', 3, 'Graffiti on residential wall', 'dismissed', 'minor', 5);

-- Insert Certificates (Sample issued certificates)
INSERT INTO certificates (certificate_number, resident_id, certificate_type_id, purpose, issued_by, approved_by, status, issue_date, expiry_date, fee_paid, qr_code) VALUES
('CERT-2024-001', 1, 1, 'Employment requirement', 6, 2, 'approved', '2024-01-10', '2025-01-10', 50.00, 'QR-CERT-001'),
('CERT-2024-002', 2, 2, 'Business permit application', 6, 2, 'approved', '2024-01-12', '2025-01-12', 30.00, 'QR-CERT-002'),
('CERT-2024-003', 3, 3, 'Medical assistance', 6, 2, 'approved', '2024-01-15', '2024-07-15', 20.00, 'QR-CERT-003'),
('CERT-2024-004', 4, 5, 'School enrollment', 6, 2, 'approved', '2024-01-18', '2025-01-18', 25.00, 'QR-CERT-004'),
('CERT-2024-005', 5, 1, 'Job application', 6, 2, 'approved', '2024-01-20', '2025-01-20', 50.00, 'QR-CERT-005'),
('CERT-2024-006', 6, 2, 'Government ID application', 6, 2, 'approved', '2024-01-22', '2025-01-22', 30.00, 'QR-CERT-006'),
('CERT-2024-007', 7, 4, 'Sari-sari store permit', 6, 2, 'approved', '2024-01-25', '2025-01-25', 100.00, 'QR-CERT-007'),
('CERT-2024-008', 8, 6, 'Scholarship application', 6, 2, 'approved', '2024-01-28', '2024-07-28', 15.00, 'QR-CERT-008');

-- Insert Business Permits
INSERT INTO business_permits (permit_number, business_name, business_type, owner_id, business_address, sitio_id, status, issue_date, expiry_date, fee_paid, issued_by) VALUES
('BP-2024-001', 'Maria\'s Sari-Sari Store', 'Retail Store', 2, '124 Main Street, Batia Proper', 1, 'active', '2024-01-15', '2025-01-15', 500.00, 6),
('BP-2024-002', 'Pedro\'s Construction Services', 'Construction', 3, '45 North Avenue, Northville 5', 2, 'active', '2024-02-01', '2025-02-01', 750.00, 6),
('BP-2024-003', 'Carmen\'s Tutorial Center', 'Educational Services', 6, '101 Central Avenue, Batia Proper', 1, 'active', '2024-02-10', '2025-02-10', 600.00, 6);

-- Insert QR Sessions (Sample active sessions)
INSERT INTO qr_sessions (session_code, resident_id, is_used, expires_at) VALUES
('QR-SESS-001', 1, FALSE, DATE_ADD(NOW(), INTERVAL 1 HOUR)),
('QR-SESS-002', 2, TRUE, DATE_ADD(NOW(), INTERVAL -1 HOUR)),
('QR-SESS-003', 3, FALSE, DATE_ADD(NOW(), INTERVAL 2 HOUR));

-- Insert Certificate Requests (Online requests)
INSERT INTO certificate_requests (request_number, resident_id, certificate_type_id, purpose, qr_session_id, status, requested_at, processed_by) VALUES
('REQ-2024-001', 1, 1, 'New job application', 1, 'pending', NOW(), NULL),
('REQ-2024-002', 2, 2, 'License renewal', 2, 'ready', DATE_SUB(NOW(), INTERVAL 1 DAY), 6),
('REQ-2024-003', 3, 3, 'Hospital assistance', 3, 'processing', DATE_SUB(NOW(), INTERVAL 2 HOUR), 6);

-- Insert System Settings
INSERT INTO system_settings (setting_key, setting_value, description, updated_by) VALUES
('barangay_name', 'Barangay Batia', 'Official name of the barangay', 1),
('barangay_captain', 'Hon. [Captain Name]', 'Current Barangay Captain', 1),
('barangay_secretary', 'Ms. Maria Cruz', 'Current Barangay Secretary', 1),
('certificate_validity_days', '365', 'Default validity period for certificates', 1),
('qr_session_duration', '60', 'QR session duration in minutes', 1),
('max_certificates_per_session', '5', 'Maximum certificates per QR session', 1),
('blotter_auto_block', 'true', 'Auto-block certificate issuance for active blotters', 1),
('population_count', '48000', 'Approximate total population', 1);

-- Insert Audit Logs (Sample activity logs)
INSERT INTO audit_logs (user_id, action, table_name, record_id, ip_address, user_agent) VALUES
(2, 'CREATE_CERTIFICATE', 'certificates', 1, '192.168.1.100', 'Mozilla/5.0'),
(3, 'UPDATE_RESIDENT', 'residents', 1, '192.168.1.101', 'Mozilla/5.0'),
(5, 'CREATE_BLOTTER', 'blotter_records', 1, '192.168.1.102', 'Mozilla/5.0'),
(6, 'APPROVE_CERTIFICATE', 'certificates', 1, '192.168.1.103', 'Mozilla/5.0');