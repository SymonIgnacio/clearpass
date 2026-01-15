# ClearPass API Documentation

## Overview
ClearPass is a comprehensive barangay management system API that provides endpoints for resident management, document processing, case management, and administrative oversight.

**Base URL**: `http://localhost:3002/api`  
**Authentication**: JWT-based with role-based access control  
**Content-Type**: `application/json`

## Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "role": 1,
      "role_name": "IT Admin",
      "email": "admin@example.com",
      "full_name": "System Administrator"
    }
  },
  "timestamp": "2025-01-XX"
}
```

### Get Current User
```http
GET /auth/me
Cookie: authToken=<jwt_token>
```

### Logout
```http
POST /auth/logout
Cookie: authToken=<jwt_token>
```

## Role-Based Access Control

### Roles
- **1 - IT Admin**: Full system access
- **2 - Captain**: Read-only access to all data
- **3 - Secretary**: Document management and resident data
- **4 - Clerk**: Certificate processing and resident management
- **6 - Blotter Officer**: Case management and incident reports
- **12 - Resident**: Limited access to personal data

### Access Patterns
- **GET requests**: Generally allowed for all authenticated users
- **POST/PUT/DELETE**: Role-specific permissions
- **Captain (role 2)**: Blocked from all write operations
- **Admin endpoints**: Only accessible by IT Admin (role 1)

## Residents API

### Get All Residents
```http
GET /residents?page=1&limit=50&search=john&sitio_id=1
Authorization: Bearer <token>
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 50)
- `search`: Search by name or mobile number
- `sitio_id`: Filter by sitio
- `residency_status`: Filter by status
- `show_vulnerable`: Show vulnerable residents only

**Response**:
```json
{
  "data": [
    {
      "Resident_ID": "RES-123",
      "First_Name": "John",
      "Last_Name": "Doe",
      "Gender": "Male",
      "Birthdate": "1990-01-01",
      "sitio_name": "Batia Proper",
      "Is_4Ps": false,
      "Is_PWD": false
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

### Get Resident by ID
```http
GET /residents/{resident_id}
Authorization: Bearer <token>
```

### Create Resident
```http
POST /residents
Authorization: Bearer <token>
Content-Type: application/json

{
  "household_id": "HH-123",
  "first_name": "John",
  "last_name": "Doe",
  "birthdate": "1990-01-01",
  "gender": "Male",
  "email": "john@example.com",
  "mobile_number": "09123456789"
}
```

### Update Resident
```http
PUT /residents/{resident_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "Updated Name",
  "mobile_number": "09987654321"
}
```

### Archive Resident
```http
DELETE /residents/{resident_id}
Authorization: Bearer <token>
```

## Blotter/Case Management API

### Get All Cases
```http
GET /blotter
Authorization: Bearer <token>
```

### Create Case
```http
POST /blotter
Authorization: Bearer <token>
Content-Type: application/json

{
  "Complainant_Details": {
    "name": "John Doe",
    "address": "123 Main St"
  },
  "Respondent_Details": {
    "name": "Jane Smith",
    "address": "456 Oak Ave"
  },
  "Incident_Type": "Physical Injury",
  "Narrative": "Description of incident",
  "DateTime_Incident": "2025-01-01 14:30:00",
  "Location_Sitio": "Batia Proper"
}
```

### Update Case
```http
PUT /blotter/{case_number}
Authorization: Bearer <token>
Content-Type: application/json

{
  "Status": "Scheduled for Mediation",
  "Hearing_Schedule": "2025-01-15 09:00:00"
}
```

## Certificates API

### Get Certificate Types
```http
GET /certificates/types
Authorization: Bearer <token>
```

### Request Certificate
```http
POST /certificates
Authorization: Bearer <token>
Content-Type: application/json

{
  "resident_id": "RES-123",
  "certificate_type": "Barangay Clearance",
  "purpose": "Employment",
  "fee_amount": 50.00
}
```

## Admin API

### Get All Users
```http
GET /admin/users
Authorization: Bearer <token>
Role: IT Admin (1) only
```

### Get System Statistics
```http
GET /admin/stats
Authorization: Bearer <token>
Role: IT Admin (1) only
```

### Create Staff User
```http
POST /admin/staff
Authorization: Bearer <token>
Role: IT Admin (1) only
Content-Type: application/json

{
  "username": "newstaff",
  "password": "password123",
  "email": "staff@example.com",
  "full_name": "New Staff Member",
  "role": 4
}
```

## Error Responses

All API endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "2025-01-XX",
    "details": "Additional error details (optional)"
  }
}
```

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate entry)
- **500**: Internal Server Error

## Rate Limiting

- **Authentication endpoints**: 1000 requests per 15 minutes
- **Admin endpoints**: 20 requests per 15 minutes
- **General API**: 100 requests per 15 minutes

## Security Features

### CSRF Protection
State-changing operations require CSRF tokens:
```http
GET /csrf-token
```

### Input Validation
- All inputs are validated and sanitized
- SQL injection prevention through parameterized queries
- XSS protection enabled

### Role-Based Security
- JWT tokens include role information
- Middleware enforces role-based access
- Captain role has read-only restrictions

## Pagination

List endpoints support pagination:
```http
GET /residents?page=2&limit=25
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 25,
    "total": 150,
    "pages": 6
  }
}
```

## Search and Filtering

Most list endpoints support search and filtering:
- `search`: Text search across relevant fields
- `status`: Filter by status values
- `date_from`/`date_to`: Date range filtering
- `sitio_id`: Filter by location

## WebSocket Events

Real-time notifications via WebSocket:
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3002/ws');

// Listen for notifications
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification') {
    // Handle notification
  }
};
```

## Health Check

```http
GET /health
```

Returns system health status and basic information.

---

**Note**: This API requires proper authentication and role-based permissions. Ensure you have the appropriate access level before making requests to protected endpoints.