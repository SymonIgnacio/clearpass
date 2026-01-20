ALTER TABLE certificate_types DROP COLUMN fee;
ALTER TABLE certificates_log DROP COLUMN fee_amount;
-- Also check if document_requests has fee info, usually not but let's check
-- ALTER TABLE document_requests DROP COLUMN fee_amount; -- Commented out unless verified
