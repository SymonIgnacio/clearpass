-- Migration: Add indexes for query optimization
-- Created: 2024-12-12
-- Description: Adds indexes to frequently queried columns

-- Residents table indexes
CREATE INDEX IF NOT EXISTS idx_residents_household ON residents(Household_ID);
CREATE INDEX IF NOT EXISTS idx_residents_status ON residents(Residency_Status);
CREATE INDEX IF NOT EXISTS idx_residents_name ON residents(Last_Name, First_Name);
CREATE INDEX IF NOT EXISTS idx_residents_birthdate ON residents(Birthdate);

-- Blotter table indexes
CREATE INDEX IF NOT EXISTS idx_blotter_status ON blotter(Status);
CREATE INDEX IF NOT EXISTS idx_blotter_respondent ON blotter(respondent_id);
CREATE INDEX IF NOT EXISTS idx_blotter_created ON blotter(created_at);
CREATE INDEX IF NOT EXISTS idx_blotter_sitio ON blotter(Location_Sitio);

-- Certificates table indexes
CREATE INDEX IF NOT EXISTS idx_certificates_resident ON certificates_log(resident_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates_log(status);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates_log(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificates_date ON certificates_log(date_issued);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_resident ON users(resident_id);

-- Households table indexes
CREATE INDEX IF NOT EXISTS idx_households_sitio ON households(Sitio_ID);

-- Vulnerabilities table indexes
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_resident ON vulnerabilities(Resident_ID);
