# 📚 Barangay Management System API Documentation

## Overview

The Barangay Management System API provides comprehensive backend services for managing barangay operations, including resident profiling, certificate issuance, incident reporting, AI-powered decision support, and community management features.

**Base URL:** `http://localhost:3001/api`
**Version:** 1.0.0
**Authentication:** API Key (Bearer Token) - Implementation Required

---

## 🔐 Authentication

### API Key Authentication
```http
Authorization: Bearer YOUR_API_KEY
```

### Rate Limiting
- **General endpoints:** 100 requests per 15 minutes per IP
- **Certificate endpoints:** 10 requests per 15 minutes per IP
- **AI endpoints:** 50 requests per 15 minutes per IP

---

## 📊 Core Endpoints

### 🏠 Resident Management

#### GET /api/residents
Get all residents with pagination and filtering.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50, max: 100)
- `sitio_id` (integer): Filter by sitio
- `search` (string): Search by name

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "first_name": "Juan",
      "last_name": "Dela Cruz",
      "middle_name": "Santos",
      "age": 35,
      "gender": "Male",
      "sitio_name": "Batia Proper",
      "is_senior": false,
      "is_pwd": true,
      "is_single_parent": false,
      "employment_status": "Employed",
      "monthly_income": 25000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

#### POST /api/residents
Create a new resident record.

**Request Body:**
```json
{
  "first_name": "Maria",
  "last_name": "Santos",
  "middle_name": "Garcia",
  "age": 28,
  "gender": "Female",
  "sitio_id": 1,
  "is_senior": false,
  "is_pwd": false,
  "is_single_parent": true,
  "employment_status": "Self-employed",
  "monthly_income": 18000
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "message": "Resident created successfully"
}
```

#### PUT /api/residents/:id
Update resident information.

**Request Body:** Same as POST, all fields optional

**Response:** `200 OK`
```json
{
  "message": "Resident updated successfully"
}
```

#### DELETE /api/residents/:id
Soft delete a resident record.

**Response:** `200 OK`
```json
{
  "message": "Resident deleted successfully"
}
```

### 📋 Certificate Management

#### GET /api/certificates
Get all issued certificates.

**Query Parameters:**
- `page`, `limit`: Pagination
- `resident_id`: Filter by resident
- `certificate_type`: Filter by type
- `status`: Filter by status

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "control_no": "CERT-20251130-ABC123",
      "resident_id": 1,
      "certificate_type": "Barangay Clearance",
      "purpose": "Employment",
      "status": "approved",
      "date_issued": "2025-11-30",
      "signatory_captain": "Captain Juan Dela Cruz",
      "signatory_secretary": "Secretary Maria Santos"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45, "pages": 3 }
}
```

#### POST /api/certificates
Issue a new certificate with business rule validation.

**Request Body:**
```json
{
  "resident_id": 1,
  "certificate_type_id": 4,
  "purpose": "Employment verification",
  "data": {
    "employer": "ABC Corporation",
    "position": "Software Developer"
  },
  "issued_by": 1
}
```

**Business Rules Applied:**
- ✅ Resident existence validation
- ✅ Certificate type validation
- ✅ Blotter check for Clearance/Good Moral certificates
- ✅ Transaction safety for data consistency

**Response:** `201 Created`
```json
{
  "id": 1,
  "control_no": "CERT-20251130-ABC123",
  "message": "Certificate issued successfully"
}
```

**Error Response (Blotter Block):**
```json
{
  "error": "BLOCK ISSUANCE: Active blotter case found for this resident",
  "details": {
    "caseCount": 1,
    "caseNumbers": ["BLT-2025-001"],
    "incidentTypes": ["Theft"],
    "message": "Cannot issue clearance certificate while resident has pending blotter cases"
  }
}
```

### 🚔 Blotter & Incident Reporting

#### GET /api/blotter
Get all blotter records with filtering.

**Query Parameters:**
- `status`: Filter by status (Pending, Resolved, etc.)
- `sitio_id`: Filter by sitio
- `date_from`, `date_to`: Date range filtering

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "case_number": "BLT-20251130-001",
      "incident_type": "Theft",
      "complainant_name": "Juan Dela Cruz",
      "respondent_name": "Unknown",
      "status": "Pending",
      "severity": "Medium",
      "date_filed": "2025-11-30T10:30:00Z",
      "sitio_name": "Batia Proper"
    }
  ]
}
```

#### POST /api/blotter
Create a new blotter record.

**Request Body:**
```json
{
  "complainant_id": 1,
  "respondent_name": "Unknown Suspect",
  "incident_type": "Theft",
  "incident_date": "2025-11-29",
  "incident_time": "14:30",
  "location": "Block 5, Lot 12",
  "sitio_id": 1,
  "description": "Mobile phone stolen from residence",
  "severity": "Medium",
  "recorded_by": 1
}
```

### 🤖 AI Integration Endpoints

#### POST /api/ai/priority
Get AI-powered social aid priority scoring.

**Request Body:**
```json
{
  "resident_id": 1
}
```

**Response:**
```json
{
  "resident_id": 1,
  "resident_name": "Juan Dela Cruz",
  "priority": "HIGH PRIORITY",
  "urgency": "Fast-tracked assistance needed",
  "final_score": 78.5,
  "vulnerability_score": 65.0,
  "trend_factor": 1.2,
  "community_factor": 1.15,
  "recommended_actions": [
    "Fast-tracked aid application processing",
    "Monthly financial assistance program",
    "Skills training and job placement support"
  ],
  "analysis_breakdown": {
    "vulnerability_components": {
      "senior_factor": false,
      "pwd_factor": true,
      "single_parent_factor": false,
      "employment_factor": "employed",
      "income_ratio": 0.4
    },
    "trend_analysis": {
      "income_trend": 1.1,
      "aid_frequency": 1.3
    },
    "community_risk": 0.25
  }
}
```

#### GET /api/ai/patrol-suggestions
Get AI-powered patrol deployment recommendations.

**Response:**
```json
{
  "overall_risk_assessment": "HIGH",
  "confidence_score": 0.92,
  "max_risk_score": 85,
  "hotspots": [
    {
      "area": "Batia Proper",
      "risk_level": "HIGH",
      "risk_score": 85,
      "key_factors": ["high_incident_rate", "recent_escalation"],
      "incident_rate": 0.8,
      "total_incidents": 12,
      "severity_breakdown": {
        "Critical": 2,
        "High": 5,
        "Medium": 3,
        "Low": 2
      }
    }
  ],
  "recommendations": [
    "Deploy 4+ tanods per hotspot area",
    "Implement roving patrol system",
    "Install additional security cameras"
  ]
}
```

#### POST /api/ai/suggest-patrol-deployment
Get Katarungang Pambarangay patrol deployment suggestions based on blotter data.

**Request Body:**
```json
{
  "blotter_data": [
    {
      "Case_Number": "BLOT-2024-11-0001",
      "Incident_Type": "Noise Barrage",
      "Location_Sitio": "Batia Proper",
      "DateTime_Incident": "2024-11-25T14:30:00",
      "Status": "Pending"
    }
  ]
}
```

**Response:**
```json
{
  "patrol_recommendations": [
    "Critical Zone: Deploy 4 Tanods to Batia Proper immediately.",
    "Watchlist: Deploy 2 Tanods to Northville 5.",
    "Most common issue is Noise Barrage. Advise Tanods to focus on this."
  ],
  "sitio_scores": {
    "Batia Proper": 15,
    "Northville 5": 12
  },
  "sitio_deployment_details": {
    "Batia Proper": {
      "score": 15,
      "deployment": "4 Tanods (Critical)",
      "recommendation": "Critical Zone: Deploy 4 Tanods to Batia Proper immediately."
    }
  },
  "top_incident": "Noise Barrage",
  "analysis_period_days": 30,
  "total_relevant_incidents": 8,
  "total_cases_analyzed": 12,
  "ai_model_used": "Katarungang Pambarangay Patrol Deployment v1.0",
  "generated_at": "2024-11-30T10:42:00.000Z"
}
```

**Risk Weighting Logic:**
- **Offenses Against Persons:** 5 points
- **Offenses Against Property:** 3 points
- **Community & Ordinance:** 3 points
- **Civil & Family Disputes:** 0 points (excluded from patrol recommendations)

**Deployment Thresholds:**
- **Score > 20:** Deploy 4 Tanods immediately (Critical Zone)
- **Score > 10:** Deploy 2 Tanods (Watchlist)
- **Score ≤ 10:** Standard patrol (Monitor)

### 📊 Analytics & Census

#### GET /api/census
Get population statistics by sitio.

**Response:**
```json
{
  "bySitio": [
    {
      "sitio_name": "Batia Proper",
      "total_residents": 500,
      "seniors": 40,
      "pwd": 15,
      "single_parents": 25
    }
  ],
  "overall": {
    "total_residents": 1200,
    "total_seniors": 120,
    "total_pwd": 35,
    "total_single_parents": 65
  }
}
```

#### GET /api/analytics/census
Get detailed analytics census data.

**Response:** Enhanced census data with gender breakdown and additional metrics.

### 📱 SMS Notification System

#### POST /api/sms/send
Send SMS notification to resident.

**Request Body:**
```json
{
  "mobile": "+639123456789",
  "message": "Your certificate is ready for pickup.",
  "resident_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "sms_result": {
    "message": "SMS logged (integration ready)",
    "timestamp": "2025-11-30T12:00:00Z",
    "recipient": "+639123456789"
  },
  "message": "SMS notification sent successfully"
}
```

### 🔍 QR Code Verification

#### GET /verify-qr/:hash
Public endpoint for QR code verification.

**Response (Valid Certificate):**
```json
{
  "status": "VALID",
  "type": "certificate",
  "certificate": {
    "number": "CERT-20251130-ABC123",
    "type": "Barangay Clearance",
    "resident_name": "Juan Dela Cruz",
    "sitio": "Batia Proper",
    "issued_date": "2025-11-30",
    "signatory_captain": "Captain Juan Dela Cruz",
    "signatory_secretary": "Secretary Maria Santos"
  },
  "message": "Certificate is valid and authentic"
}
```

**Response (Invalid):**
```json
{
  "status": "INVALID",
  "message": "QR code not found or invalid. This document may be counterfeit."
}
```

### 📅 Community Events

#### GET /api/programs
Get community programs and events.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "program_name": "Senior Citizen Health Check",
      "description": "Free health screening for seniors",
      "program_date": "2025-12-15",
      "sitio_name": "Batia Proper",
      "status": "Scheduled",
      "target_beneficiaries": ["seniors", "pwd"],
      "participants_count": 45,
      "budget_allocated": 15000
    }
  ]
}
```

#### POST /api/programs
Create new community program.

#### PUT /api/programs/:id
Update program details.

#### POST /api/programs/:id/add-participant
Add resident to program.

---

## 📈 Monitoring & Health Checks

### GET /health
System health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-30T12:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 104857600,
    "heapTotal": 67108864,
    "heapUsed": 45000000,
    "external": 2000000
  },
  "version": "1.0.0",
  "database": "healthy",
  "ai_service": "healthy"
}
```

### GET /metrics
Prometheus metrics endpoint for monitoring.

**Response:** Prometheus-formatted metrics
```
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1",method="GET",route="/api/residents",status_code="200"} 15
...
```

---

## 🔧 Technical Specifications

### Request/Response Format
- **Content-Type:** `application/json`
- **Charset:** UTF-8
- **Date Format:** ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)

### Error Response Format
```json
{
  "error": "Error message description",
  "timestamp": "2025-11-30T12:00:00.000Z",
  "path": "/api/endpoint",
  "code": "ERROR_CODE"
}
```

### Pagination
All list endpoints support pagination:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

### Rate Limiting Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1732972800
Retry-After: 900
```

---

## 🔒 Security Features

### Input Validation
- ✅ Required field validation
- ✅ Type checking and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection

### Authentication & Authorization
- ⚠️ **JWT Authentication:** Not yet implemented (High Priority)
- ✅ **Rate Limiting:** Multiple tiers implemented
- ✅ **CORS Protection:** Configured for allowed origins
- ✅ **Request Size Limits:** 10MB payload limit

### Data Protection
- ✅ **Transaction Safety:** Database transactions for critical operations
- ✅ **Business Rule Enforcement:** Certificate issuance validation
- ⚠️ **Encryption:** Not implemented (High Priority)
- ✅ **Error Information Leakage:** Prevented in production

### Monitoring & Logging
- ✅ **Structured Logging:** Winston logger with multiple transports
- ✅ **Request/Response Logging:** Comprehensive API logging
- ✅ **Error Tracking:** Detailed error logging with stack traces
- ✅ **Metrics Collection:** Prometheus metrics for monitoring

---

## 🚀 API Versioning

The API uses URL path versioning:
- **Current Version:** v1 (no prefix for backward compatibility)
- **Future Versions:** `/v2/api/endpoint`

---

## 📞 Support & Contact

- **API Documentation:** `http://localhost:3001/api-docs`
- **Health Check:** `http://localhost:3001/health`
- **Metrics:** `http://localhost:3001/metrics`
- **Support Email:** api@barangay.gov.ph
- **Version:** 1.0.0

---

## 🔄 Change Log

### Version 1.0.0 (November 30, 2025)
- ✅ Initial API release
- ✅ Core CRUD operations for residents, certificates, blotter
- ✅ AI integration endpoints
- ✅ QR code verification system
- ✅ Monitoring and health checks
- ✅ Comprehensive input validation
- ✅ Rate limiting and security headers
- ✅ Transaction safety for critical operations

### Upcoming Features (v1.1.0)
- 🔄 JWT authentication system
- 🔄 API key management
- 🔄 Enhanced security headers
- 🔄 Database encryption
- 🔄 Advanced analytics endpoints
