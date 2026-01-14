-- =======================================================================================================
-- AI TRAINING DATA POPULATION SCRIPT
-- =======================================================================================================
-- This script populates the database with sample data for AI training and system testing.
-- It includes blotter cases, chatbot logs, and appointment records.
-- =======================================================================================================

USE barangay_management;

-- Clear existing sample data to prevent duplicates (Optional)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE blotter;
TRUNCATE TABLE ai_chatbot_conversations;
TRUNCATE TABLE ai_appointments;
TRUNCATE TABLE ai_chatbot_faq;
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 1. SEED BLOTTER CASES
-- ==========================================
-- Incident_Type: Physical Injury, Unjust Vexation, Grave Threats, Alarming and Scandal, Theft (Petty), 
--                Malicious Mischief, Estafa (Swindling), Trespassing, Collection of Sum of Money, 
--                Ejectment, Boundary Dispute, Family Dispute, Curfew Violation, Noise Barrage, 
--                Illegal Parking, Waste Management, Stray Animals
-- Status: Pending, Scheduled for Mediation, Amicably Settled, Certificate to File Action Issued, Dismissed, Ongoing

INSERT INTO blotter (
  Case_Number, Complainant_Details, Respondent_Details, Incident_Type,
  Narrative, DateTime_Incident, Location_Sitio, Status, created_at
) VALUES
('BLOT-2025-01-0001', 
 '{"name":"Maria Santos","address":"Batia Proper","contact":"09123456701"}', 
 '{"name":"Juan Reyes","address":"Northville 5","contact":"09987654321"}', 
 'Physical Injury', 
 'Complainant was physically assaulted by respondent during a heated argument over a debt.', 
 '2025-01-10 14:30:00', 'Batia Proper', 'Amicably Settled', '2025-01-10 16:00:00'),

('BLOT-2025-01-0002', 
 '{"name":"Pedro Garcia","address":"St. Martha","contact":"09123456702"}', 
 '{"name":"Ana Lopez","address":"AFP/PNP","contact":"09987654322"}', 
 'Unjust Vexation', 
 'Respondent has been playing loud music and throwing trash in front of the complainant\'s gate.', 
 '2025-01-12 09:15:00', 'St. Martha', 'Scheduled for Mediation', '2025-01-12 10:30:00'),

('BLOT-2025-01-0003', 
 '{"name":"Carlos Mendoza","address":"Northville 5","contact":"09123456703"}', 
 NULL, 
 'Theft (Petty)', 
 'Unidentified person stole a bicycle parked outside the complainant\'s house.', 
 '2025-01-14 22:45:00', 'Northville 5', 'Ongoing', '2025-01-15 08:00:00'),

('BLOT-2025-01-0004', 
 '{"name":"Rosa Cruz","address":"Batia Proper","contact":"09123456704"}', 
 '{"name":"Miguel Torres","address":"Batia Proper","contact":"09987654324"}', 
 'Malicious Mischief', 
 'Respondent intentionally damaged the complainant\'s window during a neighborhood dispute.', 
 '2025-01-18 16:20:00', 'Batia Proper', 'Pending', '2025-01-18 17:00:00'),

('BLOT-2025-01-0005', 
 '{"name":"Elena Vasquez","address":"AFP/PNP","contact":"09123456705"}', 
 '{"name":"Ricardo Lim","address":"AFP/PNP","contact":"09987654325"}', 
 'Noise Barrage', 
 'Respondent holding karaoke session past 10 PM on a weekday, disturbing the peace.', 
 '2025-01-20 23:30:00', 'AFP/PNP', 'Amicably Settled', '2025-01-21 09:00:00'),

('BLOT-2025-01-0006', 
 '{"name":"Fernando Dela Cruz","address":"St. Martha","contact":"09123456707"}', 
 '{"name":"Isabel Santos","address":"Batia Proper","contact":"09987654327"}', 
 'Grave Threats', 
 'Respondent threatened to burn down the complainant\'s store following a business disagreement.', 
 '2025-01-22 11:20:00', 'St. Martha', 'Certificate to File Action Issued', '2025-01-22 13:00:00'),

('BLOT-2025-01-0007', 
 '{"name":"Antonio Morales","address":"AFP/PNP","contact":"09123456709"}', 
 '{"name":"Teresa Aquino","address":"St. Martha","contact":"09987654329"}', 
 'Family Dispute', 
 'Inheritance dispute regarding a property in Sitio Batia Proper.', 
 '2025-01-25 10:00:00', 'AFP/PNP', 'Scheduled for Mediation', '2025-01-25 11:30:00'),

('BLOT-2025-01-0008', 
 '{"name":"Ricardo Gomez","address":"St. Martha","contact":"09123456710"}', 
 '{"name":"Patricia Reyes","address":"Northville 5","contact":"09987654330"}', 
 'Boundary Dispute', 
 'Complainant claims respondent\'s new fence encroaches 0.5 meters into their lot.', 
 '2025-01-28 14:00:00', 'St. Martha', 'Ongoing', '2025-01-28 15:30:00');

-- ==========================================
-- 2. SEED CHATBOT CONVERSATIONS
-- ==========================================
-- Logs for BANTAY Chatbot to train on user intent detection.

INSERT INTO ai_chatbot_conversations (
  session_id, user_message, bot_response, intent_detected, confidence_score, created_at
) VALUES
('sess_001', 'How do I report a theft?', 'I can help you file a blotter report for theft. Would you like to schedule an appointment with the barangay office?', 'blotter_inquiry', 0.98, NOW()),
('sess_002', 'I need a barangay clearance for a job.', 'To get a barangay clearance, please bring a valid ID and proof of residency. You can also apply through our online portal.', 'certificate_inquiry', 0.95, NOW()),
('sess_003', 'What are your office hours?', 'The barangay office is open Monday to Friday, 8:00 AM to 5:00 PM.', 'faq', 0.99, NOW()),
('sess_004', 'Someone is playing loud music right now.', 'I understand. I can log a noise complaint for you or help you file a formal blotter report.', 'complaint', 0.92, NOW()),
('sess_005', 'Can I schedule a meeting with the Captain?', 'Yes, I can help you book an appointment with the Barangay Captain. What is the purpose of your meeting?', 'appointment_request', 0.88, NOW());

-- ==========================================
-- 3. SEED AI APPOINTMENTS
-- ==========================================
-- Appointments booked through the AI system.

INSERT INTO ai_appointments (
  visitor_name, visitor_contact, appointment_type, appointment_date, 
  appointment_time, purpose, status, created_at
) VALUES
('Maria Santos', '09123456701', 'blotter_filing', '2025-02-05', '10:00:00', 'Mediation for Case BLOT-2025-01-0001', 'confirmed', NOW()),
('Juan Dela Cruz', '09998887766', 'certificate_request', '2025-02-05', '14:00:00', 'Barangay Clearance Application', 'pending', NOW()),
('Elena Vasquez', '09123456705', 'complaint', '2025-02-06', '09:30:00', 'Follow up on noise complaint', 'confirmed', NOW());

-- ==========================================
-- 4. SEED CHATBOT FAQ
-- ==========================================

INSERT INTO ai_chatbot_faq (category, question, answer, keywords, priority) VALUES
('General', 'Where is the barangay hall?', 'The barangay hall is located at the center of Batia Proper, near the elementary school.', 'location, address, hall', 1),
('Certificates', 'How much is a residency certificate?', 'A Barangay Residency Certificate costs 50 PHP.', 'price, cost, residency', 2),
('Blotter', 'What is needed for a blotter report?', 'You need a valid ID, the name of the respondent, and a detailed description of the incident.', 'requirements, blotter, report', 1);

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================
SELECT 'AI Training Data Seeding Completed Successfully!' as Status;
