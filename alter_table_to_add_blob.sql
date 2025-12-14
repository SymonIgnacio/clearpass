-- Add missing BLOB columns to resident_verification_requests table

USE barangay_management;

ALTER TABLE resident_verification_requests
ADD COLUMN file_data LONGBLOB NULL COMMENT 'Binary file data stored in database',
ADD COLUMN file_encoding VARCHAR(50) NULL COMMENT 'File encoding type (e.g., buffer)',
ADD COLUMN original_filename VARCHAR(255) NULL COMMENT 'Original uploaded filename',
ADD COLUMN mime_type VARCHAR(100) NULL COMMENT 'File MIME type (e.g., image/jpeg)',
ADD COLUMN file_size INT NULL COMMENT 'File size in bytes';

-- Update existing records to have proper timestamps
UPDATE resident_verification_requests
SET updated_at = NOW()
WHERE updated_at IS NULL;

-- Show the updated table structure
DESCRIBE resident_verification_requests;
