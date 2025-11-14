# Barangay Management System Database

## Overview
This database is designed for **Barangay Batia** based on comprehensive survey data collected from August-October 2024. The system supports a population of approximately **48,000 residents** across **4 sitios**.

## Database Features

### 🏠 **Resident Management**
- Complete resident profiles with demographics
- Household relationships and income tracking
- Special categories: Senior Citizens, PWD, 4P's beneficiaries, Single Parents
- Voter registration and CEDULA tracking

### 📋 **Certificate System**
- **8 Certificate Types**: Clearance, Residency, Indigency, Business, Good Moral, Low Income, Certification, Oath of Undertaking
- QR code integration for verification
- Online and walk-in request processing
- Automated blotter verification before issuance

### 🚨 **Blotter Management**
- Incident reporting and tracking
- Severity classification (minor, moderate, major, critical)
- Status tracking (active, resolved, dismissed, referred)
- Integration with certificate issuance (blocks certificates for active cases)

### 🏢 **Business Permits**
- Business registration and permit tracking
- Owner verification through resident database
- Renewal and status management

### 👥 **User Roles & Security**
- **Admin**: Full system access
- **Captain**: Approval authority, full reports access
- **Secretary**: Data management, certificate approval
- **Clerk**: Data entry, resident management
- **Blotter Officer**: Incident management
- **Issuance Officer**: Certificate processing
- **Resident**: Limited portal access

### 📊 **Analytics & Reporting**
- Population statistics by sitio
- Certificate issuance trends
- Blotter incident analysis
- Revenue tracking from fees
- Demographic breakdowns

## Database Structure

### Core Tables
- `users` - System authentication
- `residents` - Resident profiles and demographics
- `sitios` - Geographic divisions (4 sitios)
- `households` - Family groupings and relationships
- `certificate_types` - Available certificate types
- `certificates` - Issued certificates with QR codes
- `blotter_records` - Incident reports and cases
- `business_permits` - Business registrations

### Supporting Tables
- `qr_sessions` - One-time QR validation sessions
- `certificate_requests` - Online certificate requests
- `audit_logs` - System activity tracking
- `system_settings` - Configuration management

## Setup Instructions

### Prerequisites
- MySQL 5.7+ or MariaDB 10.3+
- Node.js 14+ (for setup script)
- XAMPP (recommended for local development)

### Installation Steps

1. **Start MySQL Server**
   ```bash
   # Start XAMPP MySQL service
   ```

2. **Install Dependencies**
   ```bash
   cd server
   npm install mysql2
   ```

3. **Run Database Setup**
   ```bash
   node database/setup_database.js
   ```

4. **Verify Installation**
   - Database: `barangay_batia`
   - Tables: 13 tables created
   - Sample data: Populated with realistic mock data

## Sample Data Overview

### Sitios (4 areas)
- **Batia Proper**: Central sitio
- **Northville 5**: Northern residential area  
- **St. Martha**: Eastern residential subdivision
- **AFP/PNP**: Military and police housing area

### Users (10 sample accounts)
- 6 Staff accounts (admin, captain, secretary, clerk, blotter_officer, issuance_officer)
- 4 Resident accounts with portal access

### Residents (10 sample profiles)
- Mixed demographics representing the 48,000 population
- Various occupations, income levels, and special categories
- Realistic addresses across all 4 sitios

### Certificates (8 issued samples)
- Different certificate types with QR codes
- Various purposes (employment, business, medical assistance)
- Proper approval workflow demonstrated

### Blotter Records (5 sample cases)
- Range of incident types and severities
- Different statuses (active, resolved, dismissed)
- Demonstrates blocking mechanism for certificate issuance

## Key Survey Requirements Implemented

### ✅ **Certificate Automation**
- Auto-templates for all 8 certificate types
- Digital signatures and QR verification
- Blotter integration with automatic blocking
- Status tracking and notifications
- History logs and appointment scheduling

### ✅ **Centralized Database**
- Personal details with household links
- Complete blotter history integration
- Certificate history tracking
- Tax records support (business and property)

### ✅ **Analytics & Reporting**
- Population/demographic analysis
- Blotter frequency tracking
- Senior citizen growth monitoring
- Housing density and utility connection rates
- Multiple visualization formats (bar, line, pie, heatmaps)

### ✅ **QR Code Integration**
- One-time transaction validation
- Real-time verification system
- Fraud detection capabilities
- Certificate authenticity checking

### ✅ **Security Features**
- Role-based access control (RBAC)
- Audit logs for all activities
- Data encryption support
- Multi-factor authentication ready
- Device tracking capabilities

## Configuration

### Default Settings
- Certificate validity: 365 days (configurable)
- QR session duration: 60 minutes
- Max certificates per session: 5
- Auto-block for active blotters: enabled
- Population count: 48,000

### Customization
All settings can be modified through the `system_settings` table or admin interface.

## API Integration Ready

The database structure supports:
- REST API endpoints
- Real-time dashboard updates
- Mobile app integration
- Government system integration (LGU)
- Export capabilities (PDF, Excel, CSV)

## Support

For technical support or customization requests, refer to the survey data and requirements documentation provided.