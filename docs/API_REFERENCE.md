# ClearPass API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3001/api`  
**Authentication:** JWT Bearer Token

---

## Table of Contents

1. [Authentication](#authentication)
2. [Residents](#residents)
3. [Certificates](#certificates)
4. [Blotter](#blotter)
5. [Census](#census)
6. [Admin](#admin)
7. [Error Codes](#error-codes)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

### POST /api/auth/login
Login to the system and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "clerk",
    "name": "Juan Dela Cruz"
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

---

## Residents

### GET /api/residents
Get paginated list of residents.

**Authentication:** Required (Admin, Captain, Clerk)

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `search` (string, optional) - Search by name

**Response (200 OK):**
```json
{
  "data": [
    {
      "Resident_ID": "RES-1234567890-A1B2",
      "First_Name": "Juan",
      "Last_Name": "Dela Cruz",
      "Mobile_Number": "09171234567",
      "Residency_Status": "Active"
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

### GET /api/residents/:id
Get resident details by ID.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "Resident_ID": "RES-1234567890-A1B2",
  "First_Name": "Juan",
  "Last_Name": "Dela Cruz",
  "Mobile_Number": "09171234567",
  "Residency_Status": "Active",
  "Household_ID": "HH-001",
  "Date_Arrival": "2024-01-15"
}
```

### POST /api/residents
Create new resident.

**Authentication:** Required (Admin, Captain, Clerk)

**Request Body:**
```json
{
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "mobile_number": "09171234567",
  "household_id": "HH-001",
  "residency_status": "Active"
}
```

**Response (201 Created):**
```json
{
  "message": "Resident created successfully",
  "resident_id": "RES-1234567890-A1B2"
}
```

### PUT /api/residents/:id
Update resident information.

**Authentication:** Required (Admin, Captain, Clerk)

**Request Body:** (partial update supported)
```json
{
  "mobile_number": "09181234567",
  "residency_status": "Active"
}
```

**Response (200 OK):**
```json
{
  "message": "Resident updated successfully"
}
```

### DELETE /api/residents/:id
Archive resident (soft delete).

**Authentication:** Required (Admin, Captain)

**Response (200 OK):**
```json
{
  "message": "Resident archived successfully"
}
```

---

## Certificates

### GET /api/certificates
Get list of certificates.

**Authentication:** Required

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `type` (string, optional) - Filter by certificate type

**Response (200 OK):**
```json
{
  "data": [
    {
      "control_no": "CLR-1234567890-A1B2C3D4",
      "resident_id": "RES-1234567890-A1B2",
      "certificate_type": "Barangay Clearance",
      "purpose": "Employment",
      "status": "Released",
      "date_issued": "2024-01-15"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### POST /api/clerk/issue-clearance
Issue barangay clearance certificate.

**Authentication:** Required (Clerk, Admin)

**Request Body:**
```json
{
  "resident_id": "RES-1234567890-A1B2",
  "purpose": "Employment"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Clearance certificate issued successfully",
  "certificate": {
    "control_no": "CLR-1234567890-A1B2C3D4",
    "qr_hash": "A1B2C3D4E5F6G7H8",
    "verification_url": "http://localhost:5173/verify-qr/A1B2C3D4E5F6G7H8"
  },
  "clearpass_validation": {
    "eligible": true,
    "blotter_records_checked": 2,
    "active_cases": 0
  }
}
```

**Error Response (403 Forbidden - ClearPass Denied):**
```json
{
  "success": false,
  "error": {
    "code": "CLEARPASS_DENIED",
    "message": "CLEARPASS DENIED: Resident has active accountabilities."
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Blotter

### GET /api/blotter
Get list of blotter cases.

**Authentication:** Required

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `status` (string, optional) - Filter by status

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "case_number": "BLT-2024-001",
      "incident_type": "Noise Complaint",
      "status": "Active",
      "complainant_id": "RES-001",
      "respondent_id": "RES-002",
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "pages": 1
  }
}
```

### POST /api/blotter
Create new blotter case.

**Authentication:** Required (Admin, Captain, Clerk)

**Request Body:**
```json
{
  "incident_type": "Noise Complaint",
  "complainant_id": "RES-001",
  "respondent_id": "RES-002",
  "incident_description": "Loud music at 2 AM",
  "incident_date": "2024-01-15"
}
```

**Response (201 Created):**
```json
{
  "message": "Blotter case created successfully",
  "case_number": "BLT-2024-001"
}
```

---

## Census

### GET /api/census/summary
Get census summary statistics.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "total_population": 5000,
  "total_households": 1200,
  "male_count": 2500,
  "female_count": 2500,
  "age_distribution": {
    "0-17": 1000,
    "18-59": 3500,
    "60+": 500
  },
  "vulnerable_groups": {
    "seniors": 500,
    "pwd": 150,
    "low_income": 800
  }
}
```

---

## Admin

### GET /api/admin/summary
Get administrative summary reports.

**Authentication:** Required (Admin, Captain)

**Response (200 OK):**
```json
{
  "users": {
    "total": 25,
    "active": 20,
    "by_role": {
      "admin": 2,
      "captain": 1,
      "clerk": 5,
      "resident": 17
    }
  },
  "blotter": {
    "total_cases": 150,
    "active_cases": 25,
    "resolved_cases": 125
  },
  "certificates": {
    "total_issued": 500,
    "this_month": 45
  }
}
```

---

## Error Codes

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_ENTRY` | 409 | Duplicate entry in database |
| `CLEARPASS_DENIED` | 403 | Resident has active accountabilities |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Rate Limiting

Rate limits are applied to prevent abuse:

| Endpoint | Limit |
|----------|-------|
| `/api/auth/login` | 5 requests per 15 minutes |
| All other endpoints | 100 requests per 15 minutes |

**Rate Limit Headers:**
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Time when limit resets (Unix timestamp)

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Authentication Requirements

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access |
| **Captain** | View all data, approve operations |
| **Clerk** | Manage residents, issue certificates |
| **Resident** | View own data only |

---

## Development Notes

- Base URL for development: `http://localhost:3001/api`
- All timestamps are in ISO 8601 format (UTC)
- Pagination is available on list endpoints
- All POST/PUT requests require `Content-Type: application/json`
- Stack traces are only included in development mode

---

**Last Updated:** January 2026  
**API Version:** 1.0.0
