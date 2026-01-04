# ClearPass Architecture

**Last Updated:** January 2026

---

## System Overview

### Tech Stack
- **Frontend:** React 18 + Vite + Material-UI
- **Backend:** Node.js 18 + Express.js
- **Database:** MySQL 8.0
- **AI Service:** Python 3.11 + Flask
- **Authentication:** JWT + bcrypt

### Architecture Pattern
```
Client (React) → API (Express) → Database (MySQL)
                      ↓
                AI Service (Python)
```

---

## Authentication System

### JWT Authentication
- Token-based authentication
- 24-hour expiration
- Bcrypt password hashing (10 rounds)
- Role-based access control

### Login Flow
```javascript
POST /api/auth/login
Body: { username, password }
Response: { token, user: { id, username, role } }
```

### Middleware
```javascript
// Protect routes
app.get('/api/protected', verifyToken, handler);

// Role-based access
app.get('/api/admin', verifyToken, checkRole(['admin']), handler);
```

### Default Accounts
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| captain | captain | captain |
| secretary | secretary | secretary |
| clerk | clerk | clerk |

---

## Role-Based Access Control

### Role Hierarchy
```
Super Admin (Level 100)
├── Captain (Level 80)
│   ├── Secretary (Level 60)
│   │   └── Clerk (Level 40)
│   └── Blotter Officer (Level 40)
└── Resident (Level 20)
```

### Permissions
- **Admin:** Full system access
- **Captain:** Approve certificates, view reports
- **Secretary:** Issue certificates, manage operations
- **Clerk:** Process requests, basic operations
- **Resident:** View profile, request services

---

## Resident Signup System

### Hybrid Signup Flow
1. **User Registration** → Creates account (pending)
2. **Verification Request** → Upload proof of residency
3. **Admin Review** → Approve/reject verification
4. **Account Activation** → Link to resident profile
5. **Full Access** → Can request certificates

### Verification Requirements
- Valid ID
- Proof of residency (utility bill, lease)
- Contact information
- Admin approval

---

## Database Schema

### Core Tables
- **users** - Authentication & roles
- **residents** - Resident profiles
- **households** - Household information
- **blotter** - Incident reports
- **certificates_log** - Certificate records
- **document_requests** - Online requests
- **resident_verification_requests** - Signup verifications

### Key Relationships
```sql
users → residents (1:1)
households → residents (1:N)
residents → certificates_log (1:N)
residents → blotter (1:N as respondent/complainant)
```

---

## API Structure

### Endpoint Organization
```
/api/auth/*          - Authentication
/api/residents/*     - Resident management
/api/certificates/*  - Certificate issuance
/api/blotter/*       - Incident reporting
/api/users/*         - User management
/api/admin/*         - Admin operations
```

### Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": { "page": 1, "limit": 50, "total": 100 }
}
```

### Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Security Features

### Implemented
- JWT authentication
- Bcrypt password hashing
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- CORS configuration
- Rate limiting
- Helmet security headers
- Audit logging

### CSRF Protection
```javascript
// Enabled globally
app.use(csrfProtection);

// Token endpoint
GET /api/csrf-token
```

---

## Performance Optimizations

### Database
- 24+ performance indexes
- Connection pooling (10 connections)
- Query optimization
- Pagination on all lists

### Application
- Response compression (gzip)
- Redis caching (optional)
- Code splitting (React lazy loading)
- Performance monitoring

### Caching Strategy
- Census data (5 min TTL)
- Sitio list (10 min TTL)
- User roles (5 min TTL)

---

## Monitoring & Logging

### Winston Logger
- Structured JSON logging
- Log levels (info/warn/error)
- File persistence
- Sensitive data sanitization

### Performance Tracking
```javascript
// Query monitoring
monitorQuery(db, query, params, 'QueryName');

// Request tracking
app.use(requestPerformance);
```

### Health Checks
```bash
GET /health
GET /api/performance/health
GET /api/performance/metrics
```

---

## Deployment Architecture

### Development
```
Frontend: localhost:5173
Backend: localhost:3001
Database: localhost:3306
AI Service: localhost:5000
```

### Production
```
Frontend: https://yourdomain.com
Backend: https://api.yourdomain.com
Database: Internal network
AI Service: Internal network
```

### Docker Setup
```yaml
services:
  frontend:
    build: ./client
    ports: ["80:80"]
  
  backend:
    build: ./server
    ports: ["3001:3001"]
  
  database:
    image: mysql:8.0
    ports: ["3306:3306"]
```

---

## File Structure

```
clearpass/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── utils/       # Helper functions
│   └── vite.config.js
│
├── server/              # Express backend
│   ├── controllers/     # Business logic (6 controllers)
│   ├── middleware/      # Auth, validation, logging
│   ├── routes/          # API routes (6 modules)
│   ├── utils/           # Utilities
│   └── index.js         # Main server (2,122 lines)
│
├── ai_service/          # Python AI service
│   └── smart_suggestions.py
│
└── database/            # SQL migrations
```

---

## Business Rules

### Certificate Issuance
- Check blotter status before issuance
- Block if active cases exist
- Block if 3+ missed hearings
- Require valid resident profile

### Blotter Integration
```javascript
// Before issuing clearance
const [cases] = await db.execute(`
  SELECT COUNT(*) as count 
  FROM blotter 
  WHERE respondent_id = ? 
  AND status IN ('Pending', 'Ongoing')
`, [resident_id]);

if (cases[0].count > 0) {
  throw new Error('Active blotter case exists');
}
```

---

## AI Integration

### Features
- Social aid priority calculation
- Patrol route suggestions
- Incident forecasting
- Chatbot support

### API Endpoints
```
POST /api/ai/priority-score
GET /api/ai/patrol-suggestions
POST /api/ai/chatbot/message
```

### Fallback Strategy
- AI service optional
- Graceful degradation
- Mock responses if unavailable
