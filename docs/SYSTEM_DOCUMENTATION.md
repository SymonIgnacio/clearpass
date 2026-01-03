# ClearPass Barangay Management System - Documentation

**Version:** 1.0.1  
**Last Updated:** Jan 2026  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Security](#security)
5. [API Reference](#api-reference)
6. [Database](#database)
7. [Deployment](#deployment)
8. [Maintenance](#maintenance)

---

## System Overview

### Tech Stack
- **Backend:** Node.js 18+, Express.js
- **Database:** MySQL 8.0
- **Frontend:** React 18, Vite, TailwindCSS
- **Authentication:** JWT + Firebase (optional)
- **Testing:** Jest

### Key Features
- Resident profiling & management
- Barangay clearance issuance
- Blotter/incident reporting
- Census & analytics
- Document generation
- Role-based access control

---

## Quick Start

### Prerequisites
```bash
Node.js >= 18.0.0
MySQL >= 8.0
npm >= 9.0.0
```

### Installation
```bash
# Clone repository
git clone <repository-url>

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Install test dependencies
cd ../tests
npm install
```

### Environment Setup
Create `server/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=barangay_management
DB_PORT=3306

SERVER_PORT=3001
CLIENT_URL=http://localhost:5173

JWT_SECRET=<128-char-hex-string>
```

### Database Setup
```bash
mysql -u root -p
CREATE DATABASE barangay_management;
USE barangay_management;
SOURCE sql/migrations/001_add_performance_indexes.sql;
```

### Run Application
```bash
# Start server (from server/)
npm start

# Start client (from client/)
npm run dev
```

---

## Architecture

### Folder Structure
```
clearpass/
├── server/           # Backend API
│   ├── config/       # Configuration files
│   ├── controllers/  # Business logic
│   ├── middleware/   # Auth, validation, logging
│   ├── routes/       # API routes
│   ├── utils/        # Helper functions
│   └── index.js      # Main server file
├── client/           # Frontend React app
├── docs/             # Documentation
├── sql/              # Database scripts
├── scripts/          # Utility scripts
└── tests/            # Test suites
```

### Key Components

**Middleware:**
- `authMiddleware.js` - JWT authentication
- `validation.js` - Input validation
- `errorHandler.js` - Centralized error handling
- `logger.js` - Winston audit logging
- `compression.js` - Response compression
- `performanceMetrics.js` - Request tracking

**Routes:**
- `adminRoutes.js` - Admin reports
- `residentRoutes.js` - Resident operations
- `certificateRoutes.js` - Certificate issuance
- `blotterRoutes.js` - Incident management
- `censusRoutes.js` - Census statistics
- `userRoutes.js` - User management

---

## Security

### Authentication
- JWT tokens (128-char secret)
- Role-based access control (RBAC)
- Rate limiting (100 req/15min)
- Bcrypt password hashing (10 rounds)

### Security Features
- ✅ Helmet security headers
- ✅ XSS protection
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation & sanitization
- ✅ CORS configuration
- ✅ Audit logging

### Rate Limits
```javascript
API_RATE_LIMIT: 100 requests/15min
STRICT_RATE_LIMIT: 10 requests/15min
AUTH_RATE_LIMIT: 5 requests/15min
```

### Security Checklist
- [ ] Rotate JWT secret every 90 days
- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Run security tests before deployment
- [ ] Monitor failed login attempts

---

## API Reference

### Base URL
```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}

Response:
{
  "token": "jwt-token",
  "user": { "id": 1, "username": "admin", "role": 1 }
}
```

### Residents
```http
GET /api/residents?page=1&limit=50
Authorization: Bearer <token>

Response:
{
  "data": [...],
  "pagination": { "page": 1, "limit": 50, "total": 100 }
}
```

### Certificates
```http
POST /api/certificates
Authorization: Bearer <token>
Content-Type: application/json

{
  "resident_id": "RES-123",
  "certificate_type_id": 1,
  "purpose": "Employment"
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message",
    "details": {}
  }
}
```

---

## Database

### Schema Overview
- **users** - System users & authentication
- **residents** - Resident profiles
- **households** - Household information
- **blotter** - Incident reports
- **certificates_log** - Certificate records
- **vulnerabilities** - Vulnerable groups tracking
- **sitios** - Geographic divisions

### Performance Indexes
24 indexes on frequently queried columns:
- residents: Resident_ID, Household_ID, Residency_Status
- blotter: Case_Number, respondent_id, Status
- certificates_log: control_no, resident_id, status
- users: username, email, role

### Migrations
```bash
# Run migrations
mysql -u root -p barangay_management < sql/migrations/001_add_performance_indexes.sql
```

### Backup Strategy
```bash
# Daily backup
mysqldump -u root -p barangay_management > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p barangay_management < backup_20241212.sql
```

---

## Deployment

### Pre-Deployment Checklist
- [ ] All tests passing (`npm test`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Dependencies installed
- [ ] Security audit completed
- [ ] Backup created

### Production Environment
```env
NODE_ENV=production
DB_HOST=production-db-host
DB_PASSWORD=<strong-password>
JWT_SECRET=<128-char-hex>
CLIENT_URL=https://your-domain.com
```

### Health Check
```bash
curl http://localhost:3001/health

Response:
{
  "status": "healthy",
  "database": "connected",
  "uptime": 3600,
  "timestamp": "2024-12-12T10:00:00Z"
}
```

### Monitoring
- Check `/health` endpoint every 60 seconds
- Monitor error logs: `server/logs/error.log`
- Track slow queries (>1000ms)
- Review audit logs: `server/logs/audit.log`

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check system health
- Review failed login attempts

**Weekly:**
- Review audit logs
- Check database performance
- Update security patches

**Monthly:**
- Rotate JWT secrets
- Update dependencies
- Run security tests
- Database optimization

### Troubleshooting

**Database Connection Failed:**
```bash
# Check MySQL status
systemctl status mysql

# Test connection
mysql -u root -p -e "SELECT 1"

# Verify credentials in .env
```

**Authentication Errors:**
```bash
# Check JWT secret consistency
grep JWT_SECRET server/.env

# Verify token expiration
# Tokens expire after 24 hours
```

**Performance Issues:**
```bash
# Check slow queries
tail -f server/logs/combined.log | grep "Slow request"

# Monitor database
SHOW PROCESSLIST;
```

### Logs Location
```
server/logs/error.log      - Error logs
server/logs/combined.log   - All logs
server/logs/audit.log      - Audit trail
```

---

## Testing

### Run Tests
```bash
cd tests
npm test                    # All tests
npm test security.test.js   # Security tests only
```

### Test Coverage
- Security: 22 tests (SQL injection, XSS)
- Target: 80% code coverage

### Add New Tests
```javascript
// tests/__tests__/example.test.js
describe('Feature', () => {
  test('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

---

## Support

### Documentation
- System Docs: `docs/SYSTEM_DOCUMENTATION.md`
- API Docs: `http://localhost:3001/api-docs`
- Naming Conventions: `docs/guides/NAMING_CONVENTIONS.md`

### Common Issues
See Code Issues Panel for latest findings and recommendations.

---

**Last Audit:** December 2024  
**Next Review:** March 2025 (90 days)
