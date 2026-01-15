SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `residents`;
TRUNCATE TABLE `households`;
TRUNCATE TABLE `resident_documents`;
TRUNCATE TABLE `resident_applications`;
TRUNCATE TABLE `resident_signup_requests`;
TRUNCATE TABLE `resident_verification_requests`;

TRUNCATE TABLE `blotter`;
TRUNCATE TABLE `blotter_participants`;
TRUNCATE TABLE `clearance_requests`;
TRUNCATE TABLE `document_requests`;
TRUNCATE TABLE `certificates_log`;

TRUNCATE TABLE `program_participants`;
TRUNCATE TABLE `visitors`;
TRUNCATE TABLE `vehicles`;
TRUNCATE TABLE `vulnerabilities`;

TRUNCATE TABLE `ai_analytics_reports`;
TRUNCATE TABLE `ai_appointments`;
TRUNCATE TABLE `ai_chatbot_conversations`;
TRUNCATE TABLE `ai_ocr_cache`;

TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `user_notifications`;
TRUNCATE TABLE `login_attempts`;
TRUNCATE TABLE `mfa_otp_challenges`;
TRUNCATE TABLE `application_documents`;
TRUNCATE TABLE `announcements`;

SET FOREIGN_KEY_CHECKS = 1;
