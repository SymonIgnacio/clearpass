# ClearPass System - Quick Start Guide

## ✅ System Status: OPERATIONAL

All components validated and ready to run.

---

## 🚀 Starting the System

### Start Server
```bash
cd server
npm run dev
```
Server runs on: `http://localhost:3002`

### Start Client
```bash
cd client
npm run dev
```
Client runs on: `http://localhost:5173`

---

## 👥 User Roles & Access

### ROLE 1: IT Admin (ID: 5)
**Purpose**: System & technical authority
**Access**: Full system control, no operational transactions

**Endpoints**:
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/reports/users` - User reports
- `GET /api/admin/reports/blotter` - Blotter reports
- `GET /api/admin/reports/certificates` - Certificate reports
- `GET /api/users` - All users management
- `GET /api/admin/logs` - System logs (to implement)

---

### ROLE 2: Barangay Captain (ID: 2)
**Purpose**: Executive oversight (READ ONLY)
**Access**: View all data, no modifications

**Endpoints**:
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/residents` - View residents
- `GET /api/blotter` - View blotter cases
- `GET /api/certificates` - View certificates
- `GET /api/admin/reports/*` - All reports

---

### ROLE 3: Barangay Secretary (ID: 3)
**Purpose**: Primary administrative authority
**Access**: Resident validation, beneficiary approval, oversight

**Endpoints**:
- `GET /api/residents` - View residents
- `POST /api/residents` - Register residents
- `PUT /api/residents/:id` - Update residents
- `DELETE /api/residents/:id` - Archive residents
- `GET /api/blotter` - View blotter (oversight only)
- `GET /api/certificates` - View certificates
- `POST /api/certificates` - Issue certificates
- `GET /api/admin/reports/*` - All reports

---

### ROLE 4: Clerk (ID: 4)
**Purpose**: Process certificates using validated data
**Access**: Certificate processing, resident verification (READ ONLY)

**Endpoints**:
- `GET /api/residents` - View residents (read-only)
- `GET /api/certificates` - View certificates
- `POST /api/certificates` - Generate certificates
- `GET /api/documents` - View document requests
- `POST /api/documents` - Process documents
- `GET /api/notifications/my` - View notifications

---

### ROLE 5: Blotter Officer (ID: 6)
**Purpose**: Sole authority for blotter operations
**Access**: Full blotter management

**Endpoints**:
- `GET /api/blotter` - View all cases
- `POST /api/blotter` - Create new case
- `PUT /api/blotter/:caseNumber` - Update case
- `DELETE /api/blotter/:caseNumber` - Delete case
- `GET /api/admin/reports/blotter` - Blotter reports
- `GET /api/notifications/my` - View notifications

---

### ROLE 6: Resident (ID: 12)
**Purpose**: Self-service portal
**Access**: Own data, request services, file complaints

**Endpoints**:
- `POST /api/residents/register` - Self-registration (to implement)
- `GET /api/residents/me` - View own profile
- `PUT /api/residents/me` - Update own profile
- `POST /api/blotter/file-online` - File blotter complaint
- `POST /api/documents/requests` - Request certificates (to implement)
- `GET /api/documents/requests/my` - View own requests (to implement)
- `GET /api/announcements` - View announcements
- `GET /api/notifications/my` - View notifications

---

## 🔐 Authentication

### Login
```
POST /api/auth/login
Body: { username, password }
Response: { token, user }
```

### Using Token
```
Headers: { Authorization: "Bearer <token>" }
```

---

## 📊 Database Info

- **Database**: barangay_management
- **Users**: 8
- **Residents**: 53
- **Blotter Cases**: 613
- **Certificates**: 160

---

## 🛠️ System Commands

### Health Check
```bash
cd server
node health-check.js
```

### Run Migrations
```bash
cd server
npx knex migrate:latest
```

### Run Seeds
```bash
cd server
npx knex seed:run
```

---

## ⚠️ Missing Features (To Implement)

### High Priority
1. **Resident Self-Registration** - `/api/residents/register`
2. **Document Request System** - `/api/documents/requests`
3. **Request History** - `/api/documents/requests/my`

### Medium Priority
4. **System Logs** - `/api/admin/logs`
5. **Backup/Restore** - `/api/admin/backup`
6. **Hearing Attendance** - `/api/blotter/attendance`

---

## 📝 Notes

- Server Port: 3002
- Client Port: 5173
- All routes require authentication except `/api/auth/login`
- Role-based access control enforced on all endpoints
- JWT tokens expire in 24 hours

---

## 🔍 Testing

Test authentication:
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

Test health:
```bash
curl http://localhost:3002/health
```

---

**System validated and ready to run!** ✅
