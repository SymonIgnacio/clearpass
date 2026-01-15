SET FOREIGN_KEY_CHECKS=0;
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 12, 2026 at 08:30 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `barangay_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `ai_analytics_reports`
--

CREATE TABLE `ai_analytics_reports` (
  `id` int(11) NOT NULL,
  `report_type` enum('incident_analysis','trend_report','predictive_forecast','resource_allocation') NOT NULL,
  `report_title` varchar(255) NOT NULL,
  `date_range_start` date NOT NULL,
  `date_range_end` date NOT NULL,
  `generated_by` int(11) DEFAULT NULL,
  `report_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`report_data`)),
  `file_path` varchar(500) DEFAULT NULL,
  `download_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_appointments`
--

CREATE TABLE `ai_appointments` (
  `id` int(11) NOT NULL,
  `resident_id` varchar(50) DEFAULT NULL,
  `visitor_name` varchar(255) NOT NULL,
  `visitor_contact` varchar(20) NOT NULL,
  `appointment_type` enum('certificate_request','blotter_filing','complaint','inquiry','other') NOT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `preferred_time_slot` varchar(50) DEFAULT NULL,
  `purpose` text NOT NULL,
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `assigned_staff` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `chatbot_session_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_chatbot_conversations`
--

CREATE TABLE `ai_chatbot_conversations` (
  `id` int(11) NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `resident_id` varchar(50) DEFAULT NULL,
  `user_message` text NOT NULL,
  `bot_response` text NOT NULL,
  `intent_detected` varchar(100) DEFAULT NULL,
  `confidence_score` decimal(3,2) DEFAULT NULL,
  `appointment_booked` tinyint(1) DEFAULT 0,
  `appointment_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`appointment_details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ai_chatbot_conversations`
--


-- --------------------------------------------------------

--
-- Table structure for table `ai_chatbot_faq`
--

CREATE TABLE `ai_chatbot_faq` (
  `id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `question` text NOT NULL,
  `answer` text NOT NULL,
  `keywords` text DEFAULT NULL,
  `priority` int(11) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `usage_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ai_chatbot_faq`
--

INSERT INTO `ai_chatbot_faq` (`id`, `category`, `question`, `answer`, `keywords`, `priority`, `is_active`, `usage_count`, `created_at`, `updated_at`) VALUES
(1, 'office_hours', 'What are your office hours?', 'Our barangay office is open from Monday to Friday, 8:00 AM to 5:00 PM, and Saturday from 8:00 AM to 12:00 NN. We are closed on Sundays and holidays.', 'hours, open, closed, time, schedule', 10, 1, 0, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(2, 'requirements', 'What are the requirements for barangay clearance?', 'Requirements for Barangay Clearance:\n1. Valid ID (any government-issued)\n2. Proof of residency (utility bill, lease agreement, etc.)\n3. Community Tax Certificate (Cedula)\n4. Payment of P50.00 fee\nProcessing time: 10-15 minutes', 'clearance, requirements, documents, needed, cedula', 9, 1, 0, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(3, 'procedures', 'How do I file a blotter report?', 'To file a blotter report:\n1. Come to the barangay office with your valid ID\n2. Bring at least one witness if possible\n3. Provide detailed narrative of the incident\n4. Peace officers will mediate and document the complaint\n5. Processing time: 30-60 minutes', 'blotter, report, complaint, incident, file', 8, 1, 0, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(4, 'contact', 'How can I contact the barangay?', 'You can reach us through:\n???? Phone: (02) 123-4567\n???? Email: info@barangay-batia.gov.ph\n???? Address: Barangay Hall, Batia Proper\n???? Or use our AI chatbot for assistance!', 'contact, phone, email, address, reach', 7, 1, 0, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(5, 'certificates', 'What certificates do you issue?', 'We issue the following certificates:\n??? Barangay Clearance (P50)\n??? Barangay Residency (P30)\n??? Certificate of Indigency (Free)\n??? Business Clearance (P100)\n??? Good Moral Certificate (P25)\n??? Oath of Undertaking (P25)', 'certificates, documents, types, issue, clearance', 6, 1, 0, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(6, 'emergency', 'What should I do in case of emergency?', 'For emergencies:\n???? Police: Dial 911 or contact local police station\n???? Fire: Call BFP at 160\n???? Medical: Go to nearest hospital or call 911\n???? Our barangay can assist with initial response and coordination', 'emergency, police, fire, medical, help, urgent', 10, 1, 0, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(7, 'office_hours', 'What are your office hours?', 'Our barangay office is open from Monday to Friday, 8:00 AM to 5:00 PM, and Saturday from 8:00 AM to 12:00 NN. We are closed on Sundays and holidays.', 'hours, open, closed, time, schedule', 10, 1, 0, '2025-12-02 18:38:46', '2025-12-02 18:38:46'),
(8, 'requirements', 'What are the requirements for barangay clearance?', 'Requirements for Barangay Clearance:\n1. Valid ID (any government-issued)\n2. Proof of residency (utility bill, lease agreement, etc.)\n3. Community Tax Certificate (Cedula)\n4. Payment of P50.00 fee\nProcessing time: 10-15 minutes', 'clearance, requirements, documents, needed, cedula', 9, 1, 0, '2025-12-02 18:38:46', '2025-12-02 18:38:46'),
(9, 'procedures', 'How do I file a blotter report?', 'To file a blotter report:\n1. Come to the barangay office with your valid ID\n2. Bring at least one witness if possible\n3. Provide detailed narrative of the incident\n4. Peace officers will mediate and document the complaint\n5. Processing time: 30-60 minutes', 'blotter, report, complaint, incident, file', 8, 1, 0, '2025-12-02 18:38:46', '2025-12-02 18:38:46'),
(10, 'contact', 'How can I contact the barangay?', 'You can reach us through:\n???? Phone: (02) 123-4567\n???? Email: info@barangay-batia.gov.ph\n???? Address: Barangay Hall, Batia Proper\n???? Or use our AI chatbot for assistance!', 'contact, phone, email, address, reach', 7, 1, 0, '2025-12-02 18:38:46', '2025-12-02 18:38:46'),
(11, 'certificates', 'What certificates do you issue?', 'We issue the following certificates:\n??? Barangay Clearance (P50)\n??? Barangay Residency (P30)\n??? Certificate of Indigency (Free)\n??? Business Clearance (P100)\n??? Good Moral Certificate (P25)\n??? Oath of Undertaking (P25)', 'certificates, documents, types, issue, clearance', 6, 1, 0, '2025-12-02 18:38:46', '2025-12-02 18:38:46'),
(12, 'emergency', 'What should I do in case of emergency?', 'For emergencies:\n???? Police: Dial 911 or contact local police station\n???? Fire: Call BFP at 160\n???? Medical: Go to nearest hospital or call 911\n???? Our barangay can assist with initial response and coordination', 'emergency, police, fire, medical, help, urgent', 10, 1, 0, '2025-12-02 18:38:46', '2025-12-02 18:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `ai_ocr_cache`
--

CREATE TABLE `ai_ocr_cache` (
  `id` int(11) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `file_hash` varchar(128) NOT NULL,
  `ocr_text` text NOT NULL,
  `confidence_score` decimal(3,2) DEFAULT NULL,
  `extracted_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extracted_fields`)),
  `document_type` enum('barangay_id','drivers_license','passport','certificate','form','other') DEFAULT NULL,
  `processing_status` enum('success','partial','failed') DEFAULT 'success',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_accessed` timestamp NOT NULL DEFAULT current_timestamp(),
  `access_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_ocr_field_mappings`
--

CREATE TABLE `ai_ocr_field_mappings` (
  `id` int(11) NOT NULL,
  `document_type` varchar(50) NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `regex_pattern` text NOT NULL,
  `validation_rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`validation_rules`)),
  `priority` int(11) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ai_ocr_field_mappings`
--

INSERT INTO `ai_ocr_field_mappings` (`id`, `document_type`, `field_name`, `regex_pattern`, `validation_rules`, `priority`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'barangay_id', 'full_name', '(?:Name|Full Name|Resident Name)[:\\s]*([A-Za-z\\s.,-]+)', '{\"required\": true, \"min_length\": 2, \"max_length\": 100}', 10, 1, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(2, 'barangay_id', 'address', '(?:Address|Residence|Location)[:\\s]*([A-Za-z0-9\\s.,#-]+)', '{\"required\": true, \"min_length\": 10}', 9, 1, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(3, 'barangay_id', 'birthdate', '(?:Birth|DOB|Date of Birth)[:\\s]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})', '{\"required\": true, \"date_format\": true}', 8, 1, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(4, 'drivers_license', 'license_number', '(?:License|DL|Driver.?s License)[:\\s]*([A-Z0-9-]+)', '{\"required\": true, \"pattern\": \"^[A-Z0-9-]+$\", \"min_length\": 8}', 10, 1, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(5, 'drivers_license', 'full_name', '(?:Name|Full Name)[:\\s]*([A-Za-z\\s.,-]+)', '{\"required\": true, \"min_length\": 2, \"max_length\": 100}', 9, 1, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(6, 'passport', 'passport_number', '(?:Passport|PP)[:\\s]*([A-Z0-9]+)', '{\"required\": true, \"pattern\": \"^[A-Z0-9]+$\", \"min_length\": 8}', 10, 1, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(7, 'passport', 'full_name', '(?:Name|Full Name)[:\\s]*([A-Za-z\\s.,-]+)', '{\"required\": true, \"min_length\": 2, \"max_length\": 100}', 9, 1, '2025-12-02 18:38:18', '2025-12-02 18:38:18'),
(8, 'barangay_id', 'full_name', '(?:Name|Full Name|Resident Name)[:\\s]*([A-Za-z\\s.,-]+)', '{\"required\": true, \"min_length\": 2, \"max_length\": 100}', 10, 1, '2025-12-02 18:38:46', '2025-12-02 18:38:46'),
(9, 'barangay_id', 'address', '(?:Address|Residence|Location)[:\\s]*([A-Za-z0-9\\s.,#-]+)', '{\"required\": true, \"min_length\": 10}', 9, 1, '2025-12-02 18:38:46', '2025-12-02 18:38:46'),
(10, 'barangay_id', 'birthdate', '(?:Birth|DOB|Date of Birth)[:\\s]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})', '{\"required\": true, \"date_format\": true}', 8, 1, '2025-12-02 18:38:46', '2025-12-02 18:38:46'),
(11, 'drivers_license', 'license_number', '(?:License|DL|Driver.?s License)[:\\s]*([A-Z0-9-]+)', '{\"required\": true, \"pattern\": \"^[A-Z0-9-]+$\", \"min_length\": 8}', 10, 1, '2025-12-02 18:38:46', '2025-12-02 18:38:46'),
(12, 'drivers_license', 'full_name', '(?:Name|Full Name)[:\\s]*([A-Za-z\\s.,-]+)', '{\"required\": true, \"min_length\": 2, \"max_length\": 100}', 9, 1, '2025-12-02 18:38:46', '2025-12-02 18:38:46'),
(13, 'passport', 'passport_number', '(?:Passport|PP)[:\\s]*([A-Z0-9]+)', '{\"required\": true, \"pattern\": \"^[A-Z0-9]+$\", \"min_length\": 8}', 10, 1, '2025-12-02 18:38:46', '2025-12-02 18:38:46'),
(14, 'passport', 'full_name', '(?:Name|Full Name)[:\\s]*([A-Za-z\\s.,-]+)', '{\"required\": true, \"min_length\": 2, \"max_length\": 100}', 9, 1, '2025-12-02 18:38:46', '2025-12-02 18:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `ai_predictive_models`
--

CREATE TABLE `ai_predictive_models` (
  `id` int(11) NOT NULL,
  `model_name` varchar(100) NOT NULL,
  `model_version` varchar(20) NOT NULL,
  `model_type` enum('linear_regression','time_series','classification','clustering') NOT NULL,
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`parameters`)),
  `training_data_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`training_data_info`)),
  `accuracy_metrics` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`accuracy_metrics`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_system_logs`
--

CREATE TABLE `ai_system_logs` (
  `id` int(11) NOT NULL,
  `component` varchar(50) NOT NULL,
  `operation` varchar(100) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `input_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`input_data`)),
  `output_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`output_data`)),
  `processing_time_ms` int(11) DEFAULT NULL,
  `status` enum('success','warning','error') DEFAULT 'success',
  `error_message` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` varchar(50) DEFAULT 'general',
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `expires_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `application_documents`
--

CREATE TABLE `application_documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `application_id` varchar(50) NOT NULL,
  `document_type` varchar(50) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `verification_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `verification_notes` text DEFAULT NULL,
  `verified_by` varchar(50) DEFAULT NULL,
  `verified_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `encryption_alg` varchar(32) DEFAULT NULL,
  `encryption_version` int(10) UNSIGNED DEFAULT NULL,
  `encryption_iv` varchar(64) DEFAULT NULL,
  `encryption_tag` varchar(64) DEFAULT NULL,
  `disposed_at` timestamp NULL DEFAULT NULL,
  `disposed_by` varchar(50) DEFAULT NULL,
  `disposal_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `user_role` varchar(20) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `resource` varchar(255) DEFAULT NULL,
  `action` varchar(20) DEFAULT NULL,
  `result` enum('SUCCESS','FAILED','ERROR') DEFAULT 'SUCCESS',
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `session_id` varchar(128) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `event_type`, `user_id`, `user_role`, `ip_address`, `user_agent`, `resource`, `action`, `result`, `details`, `session_id`, `created_at`) VALUES
(1, 'DOCUMENT_REQUEST_UPDATED', 'TEST_ADMIN', NULL, 'SYSTEM', NULL, 'document_request', 'DOCUMENT_DOWNLOADED', 'SUCCESS', '{\"document_type\":\"Barangay Clearance\",\"control_number\":null}', NULL, '2026-01-11 19:56:55'),
(2, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":15,\"body_size\":52271}', NULL, '2026-01-11 20:50:11'),
(3, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":27,\"body_size\":59531}', NULL, '2026-01-11 20:50:11'),
(4, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":9,\"body_size\":52271}', NULL, '2026-01-11 20:50:11'),
(5, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":9,\"body_size\":59531}', NULL, '2026-01-11 20:50:11'),
(6, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-11 21:15:59'),
(7, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 21:16:00'),
(8, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":59531}', NULL, '2026-01-11 21:16:00'),
(9, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":5,\"body_size\":59531}', NULL, '2026-01-11 21:16:00'),
(10, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":12,\"body_size\":457566}', NULL, '2026-01-11 21:16:00'),
(11, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":7,\"body_size\":457566}', NULL, '2026-01-11 21:16:00'),
(12, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-11 21:17:04'),
(13, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-11 21:17:04'),
(14, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":59531}', NULL, '2026-01-11 21:17:04'),
(15, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":19,\"body_size\":59531}', NULL, '2026-01-11 21:17:04'),
(16, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":11,\"body_size\":457566}', NULL, '2026-01-11 21:17:05'),
(17, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":23,\"body_size\":457566}', NULL, '2026-01-11 21:17:05'),
(18, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":3,\"body_size\":49310}', NULL, '2026-01-11 21:17:07'),
(19, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":12,\"body_size\":49310}', NULL, '2026-01-11 21:17:07'),
(20, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":10,\"body_size\":49310}', NULL, '2026-01-11 21:17:07'),
(21, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":17,\"body_size\":49310}', NULL, '2026-01-11 21:17:07'),
(22, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":5,\"body_size\":52271}', NULL, '2026-01-11 21:17:08'),
(23, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":8,\"body_size\":52271}', NULL, '2026-01-11 21:17:08'),
(24, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":16,\"body_size\":59531}', NULL, '2026-01-11 21:17:08'),
(25, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":19,\"body_size\":59531}', NULL, '2026-01-11 21:17:08'),
(26, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":3,\"body_size\":2}', NULL, '2026-01-11 21:17:09'),
(27, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":4,\"body_size\":2}', NULL, '2026-01-11 21:17:09'),
(28, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":5,\"body_size\":2}', NULL, '2026-01-11 21:17:09'),
(29, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":4,\"body_size\":2}', NULL, '2026-01-11 21:17:09'),
(30, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/beneficiaries', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/beneficiaries\",\"status_code\":200,\"duration_ms\":15,\"body_size\":3889}', NULL, '2026-01-11 21:17:10'),
(31, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/beneficiaries', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/beneficiaries\",\"status_code\":200,\"duration_ms\":19,\"body_size\":3889}', NULL, '2026-01-11 21:17:10'),
(32, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":12,\"body_size\":457566}', NULL, '2026-01-11 21:17:12'),
(33, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents\",\"status_code\":200,\"duration_ms\":23,\"body_size\":49310}', NULL, '2026-01-11 21:17:12'),
(34, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":27,\"body_size\":457566}', NULL, '2026-01-11 21:17:12'),
(35, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents\",\"status_code\":200,\"duration_ms\":34,\"body_size\":49310}', NULL, '2026-01-11 21:17:12'),
(36, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":2,\"body_size\":280}', NULL, '2026-01-11 21:17:15'),
(37, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":11,\"body_size\":341}', NULL, '2026-01-11 21:17:15'),
(38, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":9,\"body_size\":367}', NULL, '2026-01-11 21:17:15'),
(39, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":12,\"body_size\":514}', NULL, '2026-01-11 21:17:15'),
(40, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":15,\"body_size\":967}', NULL, '2026-01-11 21:17:15'),
(41, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":11,\"body_size\":341}', NULL, '2026-01-11 21:17:15'),
(42, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":11,\"body_size\":967}', NULL, '2026-01-11 21:17:15'),
(43, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":28,\"body_size\":1304}', NULL, '2026-01-11 21:17:15'),
(44, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":3,\"body_size\":280}', NULL, '2026-01-11 21:17:15'),
(45, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":55,\"body_size\":454}', NULL, '2026-01-11 21:17:15'),
(46, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":32,\"body_size\":367}', NULL, '2026-01-11 21:17:15'),
(47, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":34,\"body_size\":514}', NULL, '2026-01-11 21:17:15'),
(48, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1304}', NULL, '2026-01-11 21:17:15'),
(49, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":14,\"body_size\":454}', NULL, '2026-01-11 21:17:15'),
(50, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-11 21:17:52'),
(51, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":4,\"body_size\":180}', NULL, '2026-01-11 21:17:52'),
(52, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":16,\"body_size\":59531}', NULL, '2026-01-11 21:17:52'),
(53, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":5,\"body_size\":59531}', NULL, '2026-01-11 21:17:52'),
(54, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":5,\"body_size\":457566}', NULL, '2026-01-11 21:17:52'),
(55, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":7,\"body_size\":457566}', NULL, '2026-01-11 21:17:52'),
(56, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":45,\"body_size\":963}', NULL, '2026-01-11 21:21:31'),
(57, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":27,\"body_size\":862}', NULL, '2026-01-11 21:21:31'),
(58, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":500,\"duration_ms\":47,\"body_size\":50}', NULL, '2026-01-11 21:21:31'),
(59, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":31,\"body_size\":1304}', NULL, '2026-01-11 21:21:31'),
(60, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":69,\"body_size\":1696}', NULL, '2026-01-11 21:21:31'),
(61, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":73,\"body_size\":769}', NULL, '2026-01-11 21:21:31'),
(62, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":77,\"body_size\":969}', NULL, '2026-01-11 21:21:31'),
(63, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":39,\"body_size\":963}', NULL, '2026-01-11 21:21:31'),
(64, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":500,\"duration_ms\":17,\"body_size\":50}', NULL, '2026-01-11 21:21:31'),
(65, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":26,\"body_size\":866}', NULL, '2026-01-11 21:21:31'),
(66, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":22,\"body_size\":1304}', NULL, '2026-01-11 21:21:31'),
(67, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":19,\"body_size\":1696}', NULL, '2026-01-11 21:21:31'),
(68, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":11,\"body_size\":769}', NULL, '2026-01-11 21:21:31'),
(69, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":10,\"body_size\":969}', NULL, '2026-01-11 21:21:31'),
(70, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":13,\"body_size\":963}', NULL, '2026-01-11 21:21:47'),
(71, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":9,\"body_size\":866}', NULL, '2026-01-11 21:21:47'),
(72, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":500,\"duration_ms\":18,\"body_size\":50}', NULL, '2026-01-11 21:21:47'),
(73, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1696}', NULL, '2026-01-11 21:21:47'),
(74, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":21,\"body_size\":769}', NULL, '2026-01-11 21:21:47'),
(75, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":18,\"body_size\":969}', NULL, '2026-01-11 21:21:47'),
(76, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/blotter?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/blotter?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":4993}', NULL, '2026-01-11 21:21:49'),
(77, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/certificates?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/certificates?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":500,\"duration_ms\":3,\"body_size\":59}', NULL, '2026-01-11 21:22:00'),
(78, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/blotter?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/blotter?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":4993}', NULL, '2026-01-11 21:22:04'),
(79, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1304}', NULL, '2026-01-11 21:22:05'),
(80, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/blotter?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/blotter?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":4993}', NULL, '2026-01-11 21:22:06'),
(81, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/certificates?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/certificates?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":500,\"duration_ms\":3,\"body_size\":59}', NULL, '2026-01-11 21:22:07'),
(82, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1304}', NULL, '2026-01-11 21:22:19'),
(83, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/certificates?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/certificates?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":500,\"duration_ms\":2,\"body_size\":59}', NULL, '2026-01-11 21:22:21'),
(84, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/blotter?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/blotter?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":31,\"body_size\":4993}', NULL, '2026-01-11 21:28:01'),
(85, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/certificates?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/certificates?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":5835}', NULL, '2026-01-11 21:28:02'),
(86, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":9,\"body_size\":180}', NULL, '2026-01-11 21:28:04'),
(87, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-11 21:28:04'),
(88, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":26,\"body_size\":963}', NULL, '2026-01-11 21:28:04'),
(89, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1304}', NULL, '2026-01-11 21:28:04'),
(90, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":35,\"body_size\":1121}', NULL, '2026-01-11 21:28:04'),
(91, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":26,\"body_size\":864}', NULL, '2026-01-11 21:28:04'),
(92, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":47,\"body_size\":1696}', NULL, '2026-01-11 21:28:04'),
(93, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1304}', NULL, '2026-01-11 21:28:04'),
(94, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":48,\"body_size\":769}', NULL, '2026-01-11 21:28:04'),
(95, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":55,\"body_size\":968}', NULL, '2026-01-11 21:28:04'),
(96, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":17,\"body_size\":864}', NULL, '2026-01-11 21:28:04'),
(97, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":23,\"body_size\":1121}', NULL, '2026-01-11 21:28:04'),
(98, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":16,\"body_size\":1696}', NULL, '2026-01-11 21:28:04'),
(99, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":32,\"body_size\":963}', NULL, '2026-01-11 21:28:04'),
(100, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":19,\"body_size\":769}', NULL, '2026-01-11 21:28:04'),
(101, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":4,\"body_size\":969}', NULL, '2026-01-11 21:28:04'),
(102, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/certificates?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/certificates?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":5835}', NULL, '2026-01-11 21:28:05'),
(103, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":19,\"body_size\":59531}', NULL, '2026-01-11 21:31:10'),
(104, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":7,\"body_size\":59531}', NULL, '2026-01-11 21:31:10'),
(105, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":15,\"body_size\":457566}', NULL, '2026-01-11 21:31:10'),
(106, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":457566}', NULL, '2026-01-11 21:31:10'),
(107, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":13,\"body_size\":180}', NULL, '2026-01-11 21:39:33'),
(108, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":4,\"body_size\":180}', NULL, '2026-01-11 21:39:34'),
(109, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":13,\"body_size\":59531}', NULL, '2026-01-11 21:39:34'),
(110, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":59531}', NULL, '2026-01-11 21:39:34'),
(111, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":9,\"body_size\":457566}', NULL, '2026-01-11 21:39:34'),
(112, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":6,\"body_size\":457566}', NULL, '2026-01-11 21:39:34'),
(113, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":13,\"body_size\":963}', NULL, '2026-01-11 21:43:35'),
(114, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1121}', NULL, '2026-01-11 21:43:35'),
(115, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":9,\"body_size\":861}', NULL, '2026-01-11 21:43:35'),
(116, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1696}', NULL, '2026-01-11 21:43:35'),
(117, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":14,\"body_size\":769}', NULL, '2026-01-11 21:43:35'),
(118, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":20,\"body_size\":971}', NULL, '2026-01-11 21:43:35'),
(119, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1696}', NULL, '2026-01-11 21:43:44'),
(120, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":17,\"body_size\":963}', NULL, '2026-01-11 21:43:44'),
(121, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1121}', NULL, '2026-01-11 21:43:44'),
(122, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":14,\"body_size\":866}', NULL, '2026-01-11 21:43:44'),
(123, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1304}', NULL, '2026-01-11 21:43:44'),
(124, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":23,\"body_size\":769}', NULL, '2026-01-11 21:43:44'),
(125, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":31,\"body_size\":970}', NULL, '2026-01-11 21:43:44'),
(126, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1121}', NULL, '2026-01-11 21:43:44'),
(127, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":15,\"body_size\":963}', NULL, '2026-01-11 21:43:44'),
(128, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1304}', NULL, '2026-01-11 21:43:44');
INSERT INTO `audit_logs` (`id`, `event_type`, `user_id`, `user_role`, `ip_address`, `user_agent`, `resource`, `action`, `result`, `details`, `session_id`, `created_at`) VALUES
(129, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":23,\"body_size\":1696}', NULL, '2026-01-11 21:43:44'),
(130, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":16,\"body_size\":866}', NULL, '2026-01-11 21:43:44'),
(131, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":7,\"body_size\":769}', NULL, '2026-01-11 21:43:44'),
(132, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":6,\"body_size\":971}', NULL, '2026-01-11 21:43:44'),
(133, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":15,\"body_size\":49310}', NULL, '2026-01-11 21:43:48'),
(134, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":4,\"body_size\":49310}', NULL, '2026-01-11 21:43:48'),
(135, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":3,\"body_size\":49310}', NULL, '2026-01-11 21:43:48'),
(136, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":2,\"body_size\":49310}', NULL, '2026-01-11 21:43:48'),
(137, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":13,\"body_size\":59531}', NULL, '2026-01-11 21:43:49'),
(138, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":59531}', NULL, '2026-01-11 21:43:49'),
(139, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":6,\"body_size\":457566}', NULL, '2026-01-11 21:43:49'),
(140, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":7,\"body_size\":457566}', NULL, '2026-01-11 21:43:49'),
(141, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":10,\"body_size\":963}', NULL, '2026-01-11 21:43:51'),
(142, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":862}', NULL, '2026-01-11 21:43:51'),
(143, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1121}', NULL, '2026-01-11 21:43:51'),
(144, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":14,\"body_size\":969}', NULL, '2026-01-11 21:43:51'),
(145, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":19,\"body_size\":1696}', NULL, '2026-01-11 21:43:51'),
(146, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1304}', NULL, '2026-01-11 21:43:51'),
(147, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":23,\"body_size\":769}', NULL, '2026-01-11 21:43:51'),
(148, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":12,\"body_size\":963}', NULL, '2026-01-11 21:43:51'),
(149, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":11,\"body_size\":866}', NULL, '2026-01-11 21:43:51'),
(150, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-11 21:43:51'),
(151, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1696}', NULL, '2026-01-11 21:43:51'),
(152, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1121}', NULL, '2026-01-11 21:43:51'),
(153, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":7,\"body_size\":769}', NULL, '2026-01-11 21:43:51'),
(154, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":16,\"body_size\":971}', NULL, '2026-01-11 21:43:51'),
(155, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":11,\"body_size\":963}', NULL, '2026-01-11 21:43:53'),
(156, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1121}', NULL, '2026-01-11 21:43:53'),
(157, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":6,\"body_size\":866}', NULL, '2026-01-11 21:43:53'),
(158, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1696}', NULL, '2026-01-11 21:43:53'),
(159, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1304}', NULL, '2026-01-11 21:43:53'),
(160, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":14,\"body_size\":963}', NULL, '2026-01-11 21:43:53'),
(161, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1121}', NULL, '2026-01-11 21:43:53'),
(162, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":15,\"body_size\":866}', NULL, '2026-01-11 21:43:53'),
(163, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":33,\"body_size\":769}', NULL, '2026-01-11 21:43:53'),
(164, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-11 21:43:53'),
(165, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1696}', NULL, '2026-01-11 21:43:53'),
(166, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":37,\"body_size\":971}', NULL, '2026-01-11 21:43:53'),
(167, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":6,\"body_size\":769}', NULL, '2026-01-11 21:43:53'),
(168, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":4,\"body_size\":971}', NULL, '2026-01-11 21:43:53'),
(169, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1121}', NULL, '2026-01-11 21:44:00'),
(170, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":18,\"body_size\":963}', NULL, '2026-01-11 21:44:00'),
(171, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-11 21:44:00'),
(172, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":18,\"body_size\":769}', NULL, '2026-01-11 21:44:00'),
(173, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-11 21:44:00'),
(174, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":28,\"body_size\":1696}', NULL, '2026-01-11 21:44:00'),
(175, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":21,\"body_size\":971}', NULL, '2026-01-11 21:44:00'),
(176, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":11,\"body_size\":963}', NULL, '2026-01-11 21:44:00'),
(177, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-11 21:44:00'),
(178, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":19,\"body_size\":1121}', NULL, '2026-01-11 21:44:00'),
(179, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":16,\"body_size\":866}', NULL, '2026-01-11 21:44:00'),
(180, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":12,\"body_size\":769}', NULL, '2026-01-11 21:44:00'),
(181, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1696}', NULL, '2026-01-11 21:44:00'),
(182, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":10,\"body_size\":971}', NULL, '2026-01-11 21:44:00'),
(183, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1121}', NULL, '2026-01-11 21:44:01'),
(184, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":14,\"body_size\":963}', NULL, '2026-01-11 21:44:01'),
(185, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":16,\"body_size\":1696}', NULL, '2026-01-11 21:44:01'),
(186, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":14,\"body_size\":866}', NULL, '2026-01-11 21:44:01'),
(187, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":20,\"body_size\":769}', NULL, '2026-01-11 21:44:01'),
(188, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":25,\"body_size\":971}', NULL, '2026-01-11 21:44:01'),
(189, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1121}', NULL, '2026-01-11 21:44:01'),
(190, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":16,\"body_size\":1304}', NULL, '2026-01-11 21:44:01'),
(191, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":13,\"body_size\":963}', NULL, '2026-01-11 21:44:01'),
(192, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":10,\"body_size\":866}', NULL, '2026-01-11 21:44:01'),
(193, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1304}', NULL, '2026-01-11 21:44:01'),
(194, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":8,\"body_size\":769}', NULL, '2026-01-11 21:44:01'),
(195, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1696}', NULL, '2026-01-11 21:44:01'),
(196, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":8,\"body_size\":971}', NULL, '2026-01-11 21:44:01'),
(197, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":9,\"body_size\":963}', NULL, '2026-01-11 21:45:54'),
(198, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1121}', NULL, '2026-01-11 21:45:54'),
(199, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":14,\"body_size\":769}', NULL, '2026-01-11 21:45:54'),
(200, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1696}', NULL, '2026-01-11 21:45:54'),
(201, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":13,\"body_size\":866}', NULL, '2026-01-11 21:45:54'),
(202, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-11 21:45:54'),
(203, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":17,\"body_size\":971}', NULL, '2026-01-11 21:45:54'),
(204, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":9,\"body_size\":963}', NULL, '2026-01-11 21:46:22'),
(205, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1121}', NULL, '2026-01-11 21:46:22'),
(206, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-11 21:46:22'),
(207, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":12,\"body_size\":769}', NULL, '2026-01-11 21:46:22'),
(208, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1304}', NULL, '2026-01-11 21:46:22'),
(209, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":12,\"body_size\":971}', NULL, '2026-01-11 21:46:22'),
(210, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1696}', NULL, '2026-01-11 21:46:22'),
(211, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":12,\"body_size\":49310}', NULL, '2026-01-11 21:46:42'),
(212, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":3,\"body_size\":49310}', NULL, '2026-01-11 21:46:42'),
(213, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":2,\"body_size\":49310}', NULL, '2026-01-11 21:46:42'),
(214, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":3,\"body_size\":49310}', NULL, '2026-01-11 21:46:42'),
(215, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":5,\"body_size\":52271}', NULL, '2026-01-11 21:46:43'),
(216, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":5,\"body_size\":52271}', NULL, '2026-01-11 21:46:43'),
(217, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":23,\"body_size\":59531}', NULL, '2026-01-11 21:46:43'),
(218, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":7,\"body_size\":59531}', NULL, '2026-01-11 21:46:43'),
(219, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":5,\"body_size\":2}', NULL, '2026-01-11 21:46:44'),
(220, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":4,\"body_size\":2}', NULL, '2026-01-11 21:46:44'),
(221, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":2,\"body_size\":2}', NULL, '2026-01-11 21:46:44'),
(222, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":2,\"body_size\":2}', NULL, '2026-01-11 21:46:44'),
(223, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":10,\"body_size\":49310}', NULL, '2026-01-11 21:46:47'),
(224, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":3,\"body_size\":49310}', NULL, '2026-01-11 21:46:47'),
(225, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":2,\"body_size\":49310}', NULL, '2026-01-11 21:46:47'),
(226, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":2,\"body_size\":49310}', NULL, '2026-01-11 21:46:47'),
(227, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":2,\"body_size\":52271}', NULL, '2026-01-11 21:46:48'),
(228, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":4,\"body_size\":52271}', NULL, '2026-01-11 21:46:48'),
(229, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":16,\"body_size\":59531}', NULL, '2026-01-11 21:46:48'),
(230, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":5,\"body_size\":59531}', NULL, '2026-01-11 21:46:48'),
(231, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":3,\"body_size\":2}', NULL, '2026-01-11 21:46:57'),
(232, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":1,\"body_size\":2}', NULL, '2026-01-11 21:46:57'),
(233, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":4,\"body_size\":2}', NULL, '2026-01-11 21:46:57'),
(234, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":2,\"body_size\":2}', NULL, '2026-01-11 21:46:57'),
(235, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/beneficiaries', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/beneficiaries\",\"status_code\":200,\"duration_ms\":21,\"body_size\":3889}', NULL, '2026-01-11 21:46:59'),
(236, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/beneficiaries', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/beneficiaries\",\"status_code\":200,\"duration_ms\":7,\"body_size\":3889}', NULL, '2026-01-11 21:46:59'),
(237, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":13,\"body_size\":963}', NULL, '2026-01-11 21:47:02'),
(238, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1121}', NULL, '2026-01-11 21:47:02'),
(239, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":862}', NULL, '2026-01-11 21:47:02'),
(240, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":14,\"body_size\":769}', NULL, '2026-01-11 21:47:02'),
(241, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":20,\"body_size\":1696}', NULL, '2026-01-11 21:47:02'),
(242, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1304}', NULL, '2026-01-11 21:47:02'),
(243, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":22,\"body_size\":971}', NULL, '2026-01-11 21:47:02'),
(244, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":14,\"body_size\":963}', NULL, '2026-01-11 21:47:02'),
(245, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1121}', NULL, '2026-01-11 21:47:02'),
(246, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":13,\"body_size\":866}', NULL, '2026-01-11 21:47:02'),
(247, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-11 21:47:02'),
(248, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":19,\"body_size\":769}', NULL, '2026-01-11 21:47:02'),
(249, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1696}', NULL, '2026-01-11 21:47:02'),
(250, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":13,\"body_size\":971}', NULL, '2026-01-11 21:47:02'),
(251, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":13,\"body_size\":963}', NULL, '2026-01-11 21:47:03'),
(252, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1121}', NULL, '2026-01-11 21:47:03'),
(253, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":16,\"body_size\":1696}', NULL, '2026-01-11 21:47:03'),
(254, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":15,\"body_size\":769}', NULL, '2026-01-11 21:47:03');
INSERT INTO `audit_logs` (`id`, `event_type`, `user_id`, `user_role`, `ip_address`, `user_agent`, `resource`, `action`, `result`, `details`, `session_id`, `created_at`) VALUES
(255, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":13,\"body_size\":866}', NULL, '2026-01-11 21:47:03'),
(256, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1304}', NULL, '2026-01-11 21:47:03'),
(257, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":21,\"body_size\":971}', NULL, '2026-01-11 21:47:03'),
(258, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":15,\"body_size\":963}', NULL, '2026-01-11 21:47:03'),
(259, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1121}', NULL, '2026-01-11 21:47:03'),
(260, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1304}', NULL, '2026-01-11 21:47:03'),
(261, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-11 21:47:03'),
(262, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1696}', NULL, '2026-01-11 21:47:03'),
(263, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":12,\"body_size\":769}', NULL, '2026-01-11 21:47:03'),
(264, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":6,\"body_size\":971}', NULL, '2026-01-11 21:47:03'),
(265, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 21:47:08'),
(266, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 21:47:08'),
(267, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":20,\"body_size\":59531}', NULL, '2026-01-11 21:47:08'),
(268, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":59531}', NULL, '2026-01-11 21:47:08'),
(269, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 21:48:15'),
(270, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":59531}', NULL, '2026-01-11 21:48:15'),
(271, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":6,\"body_size\":52271}', NULL, '2026-01-11 21:48:29'),
(272, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":17,\"body_size\":59531}', NULL, '2026-01-11 21:48:29'),
(273, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":10,\"body_size\":52271}', NULL, '2026-01-11 21:48:29'),
(274, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":59531}', NULL, '2026-01-11 21:48:29'),
(275, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 21:48:41'),
(276, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":59531}', NULL, '2026-01-11 21:48:41'),
(277, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 21:48:50'),
(278, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":59531}', NULL, '2026-01-11 21:48:50'),
(279, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":6,\"body_size\":180}', NULL, '2026-01-11 21:50:05'),
(280, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-11 21:50:05'),
(281, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":2,\"body_size\":52271}', NULL, '2026-01-11 21:50:05'),
(282, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 21:50:05'),
(283, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":17,\"body_size\":59531}', NULL, '2026-01-11 21:50:05'),
(284, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":59531}', NULL, '2026-01-11 21:50:05'),
(285, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-11 21:51:06'),
(286, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-11 21:51:06'),
(287, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":2,\"body_size\":52271}', NULL, '2026-01-11 21:51:06'),
(288, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":2,\"body_size\":52271}', NULL, '2026-01-11 21:51:06'),
(289, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":16,\"body_size\":59531}', NULL, '2026-01-11 21:51:06'),
(290, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":5,\"body_size\":59531}', NULL, '2026-01-11 21:51:06'),
(291, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 21:52:33'),
(292, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":59531}', NULL, '2026-01-11 21:52:33'),
(293, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":7,\"body_size\":49310}', NULL, '2026-01-11 21:52:41'),
(294, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":3,\"body_size\":49310}', NULL, '2026-01-11 21:52:41'),
(295, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":3,\"body_size\":49310}', NULL, '2026-01-11 21:52:41'),
(296, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":2,\"body_size\":49310}', NULL, '2026-01-11 21:52:41'),
(297, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 21:52:43'),
(298, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 21:52:43'),
(299, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":59531}', NULL, '2026-01-11 21:52:43'),
(300, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":5,\"body_size\":59531}', NULL, '2026-01-11 21:52:43'),
(301, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 22:00:08'),
(302, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":59531}', NULL, '2026-01-11 22:00:08'),
(303, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":13,\"body_size\":180}', NULL, '2026-01-11 22:01:23'),
(304, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":10,\"body_size\":180}', NULL, '2026-01-11 22:01:23'),
(305, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":10,\"body_size\":52271}', NULL, '2026-01-11 22:01:24'),
(306, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":21,\"body_size\":59531}', NULL, '2026-01-11 22:01:24'),
(307, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":12,\"body_size\":52271}', NULL, '2026-01-11 22:01:24'),
(308, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":59531}', NULL, '2026-01-11 22:01:24'),
(309, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":6,\"body_size\":2}', NULL, '2026-01-11 22:01:31'),
(310, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":4,\"body_size\":2}', NULL, '2026-01-11 22:01:31'),
(311, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":6,\"body_size\":2}', NULL, '2026-01-11 22:01:31'),
(312, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":6,\"body_size\":2}', NULL, '2026-01-11 22:01:31'),
(313, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":4,\"body_size\":52271}', NULL, '2026-01-11 22:01:32'),
(314, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 22:01:32'),
(315, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":16,\"body_size\":59531}', NULL, '2026-01-11 22:01:32'),
(316, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":13,\"body_size\":59531}', NULL, '2026-01-11 22:01:33'),
(317, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":4,\"body_size\":180}', NULL, '2026-01-11 22:02:10'),
(318, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-11 22:02:10'),
(319, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 22:02:10'),
(320, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 22:02:10'),
(321, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":59531}', NULL, '2026-01-11 22:02:10'),
(322, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":5,\"body_size\":59531}', NULL, '2026-01-11 22:02:10'),
(323, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":9,\"body_size\":52271}', NULL, '2026-01-11 22:04:32'),
(324, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":21,\"body_size\":59531}', NULL, '2026-01-11 22:04:32'),
(325, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":59531}', NULL, '2026-01-11 22:04:32'),
(326, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":14,\"body_size\":52271}', NULL, '2026-01-11 22:04:32'),
(327, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-11 22:05:27'),
(328, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-11 22:05:27'),
(329, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":59531}', NULL, '2026-01-11 22:05:28'),
(330, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":7,\"body_size\":59531}', NULL, '2026-01-11 22:05:28'),
(331, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":12,\"body_size\":457566}', NULL, '2026-01-11 22:05:28'),
(332, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":11,\"body_size\":457566}', NULL, '2026-01-11 22:05:28'),
(333, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":18,\"body_size\":59531}', NULL, '2026-01-11 22:05:30'),
(334, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":16,\"body_size\":52271}', NULL, '2026-01-11 22:05:30'),
(335, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":9,\"body_size\":59531}', NULL, '2026-01-11 22:05:30'),
(336, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":3,\"body_size\":52271}', NULL, '2026-01-11 22:05:30'),
(337, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:08:15'),
(338, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:08:15'),
(339, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":8,\"body_size\":52271}', NULL, '2026-01-11 22:08:15'),
(340, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":18,\"body_size\":59531}', NULL, '2026-01-11 22:08:15'),
(341, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":7,\"body_size\":52271}', NULL, '2026-01-11 22:08:15'),
(342, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":4,\"body_size\":59531}', NULL, '2026-01-11 22:08:15'),
(343, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":43,\"body_size\":59531}', NULL, '2026-01-11 22:33:06'),
(344, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":46,\"body_size\":52271}', NULL, '2026-01-11 22:33:06'),
(345, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":59531}', NULL, '2026-01-11 22:33:06'),
(346, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":13,\"body_size\":52271}', NULL, '2026-01-11 22:33:06'),
(347, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":9,\"body_size\":54}', NULL, '2026-01-11 22:33:25'),
(348, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":21,\"body_size\":59531}', NULL, '2026-01-11 22:33:25'),
(349, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":21,\"body_size\":52271}', NULL, '2026-01-11 22:33:25'),
(350, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-11 22:33:43'),
(351, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:33:43'),
(352, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":6,\"body_size\":54}', NULL, '2026-01-11 22:33:43'),
(353, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":24,\"body_size\":59531}', NULL, '2026-01-11 22:33:43'),
(354, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":11,\"body_size\":54}', NULL, '2026-01-11 22:33:43'),
(355, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":22,\"body_size\":52271}', NULL, '2026-01-11 22:33:43'),
(356, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":11,\"body_size\":59531}', NULL, '2026-01-11 22:33:43'),
(357, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":10,\"body_size\":52271}', NULL, '2026-01-11 22:33:43'),
(358, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-11 22:33:53'),
(359, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:33:53'),
(360, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":8,\"body_size\":54}', NULL, '2026-01-11 22:33:53'),
(361, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":22,\"body_size\":59531}', NULL, '2026-01-11 22:33:53'),
(362, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":7,\"body_size\":54}', NULL, '2026-01-11 22:33:53'),
(363, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":11,\"body_size\":59531}', NULL, '2026-01-11 22:33:53'),
(364, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":26,\"body_size\":52271}', NULL, '2026-01-11 22:33:53'),
(365, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":4,\"body_size\":52271}', NULL, '2026-01-11 22:33:53'),
(366, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-11 22:34:01'),
(367, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-11 22:34:01'),
(368, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":7,\"body_size\":54}', NULL, '2026-01-11 22:34:01'),
(369, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":23,\"body_size\":59531}', NULL, '2026-01-11 22:34:01'),
(370, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":18,\"body_size\":52271}', NULL, '2026-01-11 22:34:01'),
(371, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":10,\"body_size\":54}', NULL, '2026-01-11 22:34:01'),
(372, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":10,\"body_size\":59531}', NULL, '2026-01-11 22:34:01'),
(373, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":10,\"body_size\":52271}', NULL, '2026-01-11 22:34:01'),
(374, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-11 22:35:31'),
(375, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:35:31'),
(376, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":16,\"body_size\":54}', NULL, '2026-01-11 22:35:31'),
(377, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":19,\"body_size\":52271}', NULL, '2026-01-11 22:35:31'),
(378, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":32,\"body_size\":59531}', NULL, '2026-01-11 22:35:31'),
(379, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":9,\"body_size\":54}', NULL, '2026-01-11 22:35:31'),
(380, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":15,\"body_size\":52271}', NULL, '2026-01-11 22:35:31'),
(381, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":28,\"body_size\":59531}', NULL, '2026-01-11 22:35:31'),
(382, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:36:19'),
(383, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:36:19'),
(384, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":6,\"body_size\":54}', NULL, '2026-01-11 22:36:19'),
(385, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":11,\"body_size\":52271}', NULL, '2026-01-11 22:36:19'),
(386, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":28,\"body_size\":59531}', NULL, '2026-01-11 22:36:19');
INSERT INTO `audit_logs` (`id`, `event_type`, `user_id`, `user_role`, `ip_address`, `user_agent`, `resource`, `action`, `result`, `details`, `session_id`, `created_at`) VALUES
(387, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":14,\"body_size\":54}', NULL, '2026-01-11 22:36:19'),
(388, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":6,\"body_size\":52271}', NULL, '2026-01-11 22:36:19'),
(389, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":59531}', NULL, '2026-01-11 22:36:19'),
(390, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:36:33'),
(391, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:36:33'),
(392, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":5,\"body_size\":54}', NULL, '2026-01-11 22:36:33'),
(393, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":13,\"body_size\":52271}', NULL, '2026-01-11 22:36:33'),
(394, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":22,\"body_size\":59531}', NULL, '2026-01-11 22:36:33'),
(395, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":10,\"body_size\":54}', NULL, '2026-01-11 22:36:33'),
(396, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":7,\"body_size\":52271}', NULL, '2026-01-11 22:36:33'),
(397, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":7,\"body_size\":59531}', NULL, '2026-01-11 22:36:33'),
(398, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:36:50'),
(399, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:36:50'),
(400, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":7,\"body_size\":54}', NULL, '2026-01-11 22:36:50'),
(401, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":22,\"body_size\":59531}', NULL, '2026-01-11 22:36:50'),
(402, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":16,\"body_size\":52271}', NULL, '2026-01-11 22:36:50'),
(403, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":5,\"body_size\":54}', NULL, '2026-01-11 22:36:50'),
(404, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":8,\"body_size\":59531}', NULL, '2026-01-11 22:36:50'),
(405, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":8,\"body_size\":52271}', NULL, '2026-01-11 22:36:50'),
(406, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:37:00'),
(407, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:37:00'),
(408, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":10,\"body_size\":52271}', NULL, '2026-01-11 22:37:00'),
(409, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":24,\"body_size\":59531}', NULL, '2026-01-11 22:37:00'),
(410, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":7,\"body_size\":54}', NULL, '2026-01-11 22:37:00'),
(411, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":12,\"body_size\":54}', NULL, '2026-01-11 22:37:00'),
(412, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":18,\"body_size\":52271}', NULL, '2026-01-11 22:37:00'),
(413, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":59531}', NULL, '2026-01-11 22:37:00'),
(414, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:37:10'),
(415, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-11 22:37:10'),
(416, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":7,\"body_size\":54}', NULL, '2026-01-11 22:37:10'),
(417, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":22,\"body_size\":59531}', NULL, '2026-01-11 22:37:10'),
(418, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":14,\"body_size\":52271}', NULL, '2026-01-11 22:37:10'),
(419, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":7,\"body_size\":54}', NULL, '2026-01-11 22:37:10'),
(420, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":8,\"body_size\":59531}', NULL, '2026-01-11 22:37:10'),
(421, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":11,\"body_size\":52271}', NULL, '2026-01-11 22:37:10'),
(422, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-11 22:41:45'),
(423, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-11 22:41:45'),
(424, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":4,\"body_size\":54}', NULL, '2026-01-11 22:41:45'),
(425, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":12,\"body_size\":52271}', NULL, '2026-01-11 22:41:45'),
(426, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":5,\"body_size\":54}', NULL, '2026-01-11 22:41:45'),
(427, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":24,\"body_size\":59531}', NULL, '2026-01-11 22:41:45'),
(428, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":8,\"body_size\":52271}', NULL, '2026-01-11 22:41:45'),
(429, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":7,\"body_size\":59531}', NULL, '2026-01-11 22:41:45'),
(430, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":5,\"body_size\":180}', NULL, '2026-01-11 22:43:06'),
(431, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":9,\"body_size\":180}', NULL, '2026-01-11 22:43:06'),
(432, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":11,\"body_size\":54}', NULL, '2026-01-11 22:43:06'),
(433, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":32,\"body_size\":59531}', NULL, '2026-01-11 22:43:06'),
(434, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":16,\"body_size\":52271}', NULL, '2026-01-11 22:43:06'),
(435, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":7,\"body_size\":54}', NULL, '2026-01-11 22:43:06'),
(436, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":8,\"body_size\":52271}', NULL, '2026-01-11 22:43:06'),
(437, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":23,\"body_size\":59531}', NULL, '2026-01-11 22:43:06'),
(438, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-11 22:43:21'),
(439, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-11 22:43:21'),
(440, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":8,\"body_size\":52271}', NULL, '2026-01-11 22:43:21'),
(441, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":28,\"body_size\":59531}', NULL, '2026-01-11 22:43:21'),
(442, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":28,\"body_size\":54}', NULL, '2026-01-11 22:43:21'),
(443, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":11,\"body_size\":52271}', NULL, '2026-01-11 22:43:21'),
(444, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":11,\"body_size\":59531}', NULL, '2026-01-11 22:43:21'),
(445, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Trae/1.104.3 Chrome/138.0.7204.251 Electron/37.6.1 Safari/537.36', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":9,\"body_size\":54}', NULL, '2026-01-11 22:43:21'),
(446, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":60,\"body_size\":180}', NULL, '2026-01-12 03:21:55'),
(447, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":8,\"body_size\":180}', NULL, '2026-01-12 03:21:55'),
(448, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":27,\"body_size\":59531}', NULL, '2026-01-12 03:21:55'),
(449, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":22,\"body_size\":59531}', NULL, '2026-01-12 03:21:55'),
(450, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":43,\"body_size\":457566}', NULL, '2026-01-12 03:21:55'),
(451, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":15,\"body_size\":457566}', NULL, '2026-01-12 03:21:55'),
(452, 'LOGIN_SUCCESS', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/login', 'POST', 'SUCCESS', '{\"method\":\"POST\",\"url\":\"/api/auth/login\",\"status_code\":200,\"duration_ms\":70,\"body_size\":201}', NULL, '2026-01-12 03:26:07'),
(453, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":12,\"body_size\":59531}', NULL, '2026-01-12 03:26:08'),
(454, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":12,\"body_size\":59531}', NULL, '2026-01-12 03:26:08'),
(455, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":9,\"body_size\":457566}', NULL, '2026-01-12 03:26:08'),
(456, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":5,\"body_size\":457566}', NULL, '2026-01-12 03:26:08'),
(457, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":26,\"body_size\":963}', NULL, '2026-01-12 03:26:15'),
(458, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":26,\"body_size\":1696}', NULL, '2026-01-12 03:26:15'),
(459, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":25,\"body_size\":863}', NULL, '2026-01-12 03:26:15'),
(460, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":28,\"body_size\":1121}', NULL, '2026-01-12 03:26:15'),
(461, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":37,\"body_size\":769}', NULL, '2026-01-12 03:26:15'),
(462, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":59,\"body_size\":970}', NULL, '2026-01-12 03:26:15'),
(463, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/users\",\"status_code\":200,\"duration_ms\":2,\"body_size\":2553}', NULL, '2026-01-12 03:26:17'),
(464, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1121}', NULL, '2026-01-12 03:26:18'),
(465, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":18,\"body_size\":963}', NULL, '2026-01-12 03:26:18'),
(466, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":14,\"body_size\":865}', NULL, '2026-01-12 03:26:18'),
(467, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":25,\"body_size\":1696}', NULL, '2026-01-12 03:26:18'),
(468, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":28,\"body_size\":1304}', NULL, '2026-01-12 03:26:18'),
(469, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":45,\"body_size\":769}', NULL, '2026-01-12 03:26:18'),
(470, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":25,\"body_size\":963}', NULL, '2026-01-12 03:26:18'),
(471, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-12 03:26:18'),
(472, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":55,\"body_size\":970}', NULL, '2026-01-12 03:26:18'),
(473, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":32,\"body_size\":866}', NULL, '2026-01-12 03:26:18'),
(474, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1696}', NULL, '2026-01-12 03:26:18'),
(475, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":43,\"body_size\":1121}', NULL, '2026-01-12 03:26:18'),
(476, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":10,\"body_size\":769}', NULL, '2026-01-12 03:26:18'),
(477, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":9,\"body_size\":970}', NULL, '2026-01-12 03:26:18'),
(478, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/blotter?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/blotter?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":10,\"body_size\":4993}', NULL, '2026-01-12 03:26:21'),
(479, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":6,\"body_size\":963}', NULL, '2026-01-12 03:26:47'),
(480, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1121}', NULL, '2026-01-12 03:26:47'),
(481, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":12,\"body_size\":769}', NULL, '2026-01-12 03:26:47'),
(482, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1304}', NULL, '2026-01-12 03:26:47'),
(483, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":12,\"body_size\":866}', NULL, '2026-01-12 03:26:47'),
(484, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":26,\"body_size\":1696}', NULL, '2026-01-12 03:26:47'),
(485, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":19,\"body_size\":970}', NULL, '2026-01-12 03:26:47'),
(486, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":10,\"body_size\":963}', NULL, '2026-01-12 03:26:47'),
(487, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1121}', NULL, '2026-01-12 03:26:47'),
(488, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 03:26:47'),
(489, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":7,\"body_size\":866}', NULL, '2026-01-12 03:26:47'),
(490, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":11,\"body_size\":769}', NULL, '2026-01-12 03:26:47'),
(491, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1696}', NULL, '2026-01-12 03:26:47'),
(492, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":8,\"body_size\":970}', NULL, '2026-01-12 03:26:47'),
(493, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":14,\"body_size\":963}', NULL, '2026-01-12 03:28:53'),
(494, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1121}', NULL, '2026-01-12 03:28:53'),
(495, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":16,\"body_size\":1696}', NULL, '2026-01-12 03:28:53'),
(496, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":18,\"body_size\":866}', NULL, '2026-01-12 03:28:53'),
(497, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1304}', NULL, '2026-01-12 03:28:53'),
(498, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":27,\"body_size\":769}', NULL, '2026-01-12 03:28:53'),
(499, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":14,\"body_size\":963}', NULL, '2026-01-12 03:28:53'),
(500, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1121}', NULL, '2026-01-12 03:28:53'),
(501, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":28,\"body_size\":970}', NULL, '2026-01-12 03:28:53'),
(502, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-12 03:28:53'),
(503, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1304}', NULL, '2026-01-12 03:28:53'),
(504, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":8,\"body_size\":769}', NULL, '2026-01-12 03:28:53'),
(505, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":8,\"body_size\":970}', NULL, '2026-01-12 03:28:53'),
(506, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1696}', NULL, '2026-01-12 03:28:53'),
(507, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":6,\"body_size\":963}', NULL, '2026-01-12 03:28:58'),
(508, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1121}', NULL, '2026-01-12 03:28:58'),
(509, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1696}', NULL, '2026-01-12 03:28:58'),
(510, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-12 03:28:58'),
(511, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":14,\"body_size\":963}', NULL, '2026-01-12 03:28:58'),
(512, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":12,\"body_size\":866}', NULL, '2026-01-12 03:28:58'),
(513, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-12 03:28:58'),
(514, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":29,\"body_size\":769}', NULL, '2026-01-12 03:28:58'),
(515, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1121}', NULL, '2026-01-12 03:28:58'),
(516, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":5,\"body_size\":866}', NULL, '2026-01-12 03:28:58'),
(517, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":29,\"body_size\":970}', NULL, '2026-01-12 03:28:58');
INSERT INTO `audit_logs` (`id`, `event_type`, `user_id`, `user_role`, `ip_address`, `user_agent`, `resource`, `action`, `result`, `details`, `session_id`, `created_at`) VALUES
(518, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1696}', NULL, '2026-01-12 03:28:58'),
(519, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":3,\"body_size\":970}', NULL, '2026-01-12 03:28:58'),
(520, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":6,\"body_size\":769}', NULL, '2026-01-12 03:28:58'),
(521, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1121}', NULL, '2026-01-12 03:29:00'),
(522, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":7,\"body_size\":866}', NULL, '2026-01-12 03:29:00'),
(523, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1696}', NULL, '2026-01-12 03:29:00'),
(524, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":20,\"body_size\":963}', NULL, '2026-01-12 03:29:00'),
(525, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":23,\"body_size\":970}', NULL, '2026-01-12 03:29:00'),
(526, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1304}', NULL, '2026-01-12 03:29:00'),
(527, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":29,\"body_size\":769}', NULL, '2026-01-12 03:29:00'),
(528, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1121}', NULL, '2026-01-12 03:29:00'),
(529, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":14,\"body_size\":866}', NULL, '2026-01-12 03:29:00'),
(530, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1696}', NULL, '2026-01-12 03:29:00'),
(531, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-12 03:29:00'),
(532, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":13,\"body_size\":963}', NULL, '2026-01-12 03:29:00'),
(533, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":7,\"body_size\":769}', NULL, '2026-01-12 03:29:00'),
(534, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":13,\"body_size\":970}', NULL, '2026-01-12 03:29:00'),
(535, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/roles', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/roles\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1460}', NULL, '2026-01-12 03:30:29'),
(536, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/staff', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/staff\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1526}', NULL, '2026-01-12 03:30:29'),
(537, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/roles', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/roles\",\"status_code\":200,\"duration_ms\":1,\"body_size\":1460}', NULL, '2026-01-12 03:30:29'),
(538, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/staff', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/staff\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1526}', NULL, '2026-01-12 03:30:29'),
(539, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/logs?page=1&limit=25', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/logs?page=1&limit=25\",\"status_code\":200,\"duration_ms\":3,\"body_size\":12655}', NULL, '2026-01-12 03:32:33'),
(540, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/logs?page=1&limit=25', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/logs?page=1&limit=25\",\"status_code\":200,\"duration_ms\":4,\"body_size\":12665}', NULL, '2026-01-12 03:32:33'),
(541, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":10,\"body_size\":49310}', NULL, '2026-01-12 03:35:35'),
(542, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":4,\"body_size\":49310}', NULL, '2026-01-12 03:35:35'),
(543, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":3,\"body_size\":49310}', NULL, '2026-01-12 03:35:35'),
(544, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":2,\"body_size\":49310}', NULL, '2026-01-12 03:35:35'),
(545, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":5,\"body_size\":54}', NULL, '2026-01-12 03:35:36'),
(546, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":6,\"body_size\":54}', NULL, '2026-01-12 03:35:36'),
(547, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":20,\"body_size\":59531}', NULL, '2026-01-12 03:35:36'),
(548, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":20,\"body_size\":52271}', NULL, '2026-01-12 03:35:36'),
(549, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":4,\"body_size\":59531}', NULL, '2026-01-12 03:35:36'),
(550, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":2,\"body_size\":52271}', NULL, '2026-01-12 03:35:36'),
(551, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents\",\"status_code\":200,\"duration_ms\":4,\"body_size\":49310}', NULL, '2026-01-12 03:39:37'),
(552, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":18,\"body_size\":457566}', NULL, '2026-01-12 03:39:37'),
(553, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents\",\"status_code\":200,\"duration_ms\":23,\"body_size\":49310}', NULL, '2026-01-12 03:39:37'),
(554, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":15,\"body_size\":457566}', NULL, '2026-01-12 03:39:37'),
(555, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":4,\"body_size\":49310}', NULL, '2026-01-12 03:39:57'),
(556, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":5,\"body_size\":49310}', NULL, '2026-01-12 03:39:57'),
(557, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":3,\"body_size\":49310}', NULL, '2026-01-12 03:39:57'),
(558, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":3,\"body_size\":49310}', NULL, '2026-01-12 03:39:57'),
(559, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":4,\"body_size\":2}', NULL, '2026-01-12 03:41:35'),
(560, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":4,\"body_size\":2}', NULL, '2026-01-12 03:41:35'),
(561, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":2,\"body_size\":2}', NULL, '2026-01-12 03:41:35'),
(562, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":2,\"body_size\":2}', NULL, '2026-01-12 03:41:35'),
(563, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/beneficiaries', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/beneficiaries\",\"status_code\":200,\"duration_ms\":13,\"body_size\":3889}', NULL, '2026-01-12 03:41:38'),
(564, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/beneficiaries', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/beneficiaries\",\"status_code\":200,\"duration_ms\":4,\"body_size\":3889}', NULL, '2026-01-12 03:41:38'),
(565, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":3,\"body_size\":2}', NULL, '2026-01-12 03:41:38'),
(566, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":2,\"body_size\":2}', NULL, '2026-01-12 03:41:38'),
(567, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":3,\"body_size\":2}', NULL, '2026-01-12 03:41:38'),
(568, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":2,\"body_size\":2}', NULL, '2026-01-12 03:41:38'),
(569, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":5,\"body_size\":54}', NULL, '2026-01-12 03:41:39'),
(570, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":3,\"body_size\":54}', NULL, '2026-01-12 03:41:39'),
(571, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":20,\"body_size\":59531}', NULL, '2026-01-12 03:41:39'),
(572, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":20,\"body_size\":52271}', NULL, '2026-01-12 03:41:39'),
(573, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":5,\"body_size\":59531}', NULL, '2026-01-12 03:41:39'),
(574, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":6,\"body_size\":52271}', NULL, '2026-01-12 03:41:39'),
(575, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":8,\"body_size\":2}', NULL, '2026-01-12 03:41:40'),
(576, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":3,\"body_size\":2}', NULL, '2026-01-12 03:41:40'),
(577, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":2,\"body_size\":2}', NULL, '2026-01-12 03:41:40'),
(578, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":3,\"body_size\":2}', NULL, '2026-01-12 03:41:40'),
(579, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":7,\"body_size\":457566}', NULL, '2026-01-12 03:41:51'),
(580, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents\",\"status_code\":200,\"duration_ms\":18,\"body_size\":49310}', NULL, '2026-01-12 03:41:51'),
(581, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents\",\"status_code\":200,\"duration_ms\":3,\"body_size\":49310}', NULL, '2026-01-12 03:41:51'),
(582, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":11,\"body_size\":457566}', NULL, '2026-01-12 03:41:51'),
(583, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":9,\"body_size\":963}', NULL, '2026-01-12 03:41:53'),
(584, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1121}', NULL, '2026-01-12 03:41:53'),
(585, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":9,\"body_size\":863}', NULL, '2026-01-12 03:41:54'),
(586, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":12,\"body_size\":769}', NULL, '2026-01-12 03:41:54'),
(587, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1304}', NULL, '2026-01-12 03:41:54'),
(588, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":9,\"body_size\":963}', NULL, '2026-01-12 03:41:54'),
(589, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":26,\"body_size\":1696}', NULL, '2026-01-12 03:41:54'),
(590, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1121}', NULL, '2026-01-12 03:41:54'),
(591, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-12 03:41:54'),
(592, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":12,\"body_size\":866}', NULL, '2026-01-12 03:41:54'),
(593, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":31,\"body_size\":970}', NULL, '2026-01-12 03:41:54'),
(594, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":13,\"body_size\":769}', NULL, '2026-01-12 03:41:54'),
(595, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1696}', NULL, '2026-01-12 03:41:54'),
(596, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":4,\"body_size\":971}', NULL, '2026-01-12 03:41:54'),
(597, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1121}', NULL, '2026-01-12 03:41:54'),
(598, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1696}', NULL, '2026-01-12 03:41:54'),
(599, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":10,\"body_size\":769}', NULL, '2026-01-12 03:41:54'),
(600, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":15,\"body_size\":963}', NULL, '2026-01-12 03:41:54'),
(601, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":15,\"body_size\":866}', NULL, '2026-01-12 03:41:54'),
(602, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":19,\"body_size\":971}', NULL, '2026-01-12 03:41:54'),
(603, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1304}', NULL, '2026-01-12 03:41:54'),
(604, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":6,\"body_size\":963}', NULL, '2026-01-12 03:41:54'),
(605, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1696}', NULL, '2026-01-12 03:41:54'),
(606, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":19,\"body_size\":1121}', NULL, '2026-01-12 03:41:54'),
(607, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":9,\"body_size\":866}', NULL, '2026-01-12 03:41:54'),
(608, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1304}', NULL, '2026-01-12 03:41:54'),
(609, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":18,\"body_size\":769}', NULL, '2026-01-12 03:41:54'),
(610, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":10,\"body_size\":971}', NULL, '2026-01-12 03:41:54'),
(611, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":9,\"body_size\":963}', NULL, '2026-01-12 03:41:55'),
(612, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1121}', NULL, '2026-01-12 03:41:55'),
(613, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1696}', NULL, '2026-01-12 03:41:55'),
(614, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":11,\"body_size\":769}', NULL, '2026-01-12 03:41:55'),
(615, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":10,\"body_size\":866}', NULL, '2026-01-12 03:41:55'),
(616, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1304}', NULL, '2026-01-12 03:41:55'),
(617, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":21,\"body_size\":963}', NULL, '2026-01-12 03:41:55'),
(618, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":19,\"body_size\":1121}', NULL, '2026-01-12 03:41:55'),
(619, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":22,\"body_size\":1696}', NULL, '2026-01-12 03:41:55'),
(620, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":15,\"body_size\":866}', NULL, '2026-01-12 03:41:55'),
(621, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":44,\"body_size\":971}', NULL, '2026-01-12 03:41:55'),
(622, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":20,\"body_size\":769}', NULL, '2026-01-12 03:41:55'),
(623, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-12 03:41:55'),
(624, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":4,\"body_size\":971}', NULL, '2026-01-12 03:41:55'),
(625, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/staff', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/staff\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1526}', NULL, '2026-01-12 03:41:56'),
(626, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/roles', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/roles\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1460}', NULL, '2026-01-12 03:41:56'),
(627, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/staff', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/staff\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1526}', NULL, '2026-01-12 03:41:56'),
(628, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/roles', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/roles\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1460}', NULL, '2026-01-12 03:41:56'),
(629, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/logs?page=1&limit=25', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/logs?page=1&limit=25\",\"status_code\":200,\"duration_ms\":2,\"body_size\":12775}', NULL, '2026-01-12 03:41:57'),
(630, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/logs?page=1&limit=25', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/logs?page=1&limit=25\",\"status_code\":200,\"duration_ms\":2,\"body_size\":12660}', NULL, '2026-01-12 03:41:57'),
(631, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/system-admin/backup', 'POST', 'SUCCESS', '{\"method\":\"POST\",\"url\":\"/api/system-admin/backup\",\"status_code\":200,\"duration_ms\":1,\"body_size\":269}', NULL, '2026-01-12 03:42:48'),
(632, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":42,\"body_size\":180}', NULL, '2026-01-12 17:54:00'),
(633, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":4,\"body_size\":180}', NULL, '2026-01-12 17:54:00'),
(634, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":19,\"body_size\":59531}', NULL, '2026-01-12 17:54:01'),
(635, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":8,\"body_size\":59531}', NULL, '2026-01-12 17:54:01'),
(636, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":20,\"body_size\":457566}', NULL, '2026-01-12 17:54:01'),
(637, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":7,\"body_size\":457566}', NULL, '2026-01-12 17:54:01'),
(638, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":27,\"body_size\":963}', NULL, '2026-01-12 17:54:10'),
(639, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":27,\"body_size\":1121}', NULL, '2026-01-12 17:54:10'),
(640, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":41,\"body_size\":1696}', NULL, '2026-01-12 17:54:10'),
(641, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":35,\"body_size\":864}', NULL, '2026-01-12 17:54:10'),
(642, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":26,\"body_size\":1304}', NULL, '2026-01-12 17:54:10'),
(643, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":60,\"body_size\":769}', NULL, '2026-01-12 17:54:10'),
(644, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":36,\"body_size\":963}', NULL, '2026-01-12 17:54:10'),
(645, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 17:54:10'),
(646, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":11,\"body_size\":866}', NULL, '2026-01-12 17:54:10'),
(647, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":40,\"body_size\":1121}', NULL, '2026-01-12 17:54:10'),
(648, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1696}', NULL, '2026-01-12 17:54:10'),
(649, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":11,\"body_size\":769}', NULL, '2026-01-12 17:54:10'),
(650, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":82,\"body_size\":969}', NULL, '2026-01-12 17:54:10'),
(651, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":4,\"body_size\":969}', NULL, '2026-01-12 17:54:10');
INSERT INTO `audit_logs` (`id`, `event_type`, `user_id`, `user_role`, `ip_address`, `user_agent`, `resource`, `action`, `result`, `details`, `session_id`, `created_at`) VALUES
(652, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":14,\"body_size\":963}', NULL, '2026-01-12 17:54:13'),
(653, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":11,\"body_size\":866}', NULL, '2026-01-12 17:54:13'),
(654, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1121}', NULL, '2026-01-12 17:54:13'),
(655, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":23,\"body_size\":769}', NULL, '2026-01-12 17:54:13'),
(656, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1304}', NULL, '2026-01-12 17:54:13'),
(657, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":11,\"body_size\":963}', NULL, '2026-01-12 17:54:13'),
(658, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":34,\"body_size\":1696}', NULL, '2026-01-12 17:54:13'),
(659, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":38,\"body_size\":969}', NULL, '2026-01-12 17:54:13'),
(660, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":14,\"body_size\":866}', NULL, '2026-01-12 17:54:13'),
(661, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1304}', NULL, '2026-01-12 17:54:13'),
(662, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":19,\"body_size\":1121}', NULL, '2026-01-12 17:54:13'),
(663, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":8,\"body_size\":969}', NULL, '2026-01-12 17:54:13'),
(664, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":17,\"body_size\":769}', NULL, '2026-01-12 17:54:13'),
(665, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1696}', NULL, '2026-01-12 17:54:13'),
(666, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/residents?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/residents?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":7,\"body_size\":5025}', NULL, '2026-01-12 17:55:40'),
(667, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/pdf/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/pdf/residents\",\"status_code\":200,\"duration_ms\":1,\"body_size\":55}', NULL, '2026-01-12 17:55:53'),
(668, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":47,\"body_size\":963}', NULL, '2026-01-12 18:00:10'),
(669, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":35,\"body_size\":866}', NULL, '2026-01-12 18:00:10'),
(670, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":48,\"body_size\":1121}', NULL, '2026-01-12 18:00:10'),
(671, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":65,\"body_size\":1696}', NULL, '2026-01-12 18:00:10'),
(672, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":35,\"body_size\":1304}', NULL, '2026-01-12 18:00:10'),
(673, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":64,\"body_size\":769}', NULL, '2026-01-12 18:00:10'),
(674, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":89,\"body_size\":970}', NULL, '2026-01-12 18:00:10'),
(675, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":41,\"body_size\":866}', NULL, '2026-01-12 18:00:10'),
(676, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1696}', NULL, '2026-01-12 18:00:10'),
(677, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":48,\"body_size\":1121}', NULL, '2026-01-12 18:00:10'),
(678, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":58,\"body_size\":963}', NULL, '2026-01-12 18:00:10'),
(679, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":16,\"body_size\":1304}', NULL, '2026-01-12 18:00:10'),
(680, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":10,\"body_size\":969}', NULL, '2026-01-12 18:00:10'),
(681, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":30,\"body_size\":769}', NULL, '2026-01-12 18:00:10'),
(682, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":13,\"body_size\":963}', NULL, '2026-01-12 18:00:11'),
(683, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1121}', NULL, '2026-01-12 18:00:11'),
(684, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":12,\"body_size\":866}', NULL, '2026-01-12 18:00:11'),
(685, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":25,\"body_size\":1696}', NULL, '2026-01-12 18:00:11'),
(686, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1304}', NULL, '2026-01-12 18:00:11'),
(687, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":26,\"body_size\":769}', NULL, '2026-01-12 18:00:11'),
(688, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":19,\"body_size\":963}', NULL, '2026-01-12 18:00:11'),
(689, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":20,\"body_size\":866}', NULL, '2026-01-12 18:00:11'),
(690, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":53,\"body_size\":969}', NULL, '2026-01-12 18:00:11'),
(691, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":36,\"body_size\":1121}', NULL, '2026-01-12 18:00:11'),
(692, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1304}', NULL, '2026-01-12 18:00:11'),
(693, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":24,\"body_size\":1696}', NULL, '2026-01-12 18:00:11'),
(694, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":19,\"body_size\":769}', NULL, '2026-01-12 18:00:11'),
(695, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":9,\"body_size\":969}', NULL, '2026-01-12 18:00:11'),
(696, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-12 18:00:13'),
(697, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-12 18:00:13'),
(698, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1121}', NULL, '2026-01-12 18:00:13'),
(699, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":6,\"body_size\":864}', NULL, '2026-01-12 18:00:13'),
(700, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":11,\"body_size\":769}', NULL, '2026-01-12 18:00:13'),
(701, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":17,\"body_size\":963}', NULL, '2026-01-12 18:00:13'),
(702, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:00:13'),
(703, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":29,\"body_size\":1696}', NULL, '2026-01-12 18:00:13'),
(704, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1121}', NULL, '2026-01-12 18:00:13'),
(705, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":10,\"body_size\":963}', NULL, '2026-01-12 18:00:13'),
(706, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-12 18:00:13'),
(707, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":18,\"body_size\":866}', NULL, '2026-01-12 18:00:13'),
(708, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":15,\"body_size\":769}', NULL, '2026-01-12 18:00:13'),
(709, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":36,\"body_size\":969}', NULL, '2026-01-12 18:00:13'),
(710, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1696}', NULL, '2026-01-12 18:00:13'),
(711, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":6,\"body_size\":969}', NULL, '2026-01-12 18:00:13'),
(712, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":2,\"body_size\":180}', NULL, '2026-01-12 18:00:20'),
(713, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-12 18:00:20'),
(714, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":11,\"body_size\":963}', NULL, '2026-01-12 18:00:20'),
(715, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1121}', NULL, '2026-01-12 18:00:20'),
(716, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":10,\"body_size\":769}', NULL, '2026-01-12 18:00:20'),
(717, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":12,\"body_size\":864}', NULL, '2026-01-12 18:00:20'),
(718, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:00:20'),
(719, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1121}', NULL, '2026-01-12 18:00:20'),
(720, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":23,\"body_size\":1696}', NULL, '2026-01-12 18:00:20'),
(721, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":15,\"body_size\":963}', NULL, '2026-01-12 18:00:20'),
(722, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-12 18:00:20'),
(723, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":6,\"body_size\":866}', NULL, '2026-01-12 18:00:20'),
(724, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":28,\"body_size\":970}', NULL, '2026-01-12 18:00:20'),
(725, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":11,\"body_size\":769}', NULL, '2026-01-12 18:00:20'),
(726, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1696}', NULL, '2026-01-12 18:00:20'),
(727, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":4,\"body_size\":970}', NULL, '2026-01-12 18:00:20'),
(728, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":10,\"body_size\":180}', NULL, '2026-01-12 18:05:40'),
(729, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-12 18:05:40'),
(730, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":19,\"body_size\":59531}', NULL, '2026-01-12 18:05:40'),
(731, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":5,\"body_size\":59531}', NULL, '2026-01-12 18:05:40'),
(732, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":10,\"body_size\":457566}', NULL, '2026-01-12 18:05:40'),
(733, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":11,\"body_size\":457566}', NULL, '2026-01-12 18:05:41'),
(734, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":25,\"body_size\":963}', NULL, '2026-01-12 18:05:43'),
(735, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":41,\"body_size\":1696}', NULL, '2026-01-12 18:05:43'),
(736, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":36,\"body_size\":862}', NULL, '2026-01-12 18:05:43'),
(737, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":47,\"body_size\":1121}', NULL, '2026-01-12 18:05:43'),
(738, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":44,\"body_size\":1304}', NULL, '2026-01-12 18:05:43'),
(739, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":87,\"body_size\":769}', NULL, '2026-01-12 18:05:43'),
(740, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":43,\"body_size\":1696}', NULL, '2026-01-12 18:05:43'),
(741, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1304}', NULL, '2026-01-12 18:05:43'),
(742, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":96,\"body_size\":969}', NULL, '2026-01-12 18:05:43'),
(743, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":57,\"body_size\":963}', NULL, '2026-01-12 18:05:43'),
(744, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":19,\"body_size\":866}', NULL, '2026-01-12 18:05:43'),
(745, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1121}', NULL, '2026-01-12 18:05:43'),
(746, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":9,\"body_size\":769}', NULL, '2026-01-12 18:05:43'),
(747, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":7,\"body_size\":968}', NULL, '2026-01-12 18:05:43'),
(748, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":26,\"body_size\":963}', NULL, '2026-01-12 18:05:51'),
(749, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":28,\"body_size\":1121}', NULL, '2026-01-12 18:05:51'),
(750, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":34,\"body_size\":866}', NULL, '2026-01-12 18:05:51'),
(751, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":15,\"body_size\":963}', NULL, '2026-01-12 18:05:51'),
(752, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":58,\"body_size\":1696}', NULL, '2026-01-12 18:05:51'),
(753, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1304}', NULL, '2026-01-12 18:05:51'),
(754, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":57,\"body_size\":769}', NULL, '2026-01-12 18:05:51'),
(755, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":57,\"body_size\":969}', NULL, '2026-01-12 18:05:51'),
(756, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1121}', NULL, '2026-01-12 18:05:51'),
(757, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":17,\"body_size\":866}', NULL, '2026-01-12 18:05:51'),
(758, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1304}', NULL, '2026-01-12 18:05:51'),
(759, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":34,\"body_size\":1696}', NULL, '2026-01-12 18:05:51'),
(760, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":33,\"body_size\":769}', NULL, '2026-01-12 18:05:51'),
(761, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":33,\"body_size\":969}', NULL, '2026-01-12 18:05:51'),
(762, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":7,\"body_size\":866}', NULL, '2026-01-12 18:05:53'),
(763, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":19,\"body_size\":963}', NULL, '2026-01-12 18:05:53'),
(764, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":23,\"body_size\":1121}', NULL, '2026-01-12 18:05:53'),
(765, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":24,\"body_size\":968}', NULL, '2026-01-12 18:05:53'),
(766, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":33,\"body_size\":1696}', NULL, '2026-01-12 18:05:53'),
(767, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":31,\"body_size\":769}', NULL, '2026-01-12 18:05:53'),
(768, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1304}', NULL, '2026-01-12 18:05:53'),
(769, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":17,\"body_size\":963}', NULL, '2026-01-12 18:05:53'),
(770, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1696}', NULL, '2026-01-12 18:05:53'),
(771, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:05:53'),
(772, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1121}', NULL, '2026-01-12 18:05:53'),
(773, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":12,\"body_size\":866}', NULL, '2026-01-12 18:05:53'),
(774, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":17,\"body_size\":769}', NULL, '2026-01-12 18:05:53'),
(775, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":19,\"body_size\":969}', NULL, '2026-01-12 18:05:53'),
(776, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":10,\"body_size\":180}', NULL, '2026-01-12 18:10:32'),
(777, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-12 18:10:32'),
(778, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":16,\"body_size\":59531}', NULL, '2026-01-12 18:10:32'),
(779, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":5,\"body_size\":59531}', NULL, '2026-01-12 18:10:32'),
(780, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":457566}', NULL, '2026-01-12 18:10:32'),
(781, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":5,\"body_size\":457566}', NULL, '2026-01-12 18:10:33'),
(782, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":22,\"body_size\":963}', NULL, '2026-01-12 18:10:52');
INSERT INTO `audit_logs` (`id`, `event_type`, `user_id`, `user_role`, `ip_address`, `user_agent`, `resource`, `action`, `result`, `details`, `session_id`, `created_at`) VALUES
(783, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":39,\"body_size\":1696}', NULL, '2026-01-12 18:10:52'),
(784, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":31,\"body_size\":862}', NULL, '2026-01-12 18:10:52'),
(785, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":43,\"body_size\":1121}', NULL, '2026-01-12 18:10:52'),
(786, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":28,\"body_size\":1304}', NULL, '2026-01-12 18:10:52'),
(787, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":68,\"body_size\":769}', NULL, '2026-01-12 18:10:52'),
(788, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":26,\"body_size\":1696}', NULL, '2026-01-12 18:10:52'),
(789, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1304}', NULL, '2026-01-12 18:10:52'),
(790, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":73,\"body_size\":970}', NULL, '2026-01-12 18:10:52'),
(791, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":30,\"body_size\":866}', NULL, '2026-01-12 18:10:52'),
(792, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":39,\"body_size\":963}', NULL, '2026-01-12 18:10:52'),
(793, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1121}', NULL, '2026-01-12 18:10:52'),
(794, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":8,\"body_size\":769}', NULL, '2026-01-12 18:10:52'),
(795, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":8,\"body_size\":969}', NULL, '2026-01-12 18:10:52'),
(796, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":12,\"body_size\":180}', NULL, '2026-01-12 18:15:01'),
(797, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":6,\"body_size\":180}', NULL, '2026-01-12 18:15:01'),
(798, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":26,\"body_size\":59531}', NULL, '2026-01-12 18:15:01'),
(799, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":16,\"body_size\":59531}', NULL, '2026-01-12 18:15:01'),
(800, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":13,\"body_size\":457566}', NULL, '2026-01-12 18:15:01'),
(801, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":10,\"body_size\":457566}', NULL, '2026-01-12 18:15:01'),
(802, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":5,\"body_size\":180}', NULL, '2026-01-12 18:15:02'),
(803, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":5,\"body_size\":180}', NULL, '2026-01-12 18:15:02'),
(804, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":26,\"body_size\":963}', NULL, '2026-01-12 18:15:02'),
(805, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":47,\"body_size\":1696}', NULL, '2026-01-12 18:15:02'),
(806, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":40,\"body_size\":862}', NULL, '2026-01-12 18:15:02'),
(807, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":49,\"body_size\":1121}', NULL, '2026-01-12 18:15:02'),
(808, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":14,\"body_size\":963}', NULL, '2026-01-12 18:15:02'),
(809, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":55,\"body_size\":968}', NULL, '2026-01-12 18:15:02'),
(810, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":60,\"body_size\":769}', NULL, '2026-01-12 18:15:02'),
(811, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1696}', NULL, '2026-01-12 18:15:02'),
(812, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":34,\"body_size\":1304}', NULL, '2026-01-12 18:15:02'),
(813, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":42,\"body_size\":1121}', NULL, '2026-01-12 18:15:02'),
(814, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1304}', NULL, '2026-01-12 18:15:02'),
(815, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":32,\"body_size\":866}', NULL, '2026-01-12 18:15:02'),
(816, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":40,\"body_size\":769}', NULL, '2026-01-12 18:15:02'),
(817, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":37,\"body_size\":968}', NULL, '2026-01-12 18:15:02'),
(818, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":12,\"body_size\":963}', NULL, '2026-01-12 18:15:05'),
(819, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":12,\"body_size\":866}', NULL, '2026-01-12 18:15:05'),
(820, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1121}', NULL, '2026-01-12 18:15:05'),
(821, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":26,\"body_size\":1696}', NULL, '2026-01-12 18:15:05'),
(822, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":25,\"body_size\":769}', NULL, '2026-01-12 18:15:05'),
(823, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1304}', NULL, '2026-01-12 18:15:05'),
(824, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":16,\"body_size\":963}', NULL, '2026-01-12 18:15:05'),
(825, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1121}', NULL, '2026-01-12 18:15:05'),
(826, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":35,\"body_size\":968}', NULL, '2026-01-12 18:15:05'),
(827, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":15,\"body_size\":769}', NULL, '2026-01-12 18:15:05'),
(828, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":26,\"body_size\":1696}', NULL, '2026-01-12 18:15:05'),
(829, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1304}', NULL, '2026-01-12 18:15:05'),
(830, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":19,\"body_size\":968}', NULL, '2026-01-12 18:15:05'),
(831, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":15,\"body_size\":866}', NULL, '2026-01-12 18:15:05'),
(832, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":15,\"body_size\":180}', NULL, '2026-01-12 18:16:54'),
(833, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":23,\"body_size\":180}', NULL, '2026-01-12 18:16:54'),
(834, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":21,\"body_size\":963}', NULL, '2026-01-12 18:16:54'),
(835, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":20,\"body_size\":1121}', NULL, '2026-01-12 18:16:54'),
(836, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":27,\"body_size\":1696}', NULL, '2026-01-12 18:16:54'),
(837, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":19,\"body_size\":864}', NULL, '2026-01-12 18:16:54'),
(838, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":32,\"body_size\":769}', NULL, '2026-01-12 18:16:55'),
(839, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":32,\"body_size\":963}', NULL, '2026-01-12 18:16:55'),
(840, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":29,\"body_size\":1696}', NULL, '2026-01-12 18:16:55'),
(841, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":57,\"body_size\":970}', NULL, '2026-01-12 18:16:55'),
(842, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":16,\"body_size\":1304}', NULL, '2026-01-12 18:16:55'),
(843, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":26,\"body_size\":769}', NULL, '2026-01-12 18:16:55'),
(844, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":40,\"body_size\":1121}', NULL, '2026-01-12 18:16:55'),
(845, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":24,\"body_size\":970}', NULL, '2026-01-12 18:16:55'),
(846, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1304}', NULL, '2026-01-12 18:16:55'),
(847, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":19,\"body_size\":866}', NULL, '2026-01-12 18:16:55'),
(848, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":21,\"body_size\":963}', NULL, '2026-01-12 18:16:55'),
(849, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1121}', NULL, '2026-01-12 18:16:56'),
(850, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":17,\"body_size\":866}', NULL, '2026-01-12 18:16:56'),
(851, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":32,\"body_size\":1696}', NULL, '2026-01-12 18:16:56'),
(852, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1304}', NULL, '2026-01-12 18:16:56'),
(853, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":6,\"body_size\":963}', NULL, '2026-01-12 18:16:56'),
(854, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":34,\"body_size\":769}', NULL, '2026-01-12 18:16:56'),
(855, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":35,\"body_size\":970}', NULL, '2026-01-12 18:16:56'),
(856, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1121}', NULL, '2026-01-12 18:16:56'),
(857, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":24,\"body_size\":1696}', NULL, '2026-01-12 18:16:56'),
(858, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-12 18:16:56'),
(859, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":21,\"body_size\":866}', NULL, '2026-01-12 18:16:56'),
(860, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":29,\"body_size\":769}', NULL, '2026-01-12 18:16:56'),
(861, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":29,\"body_size\":970}', NULL, '2026-01-12 18:16:56'),
(862, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":14,\"body_size\":180}', NULL, '2026-01-12 18:18:02'),
(863, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":4,\"body_size\":180}', NULL, '2026-01-12 18:18:02'),
(864, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":59531}', NULL, '2026-01-12 18:18:03'),
(865, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":5,\"body_size\":59531}', NULL, '2026-01-12 18:18:03'),
(866, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":457566}', NULL, '2026-01-12 18:18:03'),
(867, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":6,\"body_size\":457566}', NULL, '2026-01-12 18:18:03'),
(868, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":24,\"body_size\":963}', NULL, '2026-01-12 18:18:11'),
(869, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":35,\"body_size\":862}', NULL, '2026-01-12 18:18:11'),
(870, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":47,\"body_size\":1696}', NULL, '2026-01-12 18:18:11'),
(871, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":45,\"body_size\":1121}', NULL, '2026-01-12 18:18:11'),
(872, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":32,\"body_size\":1304}', NULL, '2026-01-12 18:18:11'),
(873, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":71,\"body_size\":769}', NULL, '2026-01-12 18:18:11'),
(874, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":76,\"body_size\":969}', NULL, '2026-01-12 18:18:11'),
(875, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":39,\"body_size\":963}', NULL, '2026-01-12 18:18:11'),
(876, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":38,\"body_size\":1696}', NULL, '2026-01-12 18:18:11'),
(877, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":49,\"body_size\":1121}', NULL, '2026-01-12 18:18:11'),
(878, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":22,\"body_size\":866}', NULL, '2026-01-12 18:18:11'),
(879, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1304}', NULL, '2026-01-12 18:18:11'),
(880, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":33,\"body_size\":769}', NULL, '2026-01-12 18:18:11'),
(881, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":35,\"body_size\":969}', NULL, '2026-01-12 18:18:11'),
(882, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":4,\"body_size\":180}', NULL, '2026-01-12 18:33:59'),
(883, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":5,\"body_size\":180}', NULL, '2026-01-12 18:33:59'),
(884, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":22,\"body_size\":963}', NULL, '2026-01-12 18:33:59'),
(885, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":20,\"body_size\":769}', NULL, '2026-01-12 18:33:59'),
(886, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1696}', NULL, '2026-01-12 18:33:59'),
(887, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":30,\"body_size\":1121}', NULL, '2026-01-12 18:33:59'),
(888, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":27,\"body_size\":963}', NULL, '2026-01-12 18:33:59'),
(889, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":42,\"body_size\":1696}', NULL, '2026-01-12 18:33:59'),
(890, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":37,\"body_size\":1121}', NULL, '2026-01-12 18:33:59'),
(891, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1304}', NULL, '2026-01-12 18:33:59'),
(892, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":30,\"body_size\":769}', NULL, '2026-01-12 18:33:59'),
(893, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":29,\"body_size\":866}', NULL, '2026-01-12 18:33:59'),
(894, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:33:59'),
(895, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":17,\"body_size\":866}', NULL, '2026-01-12 18:33:59'),
(896, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":41,\"body_size\":970}', NULL, '2026-01-12 18:33:59'),
(897, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":23,\"body_size\":970}', NULL, '2026-01-12 18:33:59'),
(898, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":18,\"body_size\":59531}', NULL, '2026-01-12 18:34:06'),
(899, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":22,\"body_size\":59531}', NULL, '2026-01-12 18:34:06'),
(900, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":13,\"body_size\":457566}', NULL, '2026-01-12 18:34:06'),
(901, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":28,\"body_size\":457566}', NULL, '2026-01-12 18:34:06'),
(902, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":7,\"body_size\":180}', NULL, '2026-01-12 18:34:08'),
(903, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":6,\"body_size\":180}', NULL, '2026-01-12 18:34:08'),
(904, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":59531}', NULL, '2026-01-12 18:34:09'),
(905, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":18,\"body_size\":59531}', NULL, '2026-01-12 18:34:09'),
(906, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":7,\"body_size\":457566}', NULL, '2026-01-12 18:34:09'),
(907, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":19,\"body_size\":457566}', NULL, '2026-01-12 18:34:09'),
(908, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":14,\"body_size\":963}', NULL, '2026-01-12 18:34:11'),
(909, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1121}', NULL, '2026-01-12 18:34:11'),
(910, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":23,\"body_size\":1696}', NULL, '2026-01-12 18:34:11'),
(911, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":31,\"body_size\":863}', NULL, '2026-01-12 18:34:11'),
(912, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":24,\"body_size\":1304}', NULL, '2026-01-12 18:34:11'),
(913, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":14,\"body_size\":963}', NULL, '2026-01-12 18:34:11'),
(914, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":54,\"body_size\":769}', NULL, '2026-01-12 18:34:11'),
(915, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1696}', NULL, '2026-01-12 18:34:11');
INSERT INTO `audit_logs` (`id`, `event_type`, `user_id`, `user_role`, `ip_address`, `user_agent`, `resource`, `action`, `result`, `details`, `session_id`, `created_at`) VALUES
(916, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":60,\"body_size\":970}', NULL, '2026-01-12 18:34:11'),
(917, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":25,\"body_size\":1121}', NULL, '2026-01-12 18:34:11'),
(918, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":17,\"body_size\":866}', NULL, '2026-01-12 18:34:11'),
(919, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1304}', NULL, '2026-01-12 18:34:11'),
(920, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":27,\"body_size\":970}', NULL, '2026-01-12 18:34:11'),
(921, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":33,\"body_size\":769}', NULL, '2026-01-12 18:34:11'),
(922, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":6,\"body_size\":866}', NULL, '2026-01-12 18:34:14'),
(923, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":12,\"body_size\":769}', NULL, '2026-01-12 18:34:14'),
(924, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":19,\"body_size\":963}', NULL, '2026-01-12 18:34:14'),
(925, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":34,\"body_size\":1121}', NULL, '2026-01-12 18:34:14'),
(926, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1304}', NULL, '2026-01-12 18:34:14'),
(927, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":39,\"body_size\":1696}', NULL, '2026-01-12 18:34:14'),
(928, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":19,\"body_size\":963}', NULL, '2026-01-12 18:34:14'),
(929, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1121}', NULL, '2026-01-12 18:34:14'),
(930, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":41,\"body_size\":970}', NULL, '2026-01-12 18:34:14'),
(931, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1696}', NULL, '2026-01-12 18:34:14'),
(932, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-12 18:34:14'),
(933, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:34:14'),
(934, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":14,\"body_size\":769}', NULL, '2026-01-12 18:34:14'),
(935, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":13,\"body_size\":970}', NULL, '2026-01-12 18:34:14'),
(936, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":14,\"body_size\":180}', NULL, '2026-01-12 18:34:42'),
(937, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-12 18:34:42'),
(938, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":59531}', NULL, '2026-01-12 18:34:42'),
(939, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":5,\"body_size\":59531}', NULL, '2026-01-12 18:34:42'),
(940, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":457566}', NULL, '2026-01-12 18:34:42'),
(941, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":5,\"body_size\":457566}', NULL, '2026-01-12 18:34:42'),
(942, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":21,\"body_size\":963}', NULL, '2026-01-12 18:34:47'),
(943, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":37,\"body_size\":1696}', NULL, '2026-01-12 18:34:47'),
(944, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":31,\"body_size\":862}', NULL, '2026-01-12 18:34:47'),
(945, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":39,\"body_size\":1121}', NULL, '2026-01-12 18:34:47'),
(946, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":25,\"body_size\":1304}', NULL, '2026-01-12 18:34:47'),
(947, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":64,\"body_size\":769}', NULL, '2026-01-12 18:34:47'),
(948, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":28,\"body_size\":1696}', NULL, '2026-01-12 18:34:47'),
(949, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":69,\"body_size\":969}', NULL, '2026-01-12 18:34:47'),
(950, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":43,\"body_size\":963}', NULL, '2026-01-12 18:34:47'),
(951, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":43,\"body_size\":1121}', NULL, '2026-01-12 18:34:47'),
(952, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":16,\"body_size\":866}', NULL, '2026-01-12 18:34:47'),
(953, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:34:47'),
(954, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":26,\"body_size\":769}', NULL, '2026-01-12 18:34:47'),
(955, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":25,\"body_size\":968}', NULL, '2026-01-12 18:34:47'),
(956, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":12,\"body_size\":963}', NULL, '2026-01-12 18:34:50'),
(957, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":20,\"body_size\":769}', NULL, '2026-01-12 18:34:50'),
(958, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-12 18:34:50'),
(959, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":22,\"body_size\":866}', NULL, '2026-01-12 18:34:50'),
(960, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":29,\"body_size\":1121}', NULL, '2026-01-12 18:34:50'),
(961, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":43,\"body_size\":1696}', NULL, '2026-01-12 18:34:50'),
(962, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":20,\"body_size\":963}', NULL, '2026-01-12 18:34:50'),
(963, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":11,\"body_size\":769}', NULL, '2026-01-12 18:34:50'),
(964, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":46,\"body_size\":969}', NULL, '2026-01-12 18:34:50'),
(965, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1121}', NULL, '2026-01-12 18:34:50'),
(966, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":22,\"body_size\":1696}', NULL, '2026-01-12 18:34:50'),
(967, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-12 18:34:50'),
(968, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-12 18:34:50'),
(969, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":13,\"body_size\":969}', NULL, '2026-01-12 18:34:50'),
(970, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":17,\"body_size\":180}', NULL, '2026-01-12 18:38:15'),
(971, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":14,\"body_size\":180}', NULL, '2026-01-12 18:38:15'),
(972, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":45,\"body_size\":963}', NULL, '2026-01-12 18:38:15'),
(973, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":49,\"body_size\":1696}', NULL, '2026-01-12 18:38:15'),
(974, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":54,\"body_size\":864}', NULL, '2026-01-12 18:38:15'),
(975, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":71,\"body_size\":1121}', NULL, '2026-01-12 18:38:15'),
(976, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":42,\"body_size\":1304}', NULL, '2026-01-12 18:38:15'),
(977, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":30,\"body_size\":1121}', NULL, '2026-01-12 18:38:15'),
(978, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":109,\"body_size\":970}', NULL, '2026-01-12 18:38:15'),
(979, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":106,\"body_size\":769}', NULL, '2026-01-12 18:38:15'),
(980, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":54,\"body_size\":963}', NULL, '2026-01-12 18:38:15'),
(981, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:38:15'),
(982, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":59,\"body_size\":1696}', NULL, '2026-01-12 18:38:15'),
(983, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":29,\"body_size\":769}', NULL, '2026-01-12 18:38:15'),
(984, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":23,\"body_size\":866}', NULL, '2026-01-12 18:38:15'),
(985, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":28,\"body_size\":970}', NULL, '2026-01-12 18:38:15'),
(986, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":4,\"body_size\":963}', NULL, '2026-01-12 18:38:15'),
(987, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":14,\"body_size\":963}', NULL, '2026-01-12 18:38:16'),
(988, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":50,\"body_size\":1696}', NULL, '2026-01-12 18:38:16'),
(989, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":15,\"body_size\":769}', NULL, '2026-01-12 18:38:16'),
(990, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":28,\"body_size\":1121}', NULL, '2026-01-12 18:38:16'),
(991, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":41,\"body_size\":1696}', NULL, '2026-01-12 18:38:16'),
(992, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":16,\"body_size\":1304}', NULL, '2026-01-12 18:38:16'),
(993, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":30,\"body_size\":866}', NULL, '2026-01-12 18:38:16'),
(994, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":53,\"body_size\":968}', NULL, '2026-01-12 18:38:16'),
(995, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":29,\"body_size\":1121}', NULL, '2026-01-12 18:38:16'),
(996, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":15,\"body_size\":866}', NULL, '2026-01-12 18:38:16'),
(997, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-12 18:38:16'),
(998, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":25,\"body_size\":969}', NULL, '2026-01-12 18:38:16'),
(999, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":32,\"body_size\":769}', NULL, '2026-01-12 18:38:16'),
(1000, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":6,\"body_size\":180}', NULL, '2026-01-12 18:38:41'),
(1001, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":5,\"body_size\":180}', NULL, '2026-01-12 18:38:41'),
(1002, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":6,\"body_size\":963}', NULL, '2026-01-12 18:38:42'),
(1003, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":20,\"body_size\":1696}', NULL, '2026-01-12 18:38:42'),
(1004, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":17,\"body_size\":769}', NULL, '2026-01-12 18:38:42'),
(1005, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":23,\"body_size\":864}', NULL, '2026-01-12 18:38:42'),
(1006, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":31,\"body_size\":1121}', NULL, '2026-01-12 18:38:42'),
(1007, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":25,\"body_size\":963}', NULL, '2026-01-12 18:38:42'),
(1008, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":30,\"body_size\":969}', NULL, '2026-01-12 18:38:42'),
(1009, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":20,\"body_size\":1304}', NULL, '2026-01-12 18:38:42'),
(1010, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1121}', NULL, '2026-01-12 18:38:42'),
(1011, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":23,\"body_size\":1696}', NULL, '2026-01-12 18:38:42'),
(1012, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-12 18:38:42'),
(1013, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":19,\"body_size\":866}', NULL, '2026-01-12 18:38:42'),
(1014, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":31,\"body_size\":769}', NULL, '2026-01-12 18:38:42'),
(1015, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":30,\"body_size\":969}', NULL, '2026-01-12 18:38:42'),
(1016, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":16,\"body_size\":963}', NULL, '2026-01-12 18:38:43'),
(1017, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1121}', NULL, '2026-01-12 18:38:43'),
(1018, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":18,\"body_size\":769}', NULL, '2026-01-12 18:38:43'),
(1019, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":23,\"body_size\":963}', NULL, '2026-01-12 18:38:43'),
(1020, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":31,\"body_size\":1696}', NULL, '2026-01-12 18:38:43'),
(1021, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1304}', NULL, '2026-01-12 18:38:43'),
(1022, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":23,\"body_size\":866}', NULL, '2026-01-12 18:38:43'),
(1023, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1696}', NULL, '2026-01-12 18:38:43'),
(1024, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":11,\"body_size\":769}', NULL, '2026-01-12 18:38:43'),
(1025, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":42,\"body_size\":968}', NULL, '2026-01-12 18:38:43'),
(1026, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":19,\"body_size\":1121}', NULL, '2026-01-12 18:38:43'),
(1027, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":13,\"body_size\":866}', NULL, '2026-01-12 18:38:43'),
(1028, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1304}', NULL, '2026-01-12 18:38:43'),
(1029, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":24,\"body_size\":969}', NULL, '2026-01-12 18:38:43'),
(1030, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":60,\"body_size\":963}', NULL, '2026-01-12 18:42:56'),
(1031, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":48,\"body_size\":866}', NULL, '2026-01-12 18:42:56'),
(1032, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":60,\"body_size\":1121}', NULL, '2026-01-12 18:42:56'),
(1033, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":81,\"body_size\":1696}', NULL, '2026-01-12 18:42:56'),
(1034, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":21,\"body_size\":963}', NULL, '2026-01-12 18:42:56'),
(1035, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":103,\"body_size\":769}', NULL, '2026-01-12 18:42:56'),
(1036, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":58,\"body_size\":1304}', NULL, '2026-01-12 18:42:56'),
(1037, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":41,\"body_size\":1121}', NULL, '2026-01-12 18:42:56'),
(1038, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":59,\"body_size\":1696}', NULL, '2026-01-12 18:42:56'),
(1039, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":96,\"body_size\":970}', NULL, '2026-01-12 18:42:56'),
(1040, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":20,\"body_size\":866}', NULL, '2026-01-12 18:42:56'),
(1041, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:42:56'),
(1042, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":28,\"body_size\":769}', NULL, '2026-01-12 18:42:56'),
(1043, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":28,\"body_size\":969}', NULL, '2026-01-12 18:42:56'),
(1044, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":15,\"body_size\":180}', NULL, '2026-01-12 18:44:01'),
(1045, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":5,\"body_size\":180}', NULL, '2026-01-12 18:44:01'),
(1046, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":17,\"body_size\":59531}', NULL, '2026-01-12 18:44:02');
INSERT INTO `audit_logs` (`id`, `event_type`, `user_id`, `user_role`, `ip_address`, `user_agent`, `resource`, `action`, `result`, `details`, `session_id`, `created_at`) VALUES
(1047, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":7,\"body_size\":59531}', NULL, '2026-01-12 18:44:02'),
(1048, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":14,\"body_size\":457566}', NULL, '2026-01-12 18:44:02'),
(1049, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":7,\"body_size\":457566}', NULL, '2026-01-12 18:44:02'),
(1050, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":26,\"body_size\":963}', NULL, '2026-01-12 18:44:08'),
(1051, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":33,\"body_size\":1121}', NULL, '2026-01-12 18:44:08'),
(1052, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":38,\"body_size\":1696}', NULL, '2026-01-12 18:44:08'),
(1053, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":28,\"body_size\":862}', NULL, '2026-01-12 18:44:08'),
(1054, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":30,\"body_size\":1304}', NULL, '2026-01-12 18:44:08'),
(1055, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":62,\"body_size\":769}', NULL, '2026-01-12 18:44:08'),
(1056, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":62,\"body_size\":970}', NULL, '2026-01-12 18:44:08'),
(1057, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":28,\"body_size\":1121}', NULL, '2026-01-12 18:44:08'),
(1058, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":35,\"body_size\":963}', NULL, '2026-01-12 18:44:08'),
(1059, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":36,\"body_size\":1696}', NULL, '2026-01-12 18:44:08'),
(1060, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":23,\"body_size\":769}', NULL, '2026-01-12 18:44:08'),
(1061, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":15,\"body_size\":866}', NULL, '2026-01-12 18:44:08'),
(1062, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:44:08'),
(1063, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":21,\"body_size\":968}', NULL, '2026-01-12 18:44:08'),
(1064, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":8,\"body_size\":180}', NULL, '2026-01-12 18:53:11'),
(1065, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":5,\"body_size\":180}', NULL, '2026-01-12 18:53:11'),
(1066, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":23,\"body_size\":59531}', NULL, '2026-01-12 18:53:12'),
(1067, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":10,\"body_size\":59531}', NULL, '2026-01-12 18:53:12'),
(1068, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":13,\"body_size\":457566}', NULL, '2026-01-12 18:53:12'),
(1069, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":457566}', NULL, '2026-01-12 18:53:12'),
(1070, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":20,\"body_size\":963}', NULL, '2026-01-12 18:53:16'),
(1071, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":32,\"body_size\":1696}', NULL, '2026-01-12 18:53:16'),
(1072, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":29,\"body_size\":862}', NULL, '2026-01-12 18:53:16'),
(1073, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":34,\"body_size\":1121}', NULL, '2026-01-12 18:53:16'),
(1074, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":27,\"body_size\":1304}', NULL, '2026-01-12 18:53:16'),
(1075, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":44,\"body_size\":769}', NULL, '2026-01-12 18:53:16'),
(1076, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":33,\"body_size\":963}', NULL, '2026-01-12 18:53:16'),
(1077, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":66,\"body_size\":968}', NULL, '2026-01-12 18:53:16'),
(1078, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":32,\"body_size\":866}', NULL, '2026-01-12 18:53:16'),
(1079, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":40,\"body_size\":1696}', NULL, '2026-01-12 18:53:16'),
(1080, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:53:16'),
(1081, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":9,\"body_size\":769}', NULL, '2026-01-12 18:53:16'),
(1082, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":21,\"body_size\":1121}', NULL, '2026-01-12 18:53:16'),
(1083, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":8,\"body_size\":968}', NULL, '2026-01-12 18:53:16'),
(1084, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":18,\"body_size\":963}', NULL, '2026-01-12 18:53:21'),
(1085, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":11,\"body_size\":866}', NULL, '2026-01-12 18:53:21'),
(1086, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1121}', NULL, '2026-01-12 18:53:21'),
(1087, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":26,\"body_size\":1696}', NULL, '2026-01-12 18:53:21'),
(1088, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":28,\"body_size\":769}', NULL, '2026-01-12 18:53:21'),
(1089, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1304}', NULL, '2026-01-12 18:53:21'),
(1090, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":38,\"body_size\":969}', NULL, '2026-01-12 18:53:21'),
(1091, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1696}', NULL, '2026-01-12 18:53:21'),
(1092, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":19,\"body_size\":963}', NULL, '2026-01-12 18:53:21'),
(1093, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1121}', NULL, '2026-01-12 18:53:21'),
(1094, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":12,\"body_size\":866}', NULL, '2026-01-12 18:53:21'),
(1095, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:53:21'),
(1096, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":22,\"body_size\":769}', NULL, '2026-01-12 18:53:21'),
(1097, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":13,\"body_size\":969}', NULL, '2026-01-12 18:53:21'),
(1098, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":4,\"body_size\":866}', NULL, '2026-01-12 18:55:01'),
(1099, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":10,\"body_size\":963}', NULL, '2026-01-12 18:55:01'),
(1100, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1121}', NULL, '2026-01-12 18:55:01'),
(1101, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1696}', NULL, '2026-01-12 18:55:01'),
(1102, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":17,\"body_size\":769}', NULL, '2026-01-12 18:55:01'),
(1103, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-12 18:55:01'),
(1104, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":18,\"body_size\":970}', NULL, '2026-01-12 18:55:01'),
(1105, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":8,\"body_size\":963}', NULL, '2026-01-12 18:55:10'),
(1106, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1696}', NULL, '2026-01-12 18:55:10'),
(1107, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-12 18:55:10'),
(1108, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":12,\"body_size\":769}', NULL, '2026-01-12 18:55:10'),
(1109, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-12 18:55:10'),
(1110, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1121}', NULL, '2026-01-12 18:55:10'),
(1111, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":15,\"body_size\":970}', NULL, '2026-01-12 18:55:10'),
(1112, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":8,\"body_size\":963}', NULL, '2026-01-12 18:55:44'),
(1113, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-12 18:55:44'),
(1114, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1121}', NULL, '2026-01-12 18:55:44'),
(1115, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":10,\"body_size\":769}', NULL, '2026-01-12 18:55:44'),
(1116, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":10,\"body_size\":970}', NULL, '2026-01-12 18:55:44'),
(1117, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1696}', NULL, '2026-01-12 18:55:44'),
(1118, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":4,\"body_size\":963}', NULL, '2026-01-12 18:55:44'),
(1119, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1696}', NULL, '2026-01-12 18:55:44'),
(1120, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1121}', NULL, '2026-01-12 18:55:44'),
(1121, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":3,\"body_size\":769}', NULL, '2026-01-12 18:55:44'),
(1122, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:55:44'),
(1123, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":5,\"body_size\":866}', NULL, '2026-01-12 18:55:44'),
(1124, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":12,\"body_size\":866}', NULL, '2026-01-12 18:55:44'),
(1125, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":14,\"body_size\":970}', NULL, '2026-01-12 18:55:44'),
(1126, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":3,\"body_size\":963}', NULL, '2026-01-12 18:55:45'),
(1127, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1304}', NULL, '2026-01-12 18:55:45'),
(1128, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1121}', NULL, '2026-01-12 18:55:45'),
(1129, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":14,\"body_size\":970}', NULL, '2026-01-12 18:55:45'),
(1130, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1696}', NULL, '2026-01-12 18:55:45'),
(1131, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":21,\"body_size\":769}', NULL, '2026-01-12 18:55:45'),
(1132, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":8,\"body_size\":963}', NULL, '2026-01-12 18:55:45'),
(1133, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":10,\"body_size\":866}', NULL, '2026-01-12 18:55:45'),
(1134, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1121}', NULL, '2026-01-12 18:55:45'),
(1135, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1696}', NULL, '2026-01-12 18:55:45'),
(1136, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":2,\"body_size\":866}', NULL, '2026-01-12 18:55:45'),
(1137, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":8,\"body_size\":769}', NULL, '2026-01-12 18:55:45'),
(1138, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 18:55:45'),
(1139, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":11,\"body_size\":970}', NULL, '2026-01-12 18:55:45'),
(1140, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1304}', NULL, '2026-01-12 18:55:46'),
(1141, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":9,\"body_size\":963}', NULL, '2026-01-12 18:55:46'),
(1142, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1121}', NULL, '2026-01-12 18:55:46'),
(1143, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1696}', NULL, '2026-01-12 18:55:46'),
(1144, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":13,\"body_size\":769}', NULL, '2026-01-12 18:55:46'),
(1145, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":4,\"body_size\":866}', NULL, '2026-01-12 18:55:46'),
(1146, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":3,\"body_size\":963}', NULL, '2026-01-12 18:55:46'),
(1147, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1121}', NULL, '2026-01-12 18:55:46'),
(1148, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1304}', NULL, '2026-01-12 18:55:46'),
(1149, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":25,\"body_size\":970}', NULL, '2026-01-12 18:55:46'),
(1150, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1696}', NULL, '2026-01-12 18:55:46'),
(1151, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":13,\"body_size\":769}', NULL, '2026-01-12 18:55:46'),
(1152, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":3,\"body_size\":866}', NULL, '2026-01-12 18:55:46'),
(1153, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":13,\"body_size\":970}', NULL, '2026-01-12 18:55:46'),
(1154, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":2,\"body_size\":963}', NULL, '2026-01-12 18:56:23'),
(1155, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1696}', NULL, '2026-01-12 18:56:23'),
(1156, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1121}', NULL, '2026-01-12 18:56:23'),
(1157, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":4,\"body_size\":769}', NULL, '2026-01-12 18:56:23'),
(1158, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":3,\"body_size\":963}', NULL, '2026-01-12 18:56:23'),
(1159, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1121}', NULL, '2026-01-12 18:56:23'),
(1160, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1696}', NULL, '2026-01-12 18:56:23'),
(1161, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":8,\"body_size\":769}', NULL, '2026-01-12 18:56:23'),
(1162, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":6,\"body_size\":866}', NULL, '2026-01-12 18:56:23'),
(1163, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":14,\"body_size\":970}', NULL, '2026-01-12 18:56:23'),
(1164, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1304}', NULL, '2026-01-12 18:56:23'),
(1165, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":4,\"body_size\":866}', NULL, '2026-01-12 18:56:23'),
(1166, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":6,\"body_size\":970}', NULL, '2026-01-12 18:56:23'),
(1167, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1304}', NULL, '2026-01-12 18:56:24'),
(1168, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":4,\"body_size\":963}', NULL, '2026-01-12 18:58:24'),
(1169, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1696}', NULL, '2026-01-12 18:58:24'),
(1170, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-12 18:58:24'),
(1171, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1121}', NULL, '2026-01-12 18:58:24'),
(1172, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":10,\"body_size\":866}', NULL, '2026-01-12 18:58:24'),
(1173, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":14,\"body_size\":769}', NULL, '2026-01-12 18:58:24'),
(1174, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":14,\"body_size\":970}', NULL, '2026-01-12 18:58:24'),
(1175, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-12 19:01:00'),
(1176, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-12 19:01:00');
INSERT INTO `audit_logs` (`id`, `event_type`, `user_id`, `user_role`, `ip_address`, `user_agent`, `resource`, `action`, `result`, `details`, `session_id`, `created_at`) VALUES
(1177, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":3,\"body_size\":963}', NULL, '2026-01-12 19:01:01'),
(1178, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1121}', NULL, '2026-01-12 19:01:01'),
(1179, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":2,\"body_size\":963}', NULL, '2026-01-12 19:01:01'),
(1180, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1696}', NULL, '2026-01-12 19:01:01'),
(1181, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":8,\"body_size\":769}', NULL, '2026-01-12 19:01:01'),
(1182, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":8,\"body_size\":970}', NULL, '2026-01-12 19:01:01'),
(1183, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1121}', NULL, '2026-01-12 19:01:01'),
(1184, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1696}', NULL, '2026-01-12 19:01:01'),
(1185, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":4,\"body_size\":769}', NULL, '2026-01-12 19:01:01'),
(1186, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":4,\"body_size\":970}', NULL, '2026-01-12 19:01:01'),
(1187, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":4,\"body_size\":866}', NULL, '2026-01-12 19:01:01'),
(1188, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-12 19:01:01'),
(1189, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":6,\"body_size\":866}', NULL, '2026-01-12 19:01:01'),
(1190, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-12 19:01:01'),
(1191, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-12 19:01:06'),
(1192, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1121}', NULL, '2026-01-12 19:01:06'),
(1193, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":13,\"body_size\":769}', NULL, '2026-01-12 19:01:06'),
(1194, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1696}', NULL, '2026-01-12 19:01:06'),
(1195, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":19,\"body_size\":969}', NULL, '2026-01-12 19:01:06'),
(1196, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":14,\"body_size\":769}', NULL, '2026-01-12 19:01:06'),
(1197, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1304}', NULL, '2026-01-12 19:01:06'),
(1198, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1121}', NULL, '2026-01-12 19:01:06'),
(1199, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":8,\"body_size\":963}', NULL, '2026-01-12 19:01:06'),
(1200, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1696}', NULL, '2026-01-12 19:01:06'),
(1201, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":24,\"body_size\":963}', NULL, '2026-01-12 19:01:06'),
(1202, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1304}', NULL, '2026-01-12 19:01:06'),
(1203, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-12 19:01:06'),
(1204, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":11,\"body_size\":970}', NULL, '2026-01-12 19:01:06'),
(1205, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":10,\"body_size\":963}', NULL, '2026-01-12 19:02:58'),
(1206, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1121}', NULL, '2026-01-12 19:02:58'),
(1207, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":7,\"body_size\":866}', NULL, '2026-01-12 19:02:58'),
(1208, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1696}', NULL, '2026-01-12 19:02:58'),
(1209, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":10,\"body_size\":769}', NULL, '2026-01-12 19:02:58'),
(1210, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1304}', NULL, '2026-01-12 19:02:58'),
(1211, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":22,\"body_size\":969}', NULL, '2026-01-12 19:02:58'),
(1212, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":11,\"body_size\":963}', NULL, '2026-01-12 19:02:58'),
(1213, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":16,\"body_size\":1696}', NULL, '2026-01-12 19:02:58'),
(1214, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":14,\"body_size\":769}', NULL, '2026-01-12 19:02:58'),
(1215, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":10,\"body_size\":866}', NULL, '2026-01-12 19:02:58'),
(1216, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":21,\"body_size\":1121}', NULL, '2026-01-12 19:02:58'),
(1217, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-12 19:02:58'),
(1218, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":19,\"body_size\":969}', NULL, '2026-01-12 19:02:58'),
(1219, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":32,\"body_size\":963}', NULL, '2026-01-12 19:03:08'),
(1220, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":50,\"body_size\":1121}', NULL, '2026-01-12 19:03:08'),
(1221, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":49,\"body_size\":866}', NULL, '2026-01-12 19:03:08'),
(1222, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":25,\"body_size\":1304}', NULL, '2026-01-12 19:03:08'),
(1223, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":90,\"body_size\":1696}', NULL, '2026-01-12 19:03:08'),
(1224, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":89,\"body_size\":769}', NULL, '2026-01-12 19:03:08'),
(1225, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":93,\"body_size\":969}', NULL, '2026-01-12 19:03:08'),
(1226, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":40,\"body_size\":963}', NULL, '2026-01-12 19:04:32'),
(1227, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":36,\"body_size\":866}', NULL, '2026-01-12 19:04:32'),
(1228, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":52,\"body_size\":1121}', NULL, '2026-01-12 19:04:32'),
(1229, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":80,\"body_size\":1696}', NULL, '2026-01-12 19:04:32'),
(1230, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":82,\"body_size\":769}', NULL, '2026-01-12 19:04:32'),
(1231, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":62,\"body_size\":1304}', NULL, '2026-01-12 19:04:32'),
(1232, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":103,\"body_size\":970}', NULL, '2026-01-12 19:04:32'),
(1233, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":7,\"body_size\":963}', NULL, '2026-01-12 19:04:32'),
(1234, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1121}', NULL, '2026-01-12 19:04:32'),
(1235, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":16,\"body_size\":1696}', NULL, '2026-01-12 19:04:32'),
(1236, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":15,\"body_size\":769}', NULL, '2026-01-12 19:04:32'),
(1237, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1304}', NULL, '2026-01-12 19:04:32'),
(1238, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-12 19:04:32'),
(1239, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":20,\"body_size\":969}', NULL, '2026-01-12 19:04:32'),
(1240, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1121}', NULL, '2026-01-12 19:04:33'),
(1241, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":5,\"body_size\":866}', NULL, '2026-01-12 19:04:33'),
(1242, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":12,\"body_size\":769}', NULL, '2026-01-12 19:04:33'),
(1243, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":20,\"body_size\":963}', NULL, '2026-01-12 19:04:33'),
(1244, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1696}', NULL, '2026-01-12 19:04:33'),
(1245, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":14,\"body_size\":968}', NULL, '2026-01-12 19:04:33'),
(1246, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":4,\"body_size\":180}', NULL, '2026-01-12 19:04:51'),
(1247, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-12 19:04:51'),
(1248, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":2,\"body_size\":963}', NULL, '2026-01-12 19:04:52'),
(1249, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1696}', NULL, '2026-01-12 19:04:52'),
(1250, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":4,\"body_size\":769}', NULL, '2026-01-12 19:04:52'),
(1251, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1121}', NULL, '2026-01-12 19:04:52'),
(1252, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":10,\"body_size\":865}', NULL, '2026-01-12 19:04:52'),
(1253, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1696}', NULL, '2026-01-12 19:04:52'),
(1254, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1121}', NULL, '2026-01-12 19:04:52'),
(1255, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":11,\"body_size\":769}', NULL, '2026-01-12 19:04:52'),
(1256, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":19,\"body_size\":969}', NULL, '2026-01-12 19:04:52'),
(1257, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1304}', NULL, '2026-01-12 19:04:52'),
(1258, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":4,\"body_size\":866}', NULL, '2026-01-12 19:04:52'),
(1259, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":7,\"body_size\":963}', NULL, '2026-01-12 19:04:52'),
(1260, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":12,\"body_size\":968}', NULL, '2026-01-12 19:04:52'),
(1261, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1304}', NULL, '2026-01-12 19:04:52'),
(1262, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":7,\"body_size\":963}', NULL, '2026-01-12 19:04:54'),
(1263, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1696}', NULL, '2026-01-12 19:04:54'),
(1264, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1121}', NULL, '2026-01-12 19:04:54'),
(1265, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":5,\"body_size\":769}', NULL, '2026-01-12 19:04:54'),
(1266, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":5,\"body_size\":866}', NULL, '2026-01-12 19:04:54'),
(1267, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":10,\"body_size\":969}', NULL, '2026-01-12 19:04:54'),
(1268, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":4,\"body_size\":963}', NULL, '2026-01-12 19:04:55'),
(1269, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1121}', NULL, '2026-01-12 19:04:55'),
(1270, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":22,\"body_size\":1696}', NULL, '2026-01-12 19:04:55'),
(1271, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":18,\"body_size\":769}', NULL, '2026-01-12 19:04:55'),
(1272, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":15,\"body_size\":866}', NULL, '2026-01-12 19:04:55'),
(1273, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":19,\"body_size\":969}', NULL, '2026-01-12 19:04:55'),
(1274, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":6,\"body_size\":963}', NULL, '2026-01-12 19:04:59'),
(1275, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":18,\"body_size\":866}', NULL, '2026-01-12 19:04:59'),
(1276, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1121}', NULL, '2026-01-12 19:04:59'),
(1277, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":18,\"body_size\":769}', NULL, '2026-01-12 19:04:59'),
(1278, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":22,\"body_size\":969}', NULL, '2026-01-12 19:04:59'),
(1279, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1696}', NULL, '2026-01-12 19:04:59'),
(1280, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1121}', NULL, '2026-01-12 19:05:00'),
(1281, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-12 19:05:00'),
(1282, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1696}', NULL, '2026-01-12 19:05:00'),
(1283, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":16,\"body_size\":769}', NULL, '2026-01-12 19:05:00'),
(1284, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":22,\"body_size\":963}', NULL, '2026-01-12 19:05:00'),
(1285, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":5,\"body_size\":969}', NULL, '2026-01-12 19:05:00'),
(1286, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":4,\"body_size\":963}', NULL, '2026-01-12 19:05:01'),
(1287, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":3,\"body_size\":769}', NULL, '2026-01-12 19:05:01'),
(1288, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1696}', NULL, '2026-01-12 19:05:01'),
(1289, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1121}', NULL, '2026-01-12 19:05:01'),
(1290, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":13,\"body_size\":866}', NULL, '2026-01-12 19:05:01'),
(1291, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":20,\"body_size\":969}', NULL, '2026-01-12 19:05:01'),
(1292, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":11,\"body_size\":963}', NULL, '2026-01-12 19:05:03'),
(1293, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1121}', NULL, '2026-01-12 19:05:03'),
(1294, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":9,\"body_size\":866}', NULL, '2026-01-12 19:05:03'),
(1295, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":16,\"body_size\":1696}', NULL, '2026-01-12 19:05:03'),
(1296, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":15,\"body_size\":769}', NULL, '2026-01-12 19:05:03'),
(1297, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":16,\"body_size\":969}', NULL, '2026-01-12 19:05:03'),
(1298, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":8,\"body_size\":963}', NULL, '2026-01-12 19:05:04'),
(1299, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1121}', NULL, '2026-01-12 19:05:04'),
(1300, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":4,\"body_size\":866}', NULL, '2026-01-12 19:05:04'),
(1301, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":8,\"body_size\":769}', NULL, '2026-01-12 19:05:04'),
(1302, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":8,\"body_size\":969}', NULL, '2026-01-12 19:05:04'),
(1303, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1696}', NULL, '2026-01-12 19:05:04'),
(1304, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":4,\"body_size\":963}', NULL, '2026-01-12 19:05:06'),
(1305, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1696}', NULL, '2026-01-12 19:05:06'),
(1306, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1121}', NULL, '2026-01-12 19:05:06'),
(1307, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":10,\"body_size\":866}', NULL, '2026-01-12 19:05:06'),
(1308, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":16,\"body_size\":769}', NULL, '2026-01-12 19:05:06');
INSERT INTO `audit_logs` (`id`, `event_type`, `user_id`, `user_role`, `ip_address`, `user_agent`, `resource`, `action`, `result`, `details`, `session_id`, `created_at`) VALUES
(1309, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":16,\"body_size\":969}', NULL, '2026-01-12 19:05:06'),
(1310, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":11,\"body_size\":963}', NULL, '2026-01-12 19:05:12'),
(1311, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1121}', NULL, '2026-01-12 19:05:12'),
(1312, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":19,\"body_size\":1696}', NULL, '2026-01-12 19:05:12'),
(1313, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":14,\"body_size\":866}', NULL, '2026-01-12 19:05:12'),
(1314, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":19,\"body_size\":970}', NULL, '2026-01-12 19:05:12'),
(1315, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":21,\"body_size\":769}', NULL, '2026-01-12 19:05:12'),
(1316, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":3,\"body_size\":963}', NULL, '2026-01-12 19:05:13'),
(1317, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1121}', NULL, '2026-01-12 19:05:13'),
(1318, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":7,\"body_size\":866}', NULL, '2026-01-12 19:05:13'),
(1319, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1696}', NULL, '2026-01-12 19:05:13'),
(1320, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":13,\"body_size\":769}', NULL, '2026-01-12 19:05:14'),
(1321, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":14,\"body_size\":970}', NULL, '2026-01-12 19:05:14'),
(1322, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":15,\"body_size\":963}', NULL, '2026-01-12 19:05:52'),
(1323, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1121}', NULL, '2026-01-12 19:05:52'),
(1324, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":20,\"body_size\":1696}', NULL, '2026-01-12 19:05:52'),
(1325, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":15,\"body_size\":866}', NULL, '2026-01-12 19:05:52'),
(1326, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":19,\"body_size\":769}', NULL, '2026-01-12 19:05:52'),
(1327, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":23,\"body_size\":970}', NULL, '2026-01-12 19:05:52'),
(1328, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":2,\"body_size\":963}', NULL, '2026-01-12 19:05:52'),
(1329, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1121}', NULL, '2026-01-12 19:05:52'),
(1330, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":11,\"body_size\":769}', NULL, '2026-01-12 19:05:52'),
(1331, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1696}', NULL, '2026-01-12 19:05:52'),
(1332, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":15,\"body_size\":866}', NULL, '2026-01-12 19:05:52'),
(1333, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":14,\"body_size\":970}', NULL, '2026-01-12 19:05:52'),
(1334, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":1,\"body_size\":180}', NULL, '2026-01-12 19:06:09'),
(1335, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":4,\"body_size\":180}', NULL, '2026-01-12 19:06:09'),
(1336, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":4,\"body_size\":963}', NULL, '2026-01-12 19:06:09'),
(1337, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":8,\"body_size\":1696}', NULL, '2026-01-12 19:06:09'),
(1338, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1121}', NULL, '2026-01-12 19:06:09'),
(1339, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":7,\"body_size\":963}', NULL, '2026-01-12 19:06:09'),
(1340, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":19,\"body_size\":769}', NULL, '2026-01-12 19:06:09'),
(1341, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1696}', NULL, '2026-01-12 19:06:09'),
(1342, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":3,\"body_size\":866}', NULL, '2026-01-12 19:06:09'),
(1343, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 19:06:10'),
(1344, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1121}', NULL, '2026-01-12 19:06:10'),
(1345, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":18,\"body_size\":970}', NULL, '2026-01-12 19:06:10'),
(1346, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":15,\"body_size\":769}', NULL, '2026-01-12 19:06:10'),
(1347, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-12 19:06:10'),
(1348, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1304}', NULL, '2026-01-12 19:06:10'),
(1349, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":6,\"body_size\":969}', NULL, '2026-01-12 19:06:10'),
(1350, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":4,\"body_size\":180}', NULL, '2026-01-12 19:10:45'),
(1351, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":3,\"body_size\":180}', NULL, '2026-01-12 19:10:45'),
(1352, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":6,\"body_size\":963}', NULL, '2026-01-12 19:10:46'),
(1353, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":12,\"body_size\":1696}', NULL, '2026-01-12 19:10:46'),
(1354, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":7,\"body_size\":1121}', NULL, '2026-01-12 19:10:46'),
(1355, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1304}', NULL, '2026-01-12 19:10:46'),
(1356, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":8,\"body_size\":970}', NULL, '2026-01-12 19:10:46'),
(1357, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":11,\"body_size\":769}', NULL, '2026-01-12 19:10:46'),
(1358, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":9,\"body_size\":963}', NULL, '2026-01-12 19:10:46'),
(1359, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1696}', NULL, '2026-01-12 19:10:46'),
(1360, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":9,\"body_size\":1121}', NULL, '2026-01-12 19:10:46'),
(1361, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":9,\"body_size\":769}', NULL, '2026-01-12 19:10:46'),
(1362, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":8,\"body_size\":866}', NULL, '2026-01-12 19:10:46'),
(1363, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":7,\"body_size\":866}', NULL, '2026-01-12 19:10:46'),
(1364, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":2,\"body_size\":1304}', NULL, '2026-01-12 19:10:46'),
(1365, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":5,\"body_size\":970}', NULL, '2026-01-12 19:10:46'),
(1366, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":4,\"body_size\":963}', NULL, '2026-01-12 19:10:48'),
(1367, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1696}', NULL, '2026-01-12 19:10:48'),
(1368, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1121}', NULL, '2026-01-12 19:10:48'),
(1369, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":5,\"body_size\":866}', NULL, '2026-01-12 19:10:48'),
(1370, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":11,\"body_size\":769}', NULL, '2026-01-12 19:10:48'),
(1371, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":12,\"body_size\":970}', NULL, '2026-01-12 19:10:48'),
(1372, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":3,\"body_size\":963}', NULL, '2026-01-12 19:10:50'),
(1373, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1121}', NULL, '2026-01-12 19:10:50'),
(1374, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":10,\"body_size\":866}', NULL, '2026-01-12 19:10:50'),
(1375, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":21,\"body_size\":1696}', NULL, '2026-01-12 19:10:50'),
(1376, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":17,\"body_size\":769}', NULL, '2026-01-12 19:10:50'),
(1377, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":16,\"body_size\":970}', NULL, '2026-01-12 19:10:50'),
(1378, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":12,\"body_size\":963}', NULL, '2026-01-12 19:10:54'),
(1379, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1121}', NULL, '2026-01-12 19:10:54'),
(1380, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":11,\"body_size\":866}', NULL, '2026-01-12 19:10:54'),
(1381, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":16,\"body_size\":1696}', NULL, '2026-01-12 19:10:54'),
(1382, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":14,\"body_size\":769}', NULL, '2026-01-12 19:10:54'),
(1383, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":13,\"body_size\":970}', NULL, '2026-01-12 19:10:54'),
(1384, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":15,\"body_size\":963}', NULL, '2026-01-12 19:10:55'),
(1385, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":14,\"body_size\":1121}', NULL, '2026-01-12 19:10:55'),
(1386, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1696}', NULL, '2026-01-12 19:10:55'),
(1387, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":13,\"body_size\":866}', NULL, '2026-01-12 19:10:55'),
(1388, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":17,\"body_size\":769}', NULL, '2026-01-12 19:10:55'),
(1389, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":3,\"body_size\":970}', NULL, '2026-01-12 19:10:55'),
(1390, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":13,\"body_size\":180}', NULL, '2026-01-12 19:11:37'),
(1391, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/auth/me', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/auth/me\",\"status_code\":200,\"duration_ms\":4,\"body_size\":180}', NULL, '2026-01-12 19:11:37'),
(1392, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":25,\"body_size\":59531}', NULL, '2026-01-12 19:11:38'),
(1393, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":59531}', NULL, '2026-01-12 19:11:38'),
(1394, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":17,\"body_size\":457566}', NULL, '2026-01-12 19:11:38'),
(1395, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":11,\"body_size\":457566}', NULL, '2026-01-12 19:11:38'),
(1396, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":21,\"body_size\":963}', NULL, '2026-01-12 19:11:45'),
(1397, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":25,\"body_size\":1696}', NULL, '2026-01-12 19:11:45'),
(1398, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":26,\"body_size\":1121}', NULL, '2026-01-12 19:11:45'),
(1399, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":23,\"body_size\":963}', NULL, '2026-01-12 19:11:45'),
(1400, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":33,\"body_size\":769}', NULL, '2026-01-12 19:11:45'),
(1401, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":22,\"body_size\":1121}', NULL, '2026-01-12 19:11:45'),
(1402, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":38,\"body_size\":1696}', NULL, '2026-01-12 19:11:45'),
(1403, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":50,\"body_size\":970}', NULL, '2026-01-12 19:11:45'),
(1404, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":28,\"body_size\":1304}', NULL, '2026-01-12 19:11:45'),
(1405, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":38,\"body_size\":866}', NULL, '2026-01-12 19:11:45'),
(1406, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":26,\"body_size\":866}', NULL, '2026-01-12 19:11:45'),
(1407, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":39,\"body_size\":769}', NULL, '2026-01-12 19:11:45'),
(1408, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":3,\"body_size\":1304}', NULL, '2026-01-12 19:11:45'),
(1409, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":36,\"body_size\":969}', NULL, '2026-01-12 19:11:45'),
(1410, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":18,\"body_size\":59531}', NULL, '2026-01-12 19:13:15'),
(1411, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":6,\"body_size\":59531}', NULL, '2026-01-12 19:13:15'),
(1412, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":10,\"body_size\":457566}', NULL, '2026-01-12 19:13:15'),
(1413, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/blotter\",\"status_code\":200,\"duration_ms\":27,\"body_size\":457566}', NULL, '2026-01-12 19:13:15'),
(1414, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":3,\"body_size\":963}', NULL, '2026-01-12 19:13:24'),
(1415, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":18,\"body_size\":1696}', NULL, '2026-01-12 19:13:24'),
(1416, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":17,\"body_size\":963}', NULL, '2026-01-12 19:13:24'),
(1417, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":11,\"body_size\":863}', NULL, '2026-01-12 19:13:24'),
(1418, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":17,\"body_size\":1121}', NULL, '2026-01-12 19:13:24'),
(1419, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":24,\"body_size\":970}', NULL, '2026-01-12 19:13:24'),
(1420, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":24,\"body_size\":769}', NULL, '2026-01-12 19:13:24'),
(1421, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-12 19:13:24'),
(1422, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":13,\"body_size\":769}', NULL, '2026-01-12 19:13:24'),
(1423, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":10,\"body_size\":866}', NULL, '2026-01-12 19:13:24'),
(1424, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":13,\"body_size\":1121}', NULL, '2026-01-12 19:13:24'),
(1425, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":20,\"body_size\":1696}', NULL, '2026-01-12 19:13:24'),
(1426, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":21,\"body_size\":970}', NULL, '2026-01-12 19:13:24'),
(1427, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":6,\"body_size\":1304}', NULL, '2026-01-12 19:13:24'),
(1428, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":10,\"body_size\":1121}', NULL, '2026-01-12 19:13:55'),
(1429, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":11,\"body_size\":1696}', NULL, '2026-01-12 19:13:55'),
(1430, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":17,\"body_size\":963}', NULL, '2026-01-12 19:13:55'),
(1431, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":17,\"body_size\":970}', NULL, '2026-01-12 19:13:55'),
(1432, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":18,\"body_size\":769}', NULL, '2026-01-12 19:13:55'),
(1433, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":2,\"body_size\":866}', NULL, '2026-01-12 19:13:55'),
(1434, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":12,\"body_size\":54}', NULL, '2026-01-12 19:18:24'),
(1435, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":25,\"body_size\":59531}', NULL, '2026-01-12 19:18:24'),
(1436, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificate-requests/admin/all?limit=100', 'GET', 'FAILED', '{\"method\":\"GET\",\"url\":\"/api/certificate-requests/admin/all?limit=100\",\"status_code\":500,\"duration_ms\":6,\"body_size\":54}', NULL, '2026-01-12 19:18:24'),
(1437, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":30,\"body_size\":52271}', NULL, '2026-01-12 19:18:24'),
(1438, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/certificates\",\"status_code\":200,\"duration_ms\":9,\"body_size\":59531}', NULL, '2026-01-12 19:18:24'),
(1439, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?limit=1000', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?limit=1000\",\"status_code\":200,\"duration_ms\":5,\"body_size\":52271}', NULL, '2026-01-12 19:18:24'),
(1440, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":4,\"body_size\":2}', NULL, '2026-01-12 19:18:27'),
(1441, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":5,\"body_size\":2}', NULL, '2026-01-12 19:18:27'),
(1442, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/applications', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/applications\",\"status_code\":200,\"duration_ms\":1,\"body_size\":2}', NULL, '2026-01-12 19:18:27');
INSERT INTO `audit_logs` (`id`, `event_type`, `user_id`, `user_role`, `ip_address`, `user_agent`, `resource`, `action`, `result`, `details`, `session_id`, `created_at`) VALUES
(1443, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/secretary/resident-documents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/secretary/resident-documents\",\"status_code\":200,\"duration_ms\":2,\"body_size\":2}', NULL, '2026-01-12 19:18:27'),
(1444, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":10,\"body_size\":49310}', NULL, '2026-01-12 19:18:28'),
(1445, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":4,\"body_size\":49310}', NULL, '2026-01-12 19:18:28'),
(1446, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":2,\"body_size\":49310}', NULL, '2026-01-12 19:18:28'),
(1447, 'API_REQUEST', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/residents?', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/residents?\",\"status_code\":200,\"duration_ms\":3,\"body_size\":49310}', NULL, '2026-01-12 19:18:28'),
(1448, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":15,\"body_size\":1121}', NULL, '2026-01-12 19:28:39'),
(1449, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":18,\"body_size\":963}', NULL, '2026-01-12 19:28:39'),
(1450, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":13,\"body_size\":971}', NULL, '2026-01-12 19:28:39'),
(1451, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":25,\"body_size\":1696}', NULL, '2026-01-12 19:28:39'),
(1452, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":22,\"body_size\":769}', NULL, '2026-01-12 19:28:39'),
(1453, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-12 19:28:39'),
(1454, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":7,\"body_size\":866}', NULL, '2026-01-12 19:28:39'),
(1455, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/certificates', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/certificates\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1121}', NULL, '2026-01-12 19:28:39'),
(1456, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/residents', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/residents\",\"status_code\":200,\"duration_ms\":9,\"body_size\":769}', NULL, '2026-01-12 19:28:39'),
(1457, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/users', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/users\",\"status_code\":200,\"duration_ms\":3,\"body_size\":963}', NULL, '2026-01-12 19:28:39'),
(1458, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/blotter', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/blotter\",\"status_code\":200,\"duration_ms\":5,\"body_size\":1696}', NULL, '2026-01-12 19:28:39'),
(1459, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/detailed/users?page=1&limit=50&dateFrom=&dateTo=&status=&role=&search=\",\"status_code\":200,\"duration_ms\":4,\"body_size\":1304}', NULL, '2026-01-12 19:28:39'),
(1460, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/security', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/security\",\"status_code\":200,\"duration_ms\":4,\"body_size\":866}', NULL, '2026-01-12 19:28:39'),
(1461, 'ADMIN_ACTION', '5', '1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/125.0.0.0', '/api/admin/reports/system', 'GET', 'SUCCESS', '{\"method\":\"GET\",\"url\":\"/api/admin/reports/system\",\"status_code\":200,\"duration_ms\":11,\"body_size\":971}', NULL, '2026-01-12 19:28:39');

-- --------------------------------------------------------

--
-- Table structure for table `blotter`
--

CREATE TABLE `blotter` (
  `Case_Number` varchar(50) NOT NULL,
  `Complainant_Details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`Complainant_Details`)),
  `Respondent_Details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`Respondent_Details`)),
  `Incident_Type` enum('Physical Injury','Unjust Vexation','Grave Threats','Alarming and Scandal','Theft (Petty)','Malicious Mischief','Estafa (Swindling)','Trespassing','Collection of Sum of Money','Ejectment','Boundary Dispute','Family Dispute','Curfew Violation','Noise Barrage','Illegal Parking','Waste Management','Stray Animals') NOT NULL,
  `Narrative` text NOT NULL,
  `DateTime_Incident` datetime NOT NULL,
  `Location_Sitio` enum('Batia Proper','Northville 5','St. Martha','AFP/PNP') NOT NULL,
  `status` enum('Pending','Active','Resolved','Dismissed') DEFAULT 'Pending' COMMENT 'Case status for ClearPass validation',
  `Hearing_Schedule` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `respondent_id` varchar(50) DEFAULT NULL COMMENT 'Resident ID for ClearPass validation',
  `hearing_count` int(11) DEFAULT 0 COMMENT 'Number of hearings scheduled',
  `missed_hearings` int(11) DEFAULT 0 COMMENT 'Number of missed hearings (ClearPass blocks at 3+)',
  `complainant_resident_id` varchar(50) DEFAULT NULL COMMENT 'Resident ID of complainant',
  `respondent_resident_id` varchar(50) DEFAULT NULL COMMENT 'Resident ID of respondent',
  `resolution_notes` text DEFAULT NULL COMMENT 'Resolution and outcome notes'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `blotter`
--


-- --------------------------------------------------------

--
-- Table structure for table `blotter_participants`
--

CREATE TABLE `blotter_participants` (
  `id` int(11) NOT NULL,
  `blotter_id` varchar(50) NOT NULL,
  `resident_id` varchar(50) NOT NULL,
  `participation_type` enum('Complainant','Respondent','Victim','Witness') NOT NULL,
  `status` enum('Active','Settled','Cleared') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `blotter_participants`
--


-- --------------------------------------------------------

--
-- Table structure for table `certificates_log`
--

CREATE TABLE `certificates_log` (
  `control_no` varchar(50) NOT NULL,
  `resident_id` varchar(50) NOT NULL,
  `certificate_type` varchar(100) NOT NULL,
  `purpose` text DEFAULT NULL,
  `date_issued` date NOT NULL,
  `signatory_captain` varchar(255) DEFAULT NULL,
  `signatory_secretary` varchar(255) DEFAULT NULL,
  `qr_validation_string` varchar(255) DEFAULT NULL,
  `status` enum('Paid','Released','Cancelled') DEFAULT 'Paid',
  `fee_amount` decimal(8,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `certificates_log`
--


-- --------------------------------------------------------

--
-- Table structure for table `certificate_types`
--

CREATE TABLE `certificate_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `fee` decimal(8,2) DEFAULT 0.00,
  `validity_days` int(11) DEFAULT 365,
  `description` text DEFAULT NULL,
  `purpose` text DEFAULT NULL,
  `when_needed` text DEFAULT NULL,
  `required_data` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `code` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `certificate_types`
--

INSERT INTO `certificate_types` (`id`, `name`, `fee`, `validity_days`, `description`, `purpose`, `when_needed`, `required_data`, `is_active`, `created_at`, `updated_at`, `code`) VALUES
(4, 'Barangay Clearance', 50.00, 365, 'Proves you have no issue or file complaint', 'Certify a person is law-abiding resident', 'Apply for other clearances / job', '[\"Valid ID\", \"Proof of Residency\", \"CEDULA\", \"Purpose\", \"Payment\", \"Personal Information (Name, Date of Birth, Address, Contact Number, Length of stay in barangay)\", \"Signature of Barangay Captain and Secretary\"]', 1, '2025-11-30 22:39:20', '2026-01-11 19:54:41', 'barangay_clearance'),
(10, 'Certificate of Bonafide Residency', 40.00, 180, 'Certifies authentic residency', 'Proof of length of residency', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(11, 'Bonafide Certificate', 40.00, 180, 'Certifies authentic residency and character', 'Proof of residency and good character', NULL, NULL, 1, '2025-12-12 22:24:12', '2026-01-11 19:54:41', 'bonafide_certificate'),
(12, 'Building Permit', 150.00, 365, 'Permit for construction activities', 'Authorize building construction', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(13, 'Building Clearance', 150.00, 365, 'Clearance for building construction', 'Verify compliance for building permits', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(14, 'Closed Business Certification', 30.00, 180, 'Certification of business closure', 'Confirm business has been properly closed', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(15, 'Certificate of Cohabitation', 80.00, 90, 'Certification of living together as partners', 'Legal recognition of cohabitation', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(16, 'Excavation Permit', 120.00, 90, 'Permit for excavation work', 'Authorize digging and ground work', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(17, 'Fencing Permit', 100.00, 365, 'Permit for fence installation', 'Authorize perimeter fencing', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(18, 'Certificate of Good Moral Character', 45.00, 365, 'Certification of good character', 'Verify good reputation and conduct', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(19, 'Certificate of Indigency', 15.00, 30, 'Certifies indigency status', 'Proof of poverty for aid applications', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(20, 'Late Registration Form', 25.00, 365, 'Form for late registration', 'Process delayed registrations', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(21, 'OJT Certification', 20.00, 180, 'On-the-Job Training certification', 'Formalize training completion', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(22, 'Customized Certificate of Indigency', 25.00, 30, 'Custom indigency certification', 'Specialized poverty verification', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(23, 'Certificate of Good Moral Character (Alternate Version)', 45.00, 365, 'Alternative good character certification', 'Alternative character verification format', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(24, 'Low-Income Housing Certification', 10.00, 365, 'Certification for low-income housing', 'Qualify for housing assistance programs', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(25, 'Medico-Legal Certificate', 200.00, 90, 'Medical-legal documentation', 'Formal medical and legal record', NULL, NULL, 1, '2025-12-12 22:24:12', '2025-12-12 22:24:12', NULL),
(26, 'Indigency Certificate', 0.00, 180, 'Certifies that the resident belongs to an indigent family.', 'Medical assistance, Scholarship, Legal assistance', 'Applying for government aid', '[\"Valid ID\",\"Purpose\"]', 1, '2026-01-11 19:54:41', '2026-01-11 19:54:41', 'indigency_certificate');

-- --------------------------------------------------------

--
-- Table structure for table `clearance_requests`
--

CREATE TABLE `clearance_requests` (
  `id` int(11) NOT NULL,
  `request_id` varchar(50) NOT NULL,
  `resident_id` varchar(50) NOT NULL,
  `purpose` varchar(500) NOT NULL,
  `status` enum('pending','approved','rejected','issued') DEFAULT 'pending',
  `requested_by` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `issued_by` int(11) DEFAULT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_at` timestamp NULL DEFAULT NULL,
  `issued_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `community_programs`
--

CREATE TABLE `community_programs` (
  `id` int(11) NOT NULL,
  `program_name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `program_date` date NOT NULL,
  `sitio_id` int(11) DEFAULT NULL,
  `target_beneficiaries` text DEFAULT NULL,
  `status` enum('Planned','Ongoing','Completed','Cancelled') DEFAULT 'Planned',
  `organizer` varchar(100) DEFAULT NULL,
  `budget_allocated` decimal(10,2) DEFAULT 0.00,
  `actual_cost` decimal(10,2) DEFAULT 0.00,
  `participants_count` int(11) DEFAULT 0,
  `success_rating` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `community_programs`
--

INSERT INTO `community_programs` (`id`, `program_name`, `description`, `program_date`, `sitio_id`, `target_beneficiaries`, `status`, `organizer`, `budget_allocated`, `actual_cost`, `participants_count`, `success_rating`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'Christmas Relief Distribution 2024', 'Distribution of food packs and gifts for low-income families during Christmas season', '2024-12-20', 1, '[\"Low-income families\", \"Single parents\", \"Senior citizens\", \"PWDs\"]', 'Planned', 'Barangay Captain', 50000.00, 0.00, 0, NULL, 'Annual Christmas program for vulnerable residents', '2025-11-30 22:39:20', '2025-11-30 22:39:20'),
(2, 'Senior Citizens Health Seminar', 'Health awareness and checkup session for senior citizens', '2024-11-30', 1, '[\"Senior citizens\", \"Elderly residents\"]', 'Completed', 'Health Center', 8000.00, 7500.00, 45, 5, 'Well-attended seminar with free blood pressure monitoring', '2025-11-30 22:39:20', '2025-11-30 22:39:20'),
(3, 'Environmental Clean-up Drive', 'Community clean-up of streets, drainage, and public spaces', '2024-11-25', 1, '[\"All residents\", \"Community volunteers\"]', 'Completed', 'Environmental Committee', 5000.00, 4800.00, 78, 4, 'Collected 15 sacks of garbage, improved drainage systems', '2025-11-30 22:39:20', '2025-11-30 22:39:20'),
(5, 'LIGA', 'ENLISTMENT', '2025-12-15', 1, '[]', 'Planned', 'Symon Ignacio', 20000.00, 0.00, 0, NULL, '', '2025-12-11 18:37:50', '2025-12-11 18:37:50');

-- --------------------------------------------------------

--
-- Table structure for table `document_requests`
--

CREATE TABLE `document_requests` (
  `request_id` varchar(50) NOT NULL,
  `resident_id` varchar(50) NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
  `request_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`request_data`)),
  `resident_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`resident_data`)),
  `approval_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`approval_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` varchar(50) DEFAULT NULL,
  `valid_until` timestamp NULL DEFAULT NULL,
  `qr_code` text DEFAULT NULL,
  `control_number` varchar(100) DEFAULT NULL,
  `attachment_front_id` longblob DEFAULT NULL,
  `attachment_back_id` longblob DEFAULT NULL,
  `attachment_front_mime` varchar(100) DEFAULT NULL,
  `attachment_back_mime` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_templates`
--

CREATE TABLE `document_templates` (
  `id` int(10) UNSIGNED NOT NULL,
  `template_name` varchar(100) NOT NULL,
  `document_type` varchar(50) NOT NULL,
  `certificate_type_id` int(11) DEFAULT NULL,
  `template_content` text NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `updated_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `file_data` mediumblob DEFAULT NULL,
  `file_encoding` varchar(50) DEFAULT NULL COMMENT 'File encoding type (e.g., buffer)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_templates`
--

INSERT INTO `document_templates` (`id`, `template_name`, `document_type`, `certificate_type_id`, `template_content`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`, `file_data`, `file_encoding`) VALUES
(1, 'Default Barangay Clearance', 'barangay_clearance', NULL, '{\"title\":\"BARANGAY CLEARANCE\",\"header_text\":\"TO WHOM IT MAY CONCERN:\",\"main_content\":\"This is to certify that the person whose name, signature, thumb marks and other personal data appearing hereon, has requested for a Barangay Clearance from this Office and the results are listed below.\",\"footer_text\":\"This is to further certify that {resident_name} is a bona fide resident of this Barangay. {resident_name} is known to me with a good moral character, law abiding citizen in the community. {resident_name} has no criminal record found in our Barangay Records.\",\"signature_text\":\"Given this {issued_date}\",\"validity_text\":\"Valid until: {valid_until}\",\"location\":\"Barangay Batia, Bocaue, Bulacan\",\"show_qr_code\":true,\"show_control_number\":true,\"font_family\":\"Times-Roman\",\"font_size\":12}', 0, 1, NULL, '2025-12-11 19:34:27', '2025-12-11 19:34:27', 0x255044462d312e370a25818181810a0a362030206f626a0a3c3c0a2f46696c746572202f466c6174654465636f64650a2f4c656e677468203131320a3e3e0a73747265616d0a789c2be4720ae1325000c1a2742e7d8fd49cb2d492cce4445d73034b0b130b03730b4b0523138590342e10e9c36508566aa8606a0044060a21b95c36a62666166696e6c6460650d2d0c8c0dcc4ccd4dcd8dc04c2327331373073363304b1ed1442b2b842b4b85c43b802b9000cb91b550a656e6473747265616d0a656e646f626a0a0a372030206f626a0a3c3c0a2f46696c746572202f466c6174654465636f64650a2f54797065202f4f626a53746d0a2f4e20350a2f46697273742032360a2f4c656e677468203336380a3e3e0a73747265616d0a789cd552df4bc330107ecf5f718ffae092a63fd2ca186c6bab20e2d80445f1a16bc3a88c44da54e67fef5ddb39f6203edb702477f7dde54beff340808420001f540c0184be841094a7603a65fcf1eb43035f153bdd327e57572dbc2246c01ade185fdace38f0d86cc64ed865e18abdddb1a1083c021f11abc6565da91b98e6599e0ba18410518016092153dc9768099a441f7332c6339a0a46c398f285f0e798cb078bd45043f91e1b8ef519ee888d08930ed8201efc9f7be9ae6ce821ffe293cc18bfb7555a380d17e9b51432121e7e491885e1cb25fe8e4617cefedfc7f5fc6b6b7e7de1d99c69bc34e4469306fa29f3b56e6dd7943876c2e5163374b8d5fb4fedeab2b852228991a78a13d4d8280cfefcb07dd7650f25373bb89b8d230e438062f7baaa8b853da0fa04ae300927328638f026d809953837c63ad266af4ae3901379d1a8d433e2448bf14db775bd4b418ff145d1ea9ef0892d5231a5ad6ab303fe549bb969eb63803a7e03a2aec73a0a656e6473747265616d0a656e646f626a0a0a382030206f626a0a3c3c0a2f53697a6520390a2f526f6f742032203020520a2f496e666f2033203020520a2f46696c746572202f466c6174654465636f64650a2f54797065202f585265660a2f4c656e6774682034310a2f57205b203120322032205d0a2f496e646578205b20302039205d0a3e3e0a73747265616d0a789c15c4b11100200c03b1b7c31d2dfb37ccc354095621a0db6c484a4e95963820decf170661c703b30a656e6473747265616d0a656e646f626a0a0a7374617274787265660a3637310a2525454f46, 'application/pdf'),
(2, 'Default Indigency Certificate', 'indigency_certificate', 19, '{\"title\":\"CERTIFICATE OF INDIGENCY\",\"header_text\":\"TO WHOM IT MAY CONCERN,\",\"main_content\":\"This is to certify that {resident_name}, {age} years old, with address at {address}, is belonging to the Indigent Family in our Barangay.\",\"additional_content\":\"As per records of this office, subject person has NO DEROGATORY RECORDS.\",\"footer_text\":\"This certification is issued upon the request of the above person to be used for his/her {purpose}, {specific_purpose}.\",\"signature_text\":\"Given this {issued_date} at Batia, Municipality of Bocaue, Bulacan.\",\"validity_text\":\"Valid until: {valid_until}\",\"location\":\"Batia, Municipality of Bocaue, Bulacan\",\"show_qr_code\":false,\"show_control_number\":true,\"font_family\":\"Times-Roman\",\"font_size\":12}', 1, 1, NULL, '2025-12-11 19:34:27', '2025-12-11 19:34:27', NULL, NULL),
(3, 'updated barangay clearance', 'barangay_clearance', 4, '{\"title\":\"updated barangay clearance\",\"header_text\":\"Uploaded Template\",\"main_content\":\"This template was uploaded as a file.\",\"footer_text\":\"Generated from uploaded file\",\"location\":\"Barangay Batia, Bocaue, Bulacan\",\"show_qr_code\":true,\"show_control_number\":true,\"font_family\":\"Times-Roman\",\"font_size\":12}', 1, 4, 4, '2025-12-11 20:03:53', '2025-12-11 20:03:53', 0x255044462d312e370a25818181810a0a362030206f626a0a3c3c0a2f46696c746572202f466c6174654465636f64650a2f4c656e677468203131320a3e3e0a73747265616d0a789c2be4720ae1325000c1a2742e7d8fd49cb2d492cce4445d73034b0b130b03730b4b0523138590342e10e9c36508566aa8606a0044060a21b95c36a62666166696e6c6460650d2d0c8c0dcc4ccd4dcd8dc04c2327331373073363304b1ed1442b2b842b4b85c43b802b9000cb91b550a656e6473747265616d0a656e646f626a0a0a372030206f626a0a3c3c0a2f46696c746572202f466c6174654465636f64650a2f54797065202f4f626a53746d0a2f4e20350a2f46697273742032360a2f4c656e677468203336380a3e3e0a73747265616d0a789cd552df4bc330107ecf5f718ffae092a63fd2ca186c6bab20e2d80445f1a16bc3a88c44da54e67fef5ddb39f6203edb702477f7dde54beff340808420001f540c0184be841094a7603a65fcf1eb43035f153bdd327e57572dbc2246c01ade185fdace38f0d86cc64ed865e18abdddb1a1083c021f11abc6565da91b98e6599e0ba18410518016092153dc9768099a441f7332c6339a0a46c398f285f0e798cb078bd45043f91e1b8ef519ee888d08930ed8201efc9f7be9ae6ce821ffe293cc18bfb7555a380d17e9b51432121e7e491885e1cb25fe8e4617cefedfc7f5fc6b6b7e7de1d99c69bc34e4469306fa29f3b56e6dd7943876c2e5163374b8d5fb4fedeab2b852228991a78a13d4d8280cfefcb07dd7650f25373bb89b8d230e438062f7baaa8b853da0fa04ae300927328638f026d809953837c63ad266af4ae3901379d1a8d433e2448bf14db775bd4b418ff145d1ea9ef0892d5231a5ad6ab303fe549bb969eb63803a7e03a2aec73a0a656e6473747265616d0a656e646f626a0a0a382030206f626a0a3c3c0a2f53697a6520390a2f526f6f742032203020520a2f496e666f2033203020520a2f46696c746572202f466c6174654465636f64650a2f54797065202f585265660a2f4c656e6774682034310a2f57205b203120322032205d0a2f496e646578205b20302039205d0a3e3e0a73747265616d0a789c15c4b11100200c03b1b7c31d2dfb37ccc354095621a0db6c484a4e95963820decf170661c703b30a656e6473747265616d0a656e646f626a0a0a7374617274787265660a3637310a2525454f46, 'application/pdf');

-- --------------------------------------------------------

--
-- Table structure for table `households`
--

CREATE TABLE `households` (
  `Household_ID` varchar(50) NOT NULL,
  `Household_Number` varchar(20) NOT NULL,
  `Sitio_ID` int(11) NOT NULL,
  `Street_Address` text NOT NULL,
  `Coordinates` point DEFAULT NULL,
  `Head_Resident_ID` varchar(50) DEFAULT NULL,
  `Total_Members` int(11) DEFAULT 1,
  `Household_Type` enum('Nuclear','Extended','Single','Boarding') DEFAULT 'Nuclear',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `households`
--


-- --------------------------------------------------------

--
-- Table structure for table `knex_migrations`
--

CREATE TABLE `knex_migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `batch` int(11) DEFAULT NULL,
  `migration_time` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `knex_migrations`
--

INSERT INTO `knex_migrations` (`id`, `name`, `batch`, `migration_time`) VALUES
(1, '20250101000000_initial_schema.js', 1, '2026-01-09 16:23:38'),
(2, '20250102000000_account_hierarchy.js', 1, '2026-01-09 16:23:52'),
(3, '20250103000000_document_requests.js', 1, '2026-01-09 16:23:52'),
(4, '20250104000000_resident_signup_requests.js', 1, '2026-01-09 16:23:52'),
(5, '20250105000000_document_templates.js', 1, '2026-01-09 16:23:52'),
(6, '20250106000000_add_file_blob_storage.js', 1, '2026-01-09 16:24:17'),
(7, '20250106000000_create_audit_logs.js', 2, '2026-01-09 16:24:30'),
(8, '20250106000000_create_audit_logs.js', 1, '2026-01-09 16:24:46'),
(9, '20250107000000_add_notifications.js', 1, '2026-01-09 16:24:46'),
(10, '20250115000000_rename_mobile_to_email_residents.js', 1, '2026-01-09 16:24:46'),
(11, '20250117000000_add_login_attempts_table.js', 1, '2026-01-09 16:24:46'),
(12, '20250118000000_add_blob_storage_verification.js', 1, '2026-01-09 16:24:46'),
(13, '20250120000000_alter_file_data_to_mediumblob.js', 1, '2026-01-09 16:24:46'),
(14, '20250121000000_standardize_themis_roles.js', 1, '2026-01-09 16:25:19'),
(15, '20250122000000_themis_clearpass_schema.js', 3, '2026-01-10 18:49:31'),
(16, '20250123000000_fix_residents_mobile_column.js', 4, '2026-01-10 18:50:00'),
(17, '20250124000000_add_community_programs.js', 5, '2026-01-10 18:51:44'),
(18, '20250124000000_add_document_verification_tables.js', 5, '2026-01-10 18:51:44'),
(19, '20250124000001_add_email_to_residents.js', 5, '2026-01-10 18:51:44'),
(20, '20251230000000_add_verification_file_column.js', 6, '2026-01-10 18:53:00'),
(21, '20251230_add_auth_to_residents.js', 6, '2026-01-10 18:53:00'),
(22, '20251231000000_census_first_auth_schema.js', 6, '2026-01-10 18:53:00'),
(23, '20260105000000_add_announcements_table.js', 6, '2026-01-10 18:53:00'),
(24, '20260111120000_remediation_fixes.js', 6, '2026-01-10 18:53:00'),
(25, '20260111123000_add_validation_audit_columns.js', 7, '2026-01-10 21:34:17'),
(26, '20260111124500_fix_seeded_user_roles.js', 8, '2026-01-10 22:59:57'),
(27, '20260111130000_repair_roles_and_document_requests.js', 9, '2026-01-10 23:02:40'),
(28, '20260111133000_create_system_assets.js', 10, '2026-01-10 23:17:46'),
(29, '20260111160000_add_document_encryption_and_retention.js', 11, '2026-01-11 00:26:38'),
(30, '20260111170000_create_mfa_otp_challenges.js', 12, '2026-01-11 00:27:01'),
(31, '20260111174000_enforce_role_integrity.js', 12, '2026-01-11 00:27:01'),
(32, '20260111183000_drop_legacy_audit_log.js', 13, '2026-01-11 00:39:36'),
(33, '20260111184000_create_system_settings.js', 14, '2026-01-11 00:40:25'),
(34, '20260126000000_add_certificate_codes.js', 15, '2026-01-11 19:54:41'),
(35, '20250113000000_add_file_columns_to_templates.js', 16, '2026-01-11 22:00:39'),
(36, '20260126000000_add_attachments_to_requests.js', 17, '2026-01-11 22:28:09');

-- --------------------------------------------------------

--
-- Table structure for table `knex_migrations_lock`
--

CREATE TABLE `knex_migrations_lock` (
  `index` int(10) UNSIGNED NOT NULL,
  `is_locked` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `knex_migrations_lock`
--

INSERT INTO `knex_migrations_lock` (`index`, `is_locked`) VALUES
(1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int(10) UNSIGNED NOT NULL,
  `username` varchar(50) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `success` tinyint(1) DEFAULT 1,
  `reason` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mfa_otp_challenges`
--

CREATE TABLE `mfa_otp_challenges` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `attempts_remaining` int(10) UNSIGNED NOT NULL DEFAULT 5,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `consumed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'info',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `priority` varchar(20) NOT NULL DEFAULT 'normal',
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_system` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--


-- --------------------------------------------------------

--
-- Table structure for table `program_participants`
--

CREATE TABLE `program_participants` (
  `id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL,
  `resident_id` varchar(50) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `attendance_status` enum('Registered','Attended','Absent') DEFAULT 'Registered',
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `residents`
--

CREATE TABLE `residents` (
  `Resident_ID` varchar(50) NOT NULL,
  `Household_ID` varchar(50) NOT NULL,
  `Relation_to_Head` enum('Head','Spouse','Child','Relative','Boarder') DEFAULT 'Head',
  `First_Name` varchar(100) NOT NULL,
  `Middle_Name` varchar(100) DEFAULT NULL,
  `Last_Name` varchar(100) NOT NULL,
  `Suffix` varchar(10) DEFAULT NULL,
  `Birthdate` date NOT NULL,
  `Gender` enum('Male','Female','Other') NOT NULL,
  `Civil_Status` enum('Single','Married','Widowed','Separated','Divorced') DEFAULT 'Single',
  `Occupation` varchar(100) DEFAULT NULL,
  `Income_Estimate` decimal(10,2) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `Voter_Status` enum('Registered','Non-Registered') DEFAULT 'Non-Registered',
  `Date_Arrival` date DEFAULT NULL,
  `Residency_Status` enum('Active','Deceased','Transferred Out','Transient') DEFAULT 'Active',
  `Profile_Photo_URL` varchar(255) DEFAULT NULL,
  `QR_Hash_String` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `Mobile_Number` varchar(20) DEFAULT NULL COMMENT 'Critical for SMS OTP',
  `username` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `account_status` enum('Unregistered','Unverified','Verified') DEFAULT 'Unregistered',
  `verification_file` text DEFAULT NULL,
  `resident_status` enum('Good Standing','Derogatory Record','Watchlist') DEFAULT 'Good Standing'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `residents`
--


-- --------------------------------------------------------

--
-- Table structure for table `resident_applications`
--

CREATE TABLE `resident_applications` (
  `application_id` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `suffix` varchar(10) DEFAULT NULL,
  `birthdate` date NOT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `civil_status` enum('Single','Married','Widowed','Separated','Divorced') DEFAULT 'Single',
  `occupation` varchar(100) DEFAULT NULL,
  `income_estimate` decimal(10,2) DEFAULT 0.00,
  `email` varchar(255) NOT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `street_address` varchar(255) NOT NULL,
  `sitio` varchar(100) NOT NULL,
  `voter_status` enum('Registered','Non-Registered') DEFAULT 'Non-Registered',
  `is_4ps` tinyint(1) DEFAULT 0,
  `is_pwd` tinyint(1) DEFAULT 0,
  `is_solo_parent` tinyint(1) DEFAULT 0,
  `is_out_of_school_youth` tinyint(1) DEFAULT 0,
  `disability_type` varchar(100) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `temp_password` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `rejection_reason` text DEFAULT NULL,
  `reviewed_by` int(10) UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `resident_documents`
--

CREATE TABLE `resident_documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `resident_id` varchar(50) NOT NULL,
  `document_type` varchar(50) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `verification_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `verification_notes` text DEFAULT NULL,
  `verified_by` varchar(50) DEFAULT NULL,
  `verified_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `encryption_alg` varchar(32) DEFAULT NULL,
  `encryption_version` int(10) UNSIGNED DEFAULT NULL,
  `encryption_iv` varchar(64) DEFAULT NULL,
  `encryption_tag` varchar(64) DEFAULT NULL,
  `disposed_at` timestamp NULL DEFAULT NULL,
  `disposed_by` varchar(50) DEFAULT NULL,
  `disposal_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `resident_signup_requests`
--

CREATE TABLE `resident_signup_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `request_id` varchar(100) NOT NULL,
  `resident_id` varchar(50) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `proof_of_residency_path` varchar(255) DEFAULT NULL,
  `proof_type` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reviewed_by` int(10) UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `resident_verification_requests`
--

CREATE TABLE `resident_verification_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `request_id` varchar(100) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `proof_of_residency_path` varchar(255) DEFAULT NULL,
  `file_data` blob DEFAULT NULL COMMENT 'Binary file data stored in database',
  `file_encoding` varchar(50) DEFAULT NULL COMMENT 'File encoding type (e.g., buffer)',
  `original_filename` varchar(255) DEFAULT NULL COMMENT 'Original uploaded filename',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'File MIME type (e.g., image/jpeg)',
  `file_size` int(11) DEFAULT NULL COMMENT 'File size in bytes',
  `proof_type` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected') DEFAULT 'draft',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` int(10) UNSIGNED DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `hierarchy_level` int(11) NOT NULL DEFAULT 0,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `role_name`, `description`, `hierarchy_level`, `permissions`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'IT Admin', 'IT Admin role', 1, NULL, 1, '2026-01-09 17:28:07', '2026-01-09 17:28:07'),
(2, 'Captain', 'Barangay Captain with approval authority', 2, '[\"approve_documents\",\"manage_staff\",\"view_reports\"]', 1, '2025-12-12 21:48:23', '2026-01-02 15:33:34'),
(3, 'Secretary', 'Barangay Secretary with document management', 5, '[\"manage_documents\",\"approve_certificates\",\"manage_residents\"]', 1, '2025-12-12 21:48:23', '2026-01-02 15:33:34'),
(4, 'Clerk', 'Administrative Clerk for certificate processing', 4, '[\"process_certificates\",\"view_residents\",\"manage_documents\"]', 1, '2025-12-12 21:48:23', '2026-01-02 15:33:34'),
(6, 'Blotter Officer', 'Blotter Officer role', 6, NULL, 1, '2026-01-02 19:27:43', '2026-01-02 19:27:43'),
(12, 'Resident', 'Resident role', 12, NULL, 1, '2026-01-02 19:27:43', '2026-01-02 19:27:43');

-- --------------------------------------------------------

--
-- Table structure for table `sitios`
--

CREATE TABLE `sitios` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sitios`
--

INSERT INTO `sitios` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'Batia Proper', 'Main residential and commercial area, population ~2,500', '2025-11-30 22:39:20'),
(2, 'Northville 5', 'Northern residential district with growing community', '2025-11-30 22:39:20'),
(3, 'St. Martha', 'Eastern residential area with mixed housing types', '2025-11-30 22:39:20'),
(4, 'AFP/PNP', 'Military and police housing compound', '2025-11-30 22:39:20');

-- --------------------------------------------------------

--
-- Table structure for table `system_assets`
--

CREATE TABLE `system_assets` (
  `id` int(10) UNSIGNED NOT NULL,
  `asset_type` enum('seal','letterhead') NOT NULL,
  `file_path` varchar(512) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `uploaded_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(10) UNSIGNED NOT NULL,
  `barangay_name` varchar(200) DEFAULT NULL,
  `captain_name` varchar(200) DEFAULT NULL,
  `secretary_name` varchar(200) DEFAULT NULL,
  `contact_number` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `office_hours` varchar(100) DEFAULT NULL,
  `certificate_fee` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `full_name` varchar(200) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `parent_user_id` int(11) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `phone_verified` tinyint(1) DEFAULT 0,
  `firebase_uid` varchar(255) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `resident_id` varchar(50) DEFAULT NULL,
  `pin_code` varchar(6) DEFAULT NULL COMMENT '6-digit PIN for ResidentID + PIN authentication',
  `position` varchar(100) DEFAULT NULL,
  `pin` varchar(6) DEFAULT NULL COMMENT '6-digit PIN for ResidentID + PIN authentication',
  `role` int(11) NOT NULL DEFAULT 12
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `email`, `full_name`, `contact_number`, `is_active`, `last_login`, `created_at`, `updated_at`, `parent_user_id`, `email_verified`, `phone_verified`, `firebase_uid`, `verified_at`, `resident_id`, `pin_code`, `position`, `pin`, `role`) VALUES
(5, 'superadmin', '$2a$10$r2zaRyzf/1OmLkUqQvEkZukm2fA4.EVRB3brdwhrMNh1kHKOvcCAC', 'superadmin@barangay.gov.ph', 'System Administrator', NULL, 1, '2025-12-29 15:41:50', '2025-12-12 19:13:55', '2026-01-10 19:47:17', NULL, 0, 0, NULL, NULL, NULL, NULL, 'System Administrator', NULL, 1),
(6, 'captain', '$2a$10$r2zaRyzf/1OmLkUqQvEkZukm2fA4.EVRB3brdwhrMNh1kHKOvcCAC', 'captain@barangay.gov.ph', 'Barangay Captain', NULL, 1, '2025-12-18 21:14:08', '2025-12-12 19:13:55', '2026-01-10 22:59:57', NULL, 0, 0, NULL, NULL, NULL, NULL, 'Barangay Captain', NULL, 2),
(7, 'secretary', '$2a$10$r2zaRyzf/1OmLkUqQvEkZukm2fA4.EVRB3brdwhrMNh1kHKOvcCAC', 'secretary@barangay.gov.ph', 'Barangay Secretary', NULL, 1, '2025-12-19 01:24:34', '2025-12-12 19:13:55', '2026-01-10 22:59:57', NULL, 0, 0, NULL, NULL, NULL, NULL, 'Barangay Secretary', NULL, 3),
(8, 'clerk', '$2a$10$r2zaRyzf/1OmLkUqQvEkZukm2fA4.EVRB3brdwhrMNh1kHKOvcCAC', 'clerk@barangay.gov.ph', 'Administrative Clerk', NULL, 1, '2025-12-19 01:28:04', '2025-12-12 19:13:55', '2026-01-10 22:59:57', NULL, 0, 0, NULL, NULL, NULL, NULL, 'Administrative Clerk', NULL, 4),
(11, 'officer', '$2a$10$r2zaRyzf/1OmLkUqQvEkZukm2fA4.EVRB3brdwhrMNh1kHKOvcCAC', 'officer@barangay.gov.ph', 'Chief Tanod', NULL, 1, '2025-12-19 03:08:19', '2025-12-17 19:56:02', '2026-01-10 22:59:57', NULL, 0, 0, NULL, NULL, NULL, NULL, 'Chief Tanod', NULL, 6),
(12, 'resident', '$2a$10$r2zaRyzf/1OmLkUqQvEkZukm2fA4.EVRB3brdwhrMNh1kHKOvcCAC', 'resident@barangay.gov.ph', 'Juan Dela Cruz', NULL, 1, NULL, '2025-12-17 19:57:38', '2026-01-10 22:59:57', NULL, 0, 0, NULL, NULL, NULL, '123456', NULL, NULL, 12),
(13, 'Symonignacio1@gmail.com', '$2a$10$r2zaRyzf/1OmLkUqQvEkZukm2fA4.EVRB3brdwhrMNh1kHKOvcCAC', 'Symonignacio1@gmail.com', 'Symon Ignacio', '09625460372', 1, '2025-12-19 02:23:01', '2025-12-19 02:11:47', '2026-01-10 18:49:31', NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 4),
(14, 'analizeldelpos0519@gmail.com', '$2a$10$r2zaRyzf/1OmLkUqQvEkZukm2fA4.EVRB3brdwhrMNh1kHKOvcCAC', 'analizeldelpos0519@gmail.com', 'undefined undefined', '', 1, NULL, '2025-12-19 03:02:59', '2026-01-10 18:49:31', NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 4),
(20, 'testadmin_1768071589888', '$2a$10$FbVgokL8g0A.eJAtRUGPqeR8J5yBCbxHu4nueM9cTn9R/xp0GuohK', 'testadmin_1768071589888@example.com', 'Test Admin', NULL, 1, NULL, '2026-01-10 18:59:49', '2026-01-10 18:59:49', NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_notifications`
--

CREATE TABLE `user_notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_notifications`
--


-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(10) UNSIGNED NOT NULL,
  `owner_id` varchar(50) DEFAULT NULL COMMENT 'Resident ID of owner',
  `plate_number` varchar(20) NOT NULL,
  `make` varchar(50) DEFAULT NULL,
  `model` varchar(50) DEFAULT NULL,
  `color` varchar(30) DEFAULT NULL,
  `vehicle_type` enum('Motorcycle','Tricycle','Car','Van','Truck','Bicycle','Other') DEFAULT 'Other',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `visitors`
--

CREATE TABLE `visitors` (
  `id` int(10) UNSIGNED NOT NULL,
  `visitor_name` varchar(100) NOT NULL,
  `purpose` varchar(255) NOT NULL,
  `host_resident_id` varchar(50) DEFAULT NULL COMMENT 'Resident being visited',
  `time_in` timestamp NOT NULL DEFAULT current_timestamp(),
  `time_out` timestamp NULL DEFAULT NULL,
  `id_type_presented` varchar(50) DEFAULT NULL,
  `id_number` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vulnerabilities`
--

CREATE TABLE `vulnerabilities` (
  `Resident_ID` varchar(50) NOT NULL,
  `Is_4Ps` tinyint(1) DEFAULT 0,
  `Is_PWD` tinyint(1) DEFAULT 0,
  `Is_Senior` tinyint(1) DEFAULT 0,
  `Is_Solo_Parent` tinyint(1) DEFAULT 0,
  `Is_Out_of_School_Youth` tinyint(1) DEFAULT 0,
  `Disability_Type` varchar(100) DEFAULT NULL,
  `Vulnerability_Score` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `validation_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `validation_notes` text DEFAULT NULL,
  `validated_by` int(10) UNSIGNED DEFAULT NULL,
  `validated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vulnerabilities`
--


--
-- Indexes for dumped tables
--

--
-- Indexes for table `ai_analytics_reports`
--
ALTER TABLE `ai_analytics_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reports_type` (`report_type`),
  ADD KEY `idx_reports_date` (`date_range_start`,`date_range_end`),
  ADD KEY `idx_reports_user` (`generated_by`);

--
-- Indexes for table `ai_appointments`
--
ALTER TABLE `ai_appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appointments_resident` (`resident_id`),
  ADD KEY `idx_appointments_date` (`appointment_date`),
  ADD KEY `idx_appointments_type` (`appointment_type`),
  ADD KEY `idx_appointments_status` (`status`),
  ADD KEY `idx_appointments_session` (`chatbot_session_id`);

--
-- Indexes for table `ai_chatbot_conversations`
--
ALTER TABLE `ai_chatbot_conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_chatbot_session` (`session_id`),
  ADD KEY `idx_chatbot_user` (`user_id`),
  ADD KEY `idx_chatbot_resident` (`resident_id`),
  ADD KEY `idx_chatbot_intent` (`intent_detected`),
  ADD KEY `idx_chatbot_date` (`created_at`),
  ADD KEY `idx_conversations_recent` (`created_at`);

--
-- Indexes for table `ai_chatbot_faq`
--
ALTER TABLE `ai_chatbot_faq`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_faq_category` (`category`),
  ADD KEY `idx_faq_keywords` (`keywords`(255)),
  ADD KEY `idx_faq_priority` (`priority`),
  ADD KEY `idx_faq_active` (`is_active`);

--
-- Indexes for table `ai_ocr_cache`
--
ALTER TABLE `ai_ocr_cache`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `file_hash` (`file_hash`),
  ADD KEY `idx_ocr_hash` (`file_hash`),
  ADD KEY `idx_ocr_type` (`document_type`),
  ADD KEY `idx_ocr_status` (`processing_status`),
  ADD KEY `idx_ocr_accessed` (`last_accessed`);

--
-- Indexes for table `ai_ocr_field_mappings`
--
ALTER TABLE `ai_ocr_field_mappings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mappings_type` (`document_type`),
  ADD KEY `idx_mappings_field` (`field_name`),
  ADD KEY `idx_mappings_active` (`is_active`);

--
-- Indexes for table `ai_predictive_models`
--
ALTER TABLE `ai_predictive_models`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_models_name` (`model_name`),
  ADD KEY `idx_models_type` (`model_type`),
  ADD KEY `idx_models_active` (`is_active`);

--
-- Indexes for table `ai_system_logs`
--
ALTER TABLE `ai_system_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_logs_component` (`component`),
  ADD KEY `idx_logs_operation` (`operation`),
  ADD KEY `idx_logs_user` (`user_id`),
  ADD KEY `idx_logs_session` (`session_id`),
  ADD KEY `idx_logs_status` (`status`),
  ADD KEY `idx_logs_date` (`created_at`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_active_expires` (`is_active`,`expires_at`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `application_documents`
--
ALTER TABLE `application_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `application_documents_application_id_index` (`application_id`),
  ADD KEY `application_documents_document_type_index` (`document_type`),
  ADD KEY `application_documents_verification_status_index` (`verification_status`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_event_type_index` (`event_type`),
  ADD KEY `audit_logs_user_id_index` (`user_id`),
  ADD KEY `audit_logs_user_role_index` (`user_role`),
  ADD KEY `audit_logs_resource_index` (`resource`),
  ADD KEY `audit_logs_action_index` (`action`),
  ADD KEY `audit_logs_result_index` (`result`),
  ADD KEY `audit_logs_session_id_index` (`session_id`),
  ADD KEY `audit_logs_created_at_index` (`created_at`),
  ADD KEY `audit_logs_event_type_created_at_index` (`event_type`,`created_at`),
  ADD KEY `audit_logs_user_id_created_at_index` (`user_id`,`created_at`),
  ADD KEY `audit_logs_result_created_at_index` (`result`,`created_at`);

--
-- Indexes for table `blotter`
--
ALTER TABLE `blotter`
  ADD PRIMARY KEY (`Case_Number`),
  ADD KEY `idx_blotter_status` (`status`),
  ADD KEY `idx_blotter_date` (`DateTime_Incident`),
  ADD KEY `idx_blotter_sitio` (`Location_Sitio`),
  ADD KEY `idx_blotter_type` (`Incident_Type`),
  ADD KEY `blotter_respondent_id_foreign` (`respondent_id`),
  ADD KEY `idx_blotter_respondent` (`respondent_id`),
  ADD KEY `idx_blotter_created` (`created_at`);

--
-- Indexes for table `blotter_participants`
--
ALTER TABLE `blotter_participants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_blotter_id` (`blotter_id`),
  ADD KEY `idx_resident_id` (`resident_id`),
  ADD KEY `idx_participation_type` (`participation_type`);

--
-- Indexes for table `certificates_log`
--
ALTER TABLE `certificates_log`
  ADD PRIMARY KEY (`control_no`),
  ADD UNIQUE KEY `qr_validation_string` (`qr_validation_string`),
  ADD KEY `idx_certificates_resident` (`resident_id`),
  ADD KEY `idx_certificates_type` (`certificate_type`),
  ADD KEY `idx_certificates_qr` (`qr_validation_string`),
  ADD KEY `idx_certificates_date` (`date_issued`),
  ADD KEY `idx_certificates_status` (`status`);

--
-- Indexes for table `certificate_types`
--
ALTER TABLE `certificate_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `clearance_requests`
--
ALTER TABLE `clearance_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `request_id` (`request_id`),
  ADD KEY `idx_resident_status` (`resident_id`,`status`),
  ADD KEY `idx_requested_status` (`requested_by`,`status`),
  ADD KEY `idx_request_id` (`request_id`);

--
-- Indexes for table `community_programs`
--
ALTER TABLE `community_programs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_programs_date` (`program_date`),
  ADD KEY `idx_programs_sitio` (`sitio_id`),
  ADD KEY `idx_programs_status` (`status`);

--
-- Indexes for table `document_requests`
--
ALTER TABLE `document_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `idx_document_requests_resident` (`resident_id`),
  ADD KEY `idx_document_requests_type` (`document_type`),
  ADD KEY `idx_document_requests_status` (`status`),
  ADD KEY `idx_document_requests_created` (`created_at`),
  ADD KEY `idx_document_requests_control` (`control_number`);

--
-- Indexes for table `document_templates`
--
ALTER TABLE `document_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `document_templates_template_name_unique` (`template_name`),
  ADD UNIQUE KEY `uk_active_certificate_type_template` (`certificate_type_id`,`is_active`),
  ADD KEY `idx_templates_active_type` (`is_active`,`document_type`),
  ADD KEY `idx_document_templates_certificate_type_id` (`certificate_type_id`);

--
-- Indexes for table `households`
--
ALTER TABLE `households`
  ADD PRIMARY KEY (`Household_ID`),
  ADD UNIQUE KEY `Household_Number` (`Household_Number`),
  ADD KEY `idx_households_sitio` (`Sitio_ID`),
  ADD KEY `idx_households_head` (`Head_Resident_ID`);

--
-- Indexes for table `knex_migrations`
--
ALTER TABLE `knex_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `knex_migrations_lock`
--
ALTER TABLE `knex_migrations_lock`
  ADD PRIMARY KEY (`index`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_ip_address` (`ip_address`),
  ADD KEY `idx_success` (`success`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `mfa_otp_challenges`
--
ALTER TABLE `mfa_otp_challenges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mfa_otp_challenges_user_id_created_at_index` (`user_id`,`created_at`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type_priority` (`type`,`priority`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `program_participants`
--
ALTER TABLE `program_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participant` (`program_id`,`resident_id`),
  ADD KEY `idx_program` (`program_id`),
  ADD KEY `idx_resident` (`resident_id`);

--
-- Indexes for table `residents`
--
ALTER TABLE `residents`
  ADD PRIMARY KEY (`Resident_ID`),
  ADD UNIQUE KEY `QR_Hash_String` (`QR_Hash_String`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_residents_household` (`Household_ID`),
  ADD KEY `idx_residents_name` (`Last_Name`,`First_Name`),
  ADD KEY `idx_residents_mobile` (`Email`),
  ADD KEY `idx_residents_status` (`Residency_Status`),
  ADD KEY `idx_residents_qr` (`QR_Hash_String`),
  ADD KEY `idx_residents_birthdate` (`Birthdate`);

--
-- Indexes for table `resident_applications`
--
ALTER TABLE `resident_applications`
  ADD PRIMARY KEY (`application_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `resident_applications_reviewed_by_index` (`reviewed_by`),
  ADD KEY `resident_applications_reviewed_at_index` (`reviewed_at`);

--
-- Indexes for table `resident_documents`
--
ALTER TABLE `resident_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `resident_documents_resident_id_index` (`resident_id`),
  ADD KEY `resident_documents_document_type_index` (`document_type`),
  ADD KEY `resident_documents_verification_status_index` (`verification_status`);

--
-- Indexes for table `resident_signup_requests`
--
ALTER TABLE `resident_signup_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `request_id` (`request_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_resident_id` (`resident_id`),
  ADD KEY `idx_submitted_at` (`submitted_at`);

--
-- Indexes for table `resident_verification_requests`
--
ALTER TABLE `resident_verification_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `resident_verification_requests_request_id_unique` (`request_id`),
  ADD KEY `idx_user_status` (`user_id`,`status`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_request_id` (`request_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`),
  ADD KEY `hierarchy_level` (`hierarchy_level`);

--
-- Indexes for table `sitios`
--
ALTER TABLE `sitios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `system_assets`
--
ALTER TABLE `system_assets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `system_assets_asset_type_index` (`asset_type`),
  ADD KEY `system_assets_uploaded_by_index` (`uploaded_by`),
  ADD KEY `system_assets_created_at_index` (`created_at`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_users_active` (`is_active`),
  ADD KEY `parent_user_id` (`parent_user_id`),
  ADD KEY `idx_firebase_uid` (`firebase_uid`),
  ADD KEY `idx_resident_id` (`resident_id`),
  ADD KEY `users_role_resident_id_index` (`resident_id`),
  ADD KEY `users_pin_code_index` (`pin_code`),
  ADD KEY `idx_users_resident` (`resident_id`),
  ADD KEY `idx_users_role` (`role`);

--
-- Indexes for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_notification` (`user_id`,`notification_id`),
  ADD KEY `idx_user_read` (`user_id`,`is_read`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vehicles_plate_number_unique` (`plate_number`),
  ADD KEY `vehicles_owner_id_index` (`owner_id`),
  ADD KEY `vehicles_plate_number_index` (`plate_number`);

--
-- Indexes for table `visitors`
--
ALTER TABLE `visitors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `visitors_host_resident_id_foreign` (`host_resident_id`);

--
-- Indexes for table `vulnerabilities`
--
ALTER TABLE `vulnerabilities`
  ADD PRIMARY KEY (`Resident_ID`),
  ADD KEY `idx_vulnerabilities_score` (`Vulnerability_Score`),
  ADD KEY `idx_vulnerabilities_resident` (`Resident_ID`),
  ADD KEY `vulnerabilities_validation_status_index` (`validation_status`),
  ADD KEY `vulnerabilities_validated_by_index` (`validated_by`),
  ADD KEY `vulnerabilities_validated_at_index` (`validated_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ai_analytics_reports`
--
ALTER TABLE `ai_analytics_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_appointments`
--
ALTER TABLE `ai_appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_chatbot_conversations`
--
ALTER TABLE `ai_chatbot_conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=201;

--
-- AUTO_INCREMENT for table `ai_chatbot_faq`
--
ALTER TABLE `ai_chatbot_faq`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `ai_ocr_cache`
--
ALTER TABLE `ai_ocr_cache`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_ocr_field_mappings`
--
ALTER TABLE `ai_ocr_field_mappings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `ai_predictive_models`
--
ALTER TABLE `ai_predictive_models`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_system_logs`
--
ALTER TABLE `ai_system_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `application_documents`
--
ALTER TABLE `application_documents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1462;

--
-- AUTO_INCREMENT for table `blotter_participants`
--
ALTER TABLE `blotter_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `certificate_types`
--
ALTER TABLE `certificate_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `clearance_requests`
--
ALTER TABLE `clearance_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `community_programs`
--
ALTER TABLE `community_programs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `document_templates`
--
ALTER TABLE `document_templates`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `knex_migrations`
--
ALTER TABLE `knex_migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `knex_migrations_lock`
--
ALTER TABLE `knex_migrations_lock`
  MODIFY `index` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mfa_otp_challenges`
--
ALTER TABLE `mfa_otp_challenges`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `program_participants`
--
ALTER TABLE `program_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `resident_documents`
--
ALTER TABLE `resident_documents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `resident_signup_requests`
--
ALTER TABLE `resident_signup_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `resident_verification_requests`
--
ALTER TABLE `resident_verification_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `sitios`
--
ALTER TABLE `sitios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `system_assets`
--
ALTER TABLE `system_assets`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `user_notifications`
--
ALTER TABLE `user_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `visitors`
--
ALTER TABLE `visitors`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `application_documents`
--
ALTER TABLE `application_documents`
  ADD CONSTRAINT `application_documents_application_id_foreign` FOREIGN KEY (`application_id`) REFERENCES `resident_applications` (`application_id`) ON DELETE CASCADE;

--
-- Constraints for table `blotter`
--
ALTER TABLE `blotter`
  ADD CONSTRAINT `blotter_respondent_id_foreign` FOREIGN KEY (`respondent_id`) REFERENCES `residents` (`Resident_ID`) ON DELETE SET NULL;

--
-- Constraints for table `certificates_log`
--
ALTER TABLE `certificates_log`
  ADD CONSTRAINT `certificates_log_ibfk_1` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`Resident_ID`);

--
-- Constraints for table `community_programs`
--
ALTER TABLE `community_programs`
  ADD CONSTRAINT `community_programs_ibfk_1` FOREIGN KEY (`sitio_id`) REFERENCES `sitios` (`id`);

--
-- Constraints for table `document_requests`
--
ALTER TABLE `document_requests`
  ADD CONSTRAINT `document_requests_resident_id_foreign` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`Resident_ID`);

--
-- Constraints for table `document_templates`
--
ALTER TABLE `document_templates`
  ADD CONSTRAINT `fk_document_templates_certificate_type` FOREIGN KEY (`certificate_type_id`) REFERENCES `certificate_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `households`
--
ALTER TABLE `households`
  ADD CONSTRAINT `fk_households_head_resident` FOREIGN KEY (`Head_Resident_ID`) REFERENCES `residents` (`Resident_ID`),
  ADD CONSTRAINT `households_ibfk_1` FOREIGN KEY (`Sitio_ID`) REFERENCES `sitios` (`id`);

--
-- Constraints for table `program_participants`
--
ALTER TABLE `program_participants`
  ADD CONSTRAINT `program_participants_ibfk_1` FOREIGN KEY (`program_id`) REFERENCES `community_programs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `program_participants_ibfk_2` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`Resident_ID`) ON DELETE CASCADE;

--
-- Constraints for table `residents`
--
ALTER TABLE `residents`
  ADD CONSTRAINT `residents_ibfk_1` FOREIGN KEY (`Household_ID`) REFERENCES `households` (`Household_ID`);

--
-- Constraints for table `resident_documents`
--
ALTER TABLE `resident_documents`
  ADD CONSTRAINT `resident_documents_resident_id_foreign` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`Resident_ID`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_resident_id` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`Resident_ID`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `users_ibfk_parent_user_id` FOREIGN KEY (`parent_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `residents` (`Resident_ID`) ON DELETE SET NULL;

--
-- Constraints for table `visitors`
--
ALTER TABLE `visitors`
  ADD CONSTRAINT `visitors_host_resident_id_foreign` FOREIGN KEY (`host_resident_id`) REFERENCES `residents` (`Resident_ID`) ON DELETE SET NULL;

--
-- Constraints for table `vulnerabilities`
--
ALTER TABLE `vulnerabilities`
  ADD CONSTRAINT `vulnerabilities_ibfk_1` FOREIGN KEY (`Resident_ID`) REFERENCES `residents` (`Resident_ID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
SET FOREIGN_KEY_CHECKS=1;
