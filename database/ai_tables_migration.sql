-- =======================================================================================================
-- AI FEATURES DATABASE TABLES MIGRATION
-- =======================================================================================================
-- This file creates all database tables needed for AI features:
-- 1. BANTAY Chatbot
-- 2. Ronda.ai Analytics
-- 3. OCR Auto-fill System
--
-- Run this after the main database setup
-- =======================================================================================================

USE barangay_management;

-- ==========================================
-- 1. BANTAY CHATBOT TABLES
-- ==========================================

-- Table: AI Chatbot Conversations (logs all conversations)
CREATE TABLE IF NOT EXISTS ai_chatbot_conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) NOT NULL,  -- Unique session identifier
    user_id INT NULL,  -- Links to users table if logged in
    resident_id VARCHAR(50) NULL,  -- Links to residents if identified
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    intent_detected VARCHAR(100) NULL,  -- Detected intent (e.g., 'certificate_request', 'faq_office_hours')
    confidence_score DECIMAL(3,2) NULL,  -- Confidence in intent detection (0.00-1.00)
    appointment_booked BOOLEAN DEFAULT FALSE,  -- Whether an appointment was booked
    appointment_details JSON NULL,  -- Appointment data if booked
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chatbot_session (session_id),
    INDEX idx_chatbot_user (user_id),
    INDEX idx_chatbot_resident (resident_id),
    INDEX idx_chatbot_intent (intent_detected),
    INDEX idx_chatbot_date (created_at)
);

-- Table: AI Chatbot FAQ (predefined Q&A pairs)
CREATE TABLE IF NOT EXISTS ai_chatbot_faq (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(100) NOT NULL,  -- e.g., 'office_hours', 'requirements', 'procedures'
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT NULL,  -- Comma-separated keywords for matching
    priority INT DEFAULT 1,  -- Higher priority = more important FAQ
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,  -- Track how often this FAQ is accessed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_faq_category (category),
    INDEX idx_faq_keywords (keywords(255)),
    INDEX idx_faq_priority (priority),
    INDEX idx_faq_active (is_active)
);

-- Table: AI Appointments (booked through chatbot)
CREATE TABLE IF NOT EXISTS ai_appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resident_id VARCHAR(50) NULL,  -- Links to residents if identified
    visitor_name VARCHAR(255) NOT NULL,
    visitor_contact VARCHAR(20) NOT NULL,
    appointment_type ENUM('certificate_request', 'blotter_filing', 'complaint', 'inquiry', 'other') NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    preferred_time_slot VARCHAR(50) NULL,  -- e.g., 'morning', 'afternoon'
    purpose TEXT NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    assigned_staff VARCHAR(100) NULL,  -- Staff member assigned to handle
    notes TEXT NULL,
    chatbot_session_id VARCHAR(255) NULL,  -- Link back to conversation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_appointments_resident (resident_id),
    INDEX idx_appointments_date (appointment_date),
    INDEX idx_appointments_type (appointment_type),
    INDEX idx_appointments_status (status),
    INDEX idx_appointments_session (chatbot_session_id)
);

-- ==========================================
-- 2. RONDA.AI ANALYTICS TABLES
-- ==========================================

-- Table: AI Analytics Cache (store computed analytics data)
CREATE TABLE IF NOT EXISTS ai_analytics_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cache_key VARCHAR(255) NOT NULL UNIQUE,  -- Unique identifier for cached data
    data_type ENUM('incident_trends', 'sitio_stats', 'predictive_model', 'report_data') NOT NULL,
    parameters JSON NULL,  -- Query parameters used to generate this cache
    cached_data JSON NOT NULL,  -- The actual cached analytics data
    expires_at TIMESTAMP NOT NULL,  -- When this cache expires
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cache_key (cache_key),
    INDEX idx_cache_type (data_type),
    INDEX idx_cache_expires (expires_at),
    INDEX idx_cache_accessed (last_accessed)
);

-- Table: AI Predictive Models (store model coefficients/parameters)
CREATE TABLE IF NOT EXISTS ai_predictive_models (
    id INT PRIMARY KEY AUTO_INCREMENT,
    model_name VARCHAR(100) NOT NULL,  -- e.g., 'incident_prediction', 'resource_allocation'
    model_version VARCHAR(20) NOT NULL,  -- Version number
    model_type ENUM('linear_regression', 'time_series', 'classification', 'clustering') NOT NULL,
    parameters JSON NOT NULL,  -- Model coefficients/parameters
    training_data_info JSON NULL,  -- Info about training data used
    accuracy_metrics JSON NULL,  -- Model performance metrics
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_models_name (model_name),
    INDEX idx_models_type (model_type),
    INDEX idx_models_active (is_active)
);

-- Table: AI Analytics Reports (generated reports)
CREATE TABLE IF NOT EXISTS ai_analytics_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_type ENUM('incident_analysis', 'trend_report', 'predictive_forecast', 'resource_allocation') NOT NULL,
    report_title VARCHAR(255) NOT NULL,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    generated_by INT NULL,  -- User who generated the report
    report_data JSON NOT NULL,  -- Complete report data
    file_path VARCHAR(500) NULL,  -- Path to generated PDF if saved
    download_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reports_type (report_type),
    INDEX idx_reports_date (date_range_start, date_range_end),
    INDEX idx_reports_user (generated_by)
);

-- ==========================================
-- 3. OCR AUTO-FILL TABLES
-- ==========================================

-- Table: AI OCR Cache (store processed OCR results)
CREATE TABLE IF NOT EXISTS ai_ocr_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    original_filename VARCHAR(255) NOT NULL,
    file_hash VARCHAR(128) NOT NULL UNIQUE,  -- SHA-256 hash of file for deduplication
    ocr_text TEXT NOT NULL,  -- Raw OCR extracted text
    confidence_score DECIMAL(3,2) NULL,  -- OCR confidence score
    extracted_fields JSON NULL,  -- Parsed field data (name, address, etc.)
    document_type ENUM('barangay_id', 'drivers_license', 'passport', 'certificate', 'form', 'other') NULL,
    processing_status ENUM('success', 'partial', 'failed') DEFAULT 'success',
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INT DEFAULT 0,
    INDEX idx_ocr_hash (file_hash),
    INDEX idx_ocr_type (document_type),
    INDEX idx_ocr_status (processing_status),
    INDEX idx_ocr_accessed (last_accessed)
);

-- Table: AI OCR Field Mappings (configurable field extraction patterns)
CREATE TABLE IF NOT EXISTS ai_ocr_field_mappings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    regex_pattern TEXT NOT NULL,  -- Regex pattern for field extraction
    validation_rules JSON NULL,  -- Validation rules for extracted data
    priority INT DEFAULT 1,  -- Priority order for field extraction
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_mappings_type (document_type),
    INDEX idx_mappings_field (field_name),
    INDEX idx_mappings_active (is_active)
);

-- ==========================================
-- 4. SYSTEM TABLES
-- ==========================================

-- Table: AI System Logs (comprehensive logging for all AI operations)
CREATE TABLE IF NOT EXISTS ai_system_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    component VARCHAR(50) NOT NULL,  -- 'chatbot', 'analytics', 'ocr', 'predictive'
    operation VARCHAR(100) NOT NULL,  -- Specific operation performed
    user_id INT NULL,
    session_id VARCHAR(255) NULL,
    input_data JSON NULL,  -- Input parameters/data
    output_data JSON NULL,  -- Response/result data
    processing_time_ms INT NULL,  -- Processing time in milliseconds
    status ENUM('success', 'warning', 'error') DEFAULT 'success',
    error_message TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_logs_component (component),
    INDEX idx_logs_operation (operation),
    INDEX idx_logs_user (user_id),
    INDEX idx_logs_session (session_id),
    INDEX idx_logs_status (status),
    INDEX idx_logs_date (created_at)
);

-- ==========================================
-- INITIAL DATA INSERTION
-- ==========================================

-- Insert default FAQ data
INSERT INTO ai_chatbot_faq (category, question, answer, keywords, priority) VALUES
('office_hours', 'What are your office hours?', 'Our barangay office is open from Monday to Friday, 8:00 AM to 5:00 PM, and Saturday from 8:00 AM to 12:00 NN. We are closed on Sundays and holidays.', 'hours, open, closed, time, schedule', 10),
('requirements', 'What are the requirements for barangay clearance?', 'Requirements for Barangay Clearance:\n1. Valid ID (any government-issued)\n2. Proof of residency (utility bill, lease agreement, etc.)\n3. Community Tax Certificate (Cedula)\n4. Payment of P50.00 fee\nProcessing time: 10-15 minutes', 'clearance, requirements, documents, needed, cedula', 9),
('procedures', 'How do I file a blotter report?', 'To file a blotter report:\n1. Come to the barangay office with your valid ID\n2. Bring at least one witness if possible\n3. Provide detailed narrative of the incident\n4. Peace officers will mediate and document the complaint\n5. Processing time: 30-60 minutes', 'blotter, report, complaint, incident, file', 8),
('contact', 'How can I contact the barangay?', 'You can reach us through:\n📞 Phone: (02) 123-4567\n📧 Email: info@barangay-batia.gov.ph\n📍 Address: Barangay Hall, Batia Proper\n💬 Or use our AI chatbot for assistance!', 'contact, phone, email, address, reach', 7),
('certificates', 'What certificates do you issue?', 'We issue the following certificates:\n• Barangay Clearance (P50)\n• Barangay Residency (P30)\n• Certificate of Indigency (Free)\n• Business Clearance (P100)\n• Good Moral Certificate (P25)\n• Oath of Undertaking (P25)', 'certificates, documents, types, issue, clearance', 6),
('emergency', 'What should I do in case of emergency?', 'For emergencies:\n🚨 Police: Dial 911 or contact local police station\n🚒 Fire: Call BFP at 160\n🚑 Medical: Go to nearest hospital or call 911\n🏥 Our barangay can assist with initial response and coordination', 'emergency, police, fire, medical, help, urgent', 10);

-- Insert default OCR field mappings
INSERT INTO ai_ocr_field_mappings (document_type, field_name, regex_pattern, validation_rules, priority) VALUES
('barangay_id', 'full_name', '(?:Name|Full Name|Resident Name)[:\\s]*([A-Za-z\\s.,-]+)', '{"required": true, "min_length": 2, "max_length": 100}', 10),
('barangay_id', 'address', '(?:Address|Residence|Location)[:\\s]*([A-Za-z0-9\\s.,#-]+)', '{"required": true, "min_length": 10}', 9),
('barangay_id', 'birthdate', '(?:Birth|DOB|Date of Birth)[:\\s]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})', '{"required": true, "date_format": true}', 8),
('drivers_license', 'license_number', '(?:License|DL|Driver.?s License)[:\\s]*([A-Z0-9-]+)', '{"required": true, "pattern": "^[A-Z0-9-]+$", "min_length": 8}', 10),
('drivers_license', 'full_name', '(?:Name|Full Name)[:\\s]*([A-Za-z\\s.,-]+)', '{"required": true, "min_length": 2, "max_length": 100}', 9),
('passport', 'passport_number', '(?:Passport|PP)[:\\s]*([A-Z0-9]+)', '{"required": true, "pattern": "^[A-Z0-9]+$", "min_length": 8}', 10),
('passport', 'full_name', '(?:Name|Full Name)[:\\s]*([A-Za-z\\s.,-]+)', '{"required": true, "min_length": 2, "max_length": 100}', 9);

-- ==========================================
-- CLEANUP & OPTIMIZATION
-- ==========================================

-- Create indexes for better performance (Note: Some advanced index features may not be supported in all MySQL versions)
CREATE INDEX idx_conversations_recent ON ai_chatbot_conversations (created_at DESC);
-- CREATE INDEX idx_appointments_upcoming ON ai_appointments (appointment_date, appointment_time) WHERE status = 'pending'; -- Commented out for compatibility
-- CREATE INDEX idx_analytics_expiring ON ai_analytics_cache (expires_at) WHERE expires_at > NOW(); -- Commented out for compatibility
CREATE INDEX idx_ocr_recent ON ai_ocr_cache (last_accessed DESC);

-- ==========================================
-- SETUP COMPLETE
-- ==========================================

/*
AI DATABASE TABLES SETUP COMPLETE!

✅ TABLES CREATED:
   - ai_chatbot_conversations (conversation logging)
   - ai_chatbot_faq (FAQ database)
   - ai_appointments (appointment booking)
   - ai_analytics_cache (analytics data caching)
   - ai_predictive_models (ML model storage)
   - ai_analytics_reports (report storage)
   - ai_ocr_cache (OCR result caching)
   - ai_ocr_field_mappings (field extraction rules)
   - ai_system_logs (comprehensive logging)

✅ INITIAL DATA INSERTED:
   - 6 FAQ entries with keywords
   - OCR field mappings for common documents
   - Proper indexes for performance

✅ READY FOR AI FEATURES:
   - BANTAY chatbot can start logging conversations
   - Ronda.ai can cache analytics data
   - OCR system can process and cache results
   - All AI operations will be logged

NEXT: Install Python dependencies and begin Phase 2 development!
*/
