-- Migration Script for Phase 2: Barangay Management System Upgrade
-- Updates blotter_records status enum to match survey requirements
-- Adds performance indexes

USE barangay_batia;

-- Step 1: Update existing blotter_records status values to match new terminology
-- Map 'active' -> 'Pending', 'referred' -> 'Forwarded to Lupon'
UPDATE blotter_records SET status = 'pending_temp' WHERE status = 'active';
UPDATE blotter_records SET status = 'forwarded_temp' WHERE status = 'referred';

-- Step 2: Modify the blotter_records table to use new status enum
ALTER TABLE blotter_records 
MODIFY COLUMN status ENUM('Pending', 'Resolved', 'Forwarded to Lupon', 'Dismissed') DEFAULT 'Pending';

-- Step 3: Update the temporary status values to final values
UPDATE blotter_records SET status = 'Pending' WHERE status = 'pending_temp';
UPDATE blotter_records SET status = 'Resolved' WHERE status = 'resolved';
UPDATE blotter_records SET status = 'Forwarded to Lupon' WHERE status = 'forwarded_temp';
UPDATE blotter_records SET status = 'Dismissed' WHERE status = 'dismissed';

-- Step 4: Add performance indexes
-- Index for certificate lookups by resident
CREATE INDEX idx_certificates_resident ON certificates(resident_id);

-- Index for blotter lookups by status (critical for certificate validation)
CREATE INDEX idx_blotter_status ON blotter_records(status);

-- Index for blotter lookups by resident (for checking active cases)
CREATE INDEX idx_blotter_complainant ON blotter_records(complainant_id);
CREATE INDEX idx_blotter_respondent ON blotter_records(respondent_id);

-- Index for resident lookups by sitio (for census statistics)
CREATE INDEX idx_residents_sitio ON residents(sitio_id);

-- Index for faster gender and special category filtering
CREATE INDEX idx_residents_demographics ON residents(gender, is_senior, is_pwd, is_single_parent);

-- Step 5: Add a new column to track if certificate issuance was blocked by blotter
ALTER TABLE certificates 
ADD COLUMN blotter_override BOOLEAN DEFAULT FALSE COMMENT 'TRUE if certificate was issued despite active blotter case',
ADD COLUMN blotter_check_date TIMESTAMP NULL COMMENT 'When blotter status was checked';

-- Verify the changes
SELECT 'Migration completed successfully!' as status;
SELECT 'Current blotter statuses:' as info;
SELECT status, COUNT(*) as count FROM blotter_records GROUP BY status;
