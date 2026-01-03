# THEMIS Barangay Management System

A secure web application for Barangay Batia administration with strict Role-Based Access Control (RBAC). Built with React, Node.js, and MySQL.

## 🏗️ System Overview

**Current Status:** Production Ready (THEMIS RBAC Implementation)
**Latest Version:** v3.0 (THEMIS RBAC + Segregation of Duties)
**Tech Stack:** React 18 + Node.js + MySQL 8.0
**Database:** barangay_management (10+ tables with migrations)

### Architecture
```
THEMIS System
├── client/          # React Frontend (Port 80/5174)
├── server/          # Node.js API (Port 3001)
├── database/        # MySQL Schema + Migrations
├── tests/           # Test Suite (95%+ coverage)
└── docs/           # Comprehensive Documentation
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Material-UI (MUI)** for professional UI components
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Node.js + Express** for RESTful API
- **MySQL** with connection pooling
- **JWT** for authentication
- **CORS** enabled for cross-origin requests

### Testing
- **Jest** for comprehensive test suite
- **Business rule validation**
- **RBAC permission testing**
- **Integration testing**

## 📊 Database Schema

### Core Tables
- `sitios` - Hardcoded barangay areas (Batia Proper, Northville 5, St. Martha, AFP/PNP)
- `residents` - Complete resident profiles with vulnerability flags
- `blotter` - Incident reporting with status tracking
- `certificates` - Certificate issuance with audit trails
- `tanod_schedule` - Patrol shift management
- `users` - Authentication system (prepared)

## 🧪 Testing Suite

Comprehensive test coverage including:

### Critical Business Rules Tests
- Certificate-blotter integration validation
- Status update impact verification
- Error message accuracy testing

### RBAC Security Tests
- Role-based access control validation
- Segregation of duties enforcement
- Permission matrix testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm/yarn package managers

### Installation

1. **Clone and setup:**
```bash
git clone <repository-url>
cd barangay-management-system
npm run install:all
```

2. **Database setup:**
```sql
-- Import schema
source database/schema.sql;
```

3. **Environment configuration:**
```bash
# Copy and configure .env
cp .env.example .env
# Edit database credentials and ports
```

4. **Start all services:**
```bash
npm run dev:all
```

Services will start on:
- Frontend: http://localhost:5174
- Backend API: http://localhost:3001

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## 🔒 Security Features

- Input validation and sanitization
- SQL injection prevention with parameterized queries
- CORS configuration for secure API access
- Business rule enforcement at API level
- Audit trails for certificate issuance

## 🎯 Business Rules Implemented

### Certificate Issuance Logic
```javascript
// CRITICAL: Check blotter before certificate issuance
if (certificate_type.includes('clearance')) {
  const activeCases = await checkBlotterStatus(resident_id);
  if (activeCases.count > 0) {
    throw new Error('BLOCK ISSUANCE: Resident has unsettled case');
  }
}
```

### THEMIS RBAC Permissions
```javascript
// STRICT: Role-based access control enforcement
const PERMISSIONS = {
  0: { // IT Admin - Tech/Infra only
    canCreateUsers: true,
    canManageSystem: true
  },
  1: { // Captain - Read-Only Analytics
    canViewAnalytics: true,
    canViewReports: true
  },
  2: { // Secretary - Ops/Approver
    canApproveRequests: true,
    canManageOperations: true
  },
  3: { // Clerk - Fulfillment/Issuer
    canIssueCertificates: true,
    canProcessRequests: true
  },
  4: { // Blotter Officer - Case Manager
    canManageBlotter: true,
    canEditCases: true
  },
  5: { // Resident - End User
    canViewProfile: true,
    canRequestServices: true
  }
};
```

## 📈 Performance & Scalability

- Database connection pooling
- Indexed queries for fast data retrieval
- Efficient API response caching
- Modular architecture for easy scaling
- Comprehensive error handling

## 🔧 Development

### Project Structure
```
├── client/src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   └── App.jsx        # Main application
├── server/
│   ├── index.js       # Express server
│   ├── database.js    # Database operations
│   ├── authMiddleware.js # RBAC middleware
│   └── permissions.js # Role permissions
└── tests/             # Test suite
```

### API Endpoints
- `GET/POST/PUT/DELETE /api/residents` - Resident management
- `GET/POST /api/blotter` - Incident reporting
- `POST /api/certificates` - Certificate issuance
- `GET /api/census` - Population statistics
- `GET/POST /api/users` - User account management

## 🤝 Contributing

1. Follow the established code structure
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass before committing

## 📝 License

This project is developed for barangay administration purposes.

## 🆘 Support

For technical support or feature requests, please refer to the test suite and documentation within the codebase.

---

**Built with ❤️ for efficient barangay management and community safety.**
