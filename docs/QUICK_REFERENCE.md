# 📚 CLEARPASS QUICK REFERENCE GUIDE

**Version:** 1.0.1  
**Last Updated:** January 12, 2025

---

## 🎯 SYSTEM OVERVIEW

ClearPass is a comprehensive barangay management system with:
- ✅ 6 user roles (Admin, Captain, Secretary, Clerk, Blotter Officer, Resident)
- ✅ Complete CRUD operations for residents, blotter, certificates
- ✅ Real-time notifications via WebSocket
- ✅ AI-powered chatbot
- ✅ QR code generation/verification
- ✅ Comprehensive admin reporting

---

## 🔑 USER ROLES & PERMISSIONS

| Role | ID | Permissions |
|------|----|-----------| 
| IT Admin | 1 | Full system access, user management, reports |
| Clerk | 2 | Resident management, certificate issuance |
| Blotter Officer | 3 | Blotter CRUD, incident management |
| Resident | 4 | View own data, request certificates |
| Captain | 5 | Read-only access to all data, reports |
| Secretary | 6 | Oversight access, can approve/override |

---

## 🌐 API ENDPOINTS QUICK REFERENCE

### Authentication
```
POST   /api/auth/officer-login    # Staff login
POST   /api/auth/resident/login   # Resident login
GET    /api/auth/profile           # Get current user
```

### Residents
```
GET    /api/residents              # List all (filtered)
GET    /api/residents/:id          # Get one
POST   /api/residents              # Create
PUT    /api/residents/:id          # Update
DELETE /api/residents/:id          # Archive
POST   /api/residents/:id/qr       # Generate QR
```

### Blotter
```
GET    /api/blotter                # List all
POST   /api/blotter                # Create case
PUT    /api/blotter/:caseNumber    # Update case
DELETE /api/blotter/:caseNumber    # Delete case
```

### Certificates
```
GET    /api/certificates           # List all
POST   /api/certificates           # Issue certificate
GET    /api/certificates/:id       # Get one
POST   /api/certificates/:id/qr    # Generate QR
```

### Admin Reports
```
GET    /api/admin/reports/users         # User statistics
GET    /api/admin/reports/blotter       # Blotter statistics
GET    /api/admin/reports/certificates  # Certificate statistics
GET    /api/admin/reports/residents     # Resident statistics
GET    /api/admin/reports/system        # System health
GET    /api/admin/reports/security      # Security audit
```

### Detailed Reports (with pagination)
```
GET    /api/admin/reports/detailed/users        # User table data
GET    /api/admin/reports/detailed/blotter      # Blotter table data
GET    /api/admin/reports/detailed/certificates # Certificate table data
GET    /api/admin/reports/detailed/residents    # Resident table data
GET    /api/admin/reports/detailed/security     # Security events
```

### AI & Chatbot
```
POST   /api/ai/chatbot/message     # Send message to chatbot
POST   /api/ai/chatbot/log         # Log conversation
```

### Utilities
```
GET    /health                     # Health check
GET    /metrics                    # Prometheus metrics
GET    /api/sitios                 # List sitios
GET    /api/households             # List households
GET    /api/certificate-types      # List certificate types
```

---

## 🔐 AUTHENTICATION

### Login Request
```bash
curl -X POST http://localhost:3002/api/auth/officer-login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

### Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "role_id": 1
  }
}
```

### Using Token
```bash
curl -X GET http://localhost:3002/api/residents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 💾 DATABASE SCHEMA QUICK REFERENCE

### Key Tables
- `users` - User accounts and authentication
- `residents` - Resident information
- `households` - Household groupings
- `sitios` - Geographic divisions
- `blotter` - Incident reports
- `certificates_log` - Issued certificates
- `vulnerabilities` - Resident vulnerability data
- `notifications` - System notifications
- `login_attempts` - Security tracking

### Important Relationships
```
sitios (1) -> (N) households (1) -> (N) residents
residents (1) -> (N) certificates_log
residents (1) -> (1) vulnerabilities
residents (1) -> (N) blotter (as respondent)
users (1) -> (1) residents (optional link)
```

---

## 🛠️ COMMON DEVELOPMENT TASKS

### Start Development Server
```bash
cd server
npm run dev  # Starts with nodemon
```

### Run Tests
```bash
cd server
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

### Database Operations
```bash
# Run migrations
npx knex migrate:latest

# Rollback migration
npx knex migrate:rollback

# Run seeds
npx knex seed:run

# Create new migration
npx knex migrate:make migration_name
```

### Code Quality
```bash
# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check

# Both
npm run lint:fix:format
```

### Security Audit
```bash
npm audit
npm run security-audit
npm run security-check
```

---

## 🐛 DEBUGGING

### Check Logs
```bash
# PM2 logs
pm2 logs clearpass-api

# Application logs
tail -f server/logs/combined.log
tail -f server/logs/error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Debugging
```bash
# Connect to MySQL
mysql -u clearpass -p barangay_management

# Check tables
SHOW TABLES;

# Check recent entries
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
SELECT * FROM residents ORDER BY created_at DESC LIMIT 10;
```

### API Debugging
```bash
# Test health endpoint
curl http://localhost:3002/health

# Test with verbose output
curl -v http://localhost:3002/api/residents \
  -H "Authorization: Bearer TOKEN"

# Check what's listening on port
sudo netstat -tulpn | grep 3002
```

---

## 🔧 CONFIGURATION FILES

### Environment Variables (.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=barangay_management
DB_PORT=3306
SERVER_PORT=3002
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### PM2 Ecosystem (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'clearpass-api',
    script: './index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production' }
  }]
};
```

### Knex Configuration (knexfile.js)
```javascript
module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    }
  }
};
```

---

## 📊 MONITORING & METRICS

### Health Check Response
```json
{
  "status": "healthy",
  "service": "Barangay Management API",
  "timestamp": "2025-01-12T10:30:00.000Z",
  "port": 3002
}
```

### Prometheus Metrics
```
http_requests_total
http_request_duration_seconds
database_query_duration_seconds
certificate_issuance_total
application_errors_total
```

### PM2 Monitoring
```bash
pm2 monit              # Real-time monitoring
pm2 status             # Status overview
pm2 describe app-name  # Detailed info
```

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue: "Database connection failed"
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check credentials
cat server/.env | grep DB_

# Test connection
mysql -u clearpass -p barangay_management
```

### Issue: "Port 3002 already in use"
```bash
# Find process using port
sudo lsof -i :3002

# Kill process
kill -9 PID

# Or use different port in .env
SERVER_PORT=3003
```

### Issue: "JWT token invalid"
```bash
# Check JWT_SECRET is set
cat server/.env | grep JWT_SECRET

# Verify token format
# Should be: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Issue: "CORS error"
```bash
# Check CORS_ORIGIN in .env
cat server/.env | grep CORS_ORIGIN

# Verify frontend URL matches
# Development: http://localhost:5173
# Production: https://your-domain.com
```

---

## 📝 CODE SNIPPETS

### Create New Resident
```javascript
const newResident = {
  household_id: 'H-123',
  first_name: 'Juan',
  last_name: 'Dela Cruz',
  birthdate: '1990-01-01',
  gender: 'Male',
  civil_status: 'Single',
  mobile_number: '09171234567',
  date_arrival: '2025-01-01'
};

const response = await axios.post('/api/residents', newResident, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Issue Certificate
```javascript
const certificate = {
  resident_id: 'RES-123456',
  certificate_type_id: 1,
  purpose: 'Employment'
};

const response = await axios.post('/api/certificates', certificate, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### File Blotter Report
```javascript
const blotter = {
  Complainant_Details: {
    name: 'Juan Dela Cruz',
    address: 'Batia Proper'
  },
  Incident_Type: 'Noise Complaint',
  Narrative: 'Loud music at 2 AM',
  DateTime_Incident: '2025-01-12 02:00:00',
  Location_Sitio: 'Batia Proper'
};

const response = await axios.post('/api/blotter', blotter, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## 🔗 USEFUL LINKS

- **GitHub Repository:** [Your Repo URL]
- **API Documentation:** http://localhost:3002/api-docs
- **Health Check:** http://localhost:3002/health
- **Metrics:** http://localhost:3002/metrics
- **Frontend:** http://localhost:5173 (dev)

---

## 📞 SUPPORT

### Development Issues
- Check logs first: `pm2 logs clearpass-api`
- Review error messages carefully
- Test with curl/Postman before blaming code
- Check environment variables

### Production Issues
- Check health endpoint
- Review PM2 status
- Check Nginx logs
- Verify SSL certificates
- Check firewall rules

### Emergency Contacts
- System Admin: [Configure]
- Database Admin: [Configure]
- DevOps Team: [Configure]

---

## 🎓 BEST PRACTICES

### Security
- ✅ Never commit .env files
- ✅ Use strong JWT secrets (64+ chars)
- ✅ Rotate secrets regularly
- ✅ Keep dependencies updated
- ✅ Use HTTPS in production
- ✅ Enable rate limiting
- ✅ Sanitize all inputs

### Performance
- ✅ Use database connection pooling
- ✅ Implement caching where appropriate
- ✅ Optimize database queries
- ✅ Use PM2 cluster mode
- ✅ Enable gzip compression
- ✅ Monitor memory usage

### Code Quality
- ✅ Follow ESLint rules
- ✅ Write tests for critical paths
- ✅ Use meaningful variable names
- ✅ Comment complex logic
- ✅ Keep functions small and focused
- ✅ Handle errors properly

---

**Quick Reference Version:** 1.0.1  
**Last Updated:** January 12, 2025  
**Maintained By:** Development Team

---

*Keep this guide handy for quick lookups during development and troubleshooting!*
