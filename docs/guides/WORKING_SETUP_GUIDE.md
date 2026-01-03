# 🚀 Barangay Management System - MODERNIZED Setup Guide (Docker + Account Hierarchy)

**Version:** 3.0.0 (Modernized - Docker + Hierarchy + Security)
**Last Updated:** December 1, 2025
**Status:** ✅ FULLY MODERNIZED & SECURE
**Setup Time:** ~15 minutes (with Docker) | ~25 minutes (manual)

---

## 🎯 WHAT'S NEW IN VERSION 3.0.0

### ✅ **DevOps & Quality Foundation**
- **🐳 Docker Containerization**: Multi-stage builds with security best practices
- **🔧 Code Quality**: Prettier + ESLint integration for automated formatting
- **📦 Orchestration**: docker-compose.yml with MySQL, health checks, networking

### ✅ **Database Modernization**
- **🗄️ Knex.js Migration System**: Programmatic schema management
- **🔄 Migration Scripts**: Convert raw SQL to version-controlled migrations
- **🌱 Seed Files**: Automated data seeding with proper relationships

### ✅ **Account Hierarchy Security** ⭐ **CRITICAL FEATURE**
- **👑 Role-Based Access Control**: Super Admin → Captain → Secretary → Clerk → Tanod → Resident
- **🔗 Parent-Child Relationships**: Strict hierarchy enforcement (parent_user_id)
- **🔐 JWT Authentication**: Secure token-based auth with middleware
- **🛡️ Hierarchy Middleware**: Checks `current_user.id` is parent of target data owner

### ✅ **Security Enhancements**
- **🚫 No More Public APIs**: All endpoints now require authentication
- **👁️ Data Access Control**: Users can only see data from subordinates
- **🔒 Protected Resources**: Certificates, residents, blotter cases secured
- **📊 Audit Trails**: Complete logging of user actions

---

## 📋 Prerequisites Check

### Required Software:
- ✅ **Docker Desktop** - Download from https://docker.com/ (includes docker-compose)
- ✅ **Node.js 18+** - Download from https://nodejs.org/ (for local development)
- ✅ **Python 3.11+** - Download from https://python.org/ (for local development)
- ✅ **VS Code** - Your current editor (recommended)
- ✅ **Git** - For version control

### Quick Verification:
```bash
# Check Docker
docker --version          # Should show Docker version
docker-compose --version  # Should show compose version

# Check Node.js (for local dev)
node --version           # Should show v18.x.x or higher

# Check Python (for local dev)
python --version         # Should show Python 3.11.x or higher
```

---

## 🚀 QUICK START WITH DOCKER (Recommended - 5 minutes)

### Option A: One-Command Setup
```bash
# Clone/build/start everything
git clone <your-repo>
cd barangay-management-system
docker-compose up --build
```

### Option B: Step-by-Step Docker Setup

#### 1. Environment Setup (1 minute)
```bash
# Create .env file for Docker (optional - defaults will work)
cp .env.example .env
```

#### 2. Build and Start Services (4 minutes)
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Option C: Development Mode (For coding/debugging)
```bash
# Start only database in background
docker-compose up -d db

# Start services individually for development
cd server && npm run dev    # Backend with hot reload
cd client && npm run dev    # Frontend with hot reload
cd ai_service && python smart_suggestions.py  # AI service
```

---

## 🏗️ MANUAL SETUP (Advanced Users)

### Step 1: Database Setup (3 minutes)
```bash
# Option 1: Docker MySQL (Recommended)
docker-compose up -d db

# Option 2: Local MySQL (XAMPP/phpMyAdmin)
# 1. Start XAMPP MySQL
# 2. Create database: barangay_management
# 3. Import: database/COMPLETE_BARANGAY_DATABASE.sql
```

### Step 2: Run Database Migrations (2 minutes)
```bash
cd server

# Install dependencies
npm install

# Run migrations (creates all tables)
npx knex migrate:latest

# Run seeds (populates initial data + hierarchy)
npx knex seed:run

cd ..
```

### Step 3: Install Dependencies (5 minutes)
```bash
# Root dependencies
npm install

# Client dependencies
cd client && npm install && cd ..

# AI service dependencies
cd ai_service && pip install -r requirements.txt && cd ..
```

### Step 4: Code Quality Setup (2 minutes)
```bash
# Format and lint server code
cd server && npm run lint:fix:format && cd ..

# Format and lint client code
cd client && npm run lint:fix:format && cd ..
```

### Step 5: Start Services (5 minutes)
```bash
# Terminal 1: Database (if not using Docker)
# Start MySQL service

# Terminal 2: AI Service
cd ai_service && python smart_suggestions.py

# Terminal 3: Backend Server
cd server && npm start

# Terminal 4: Frontend Client
cd client && npm run dev
```

---

## 🔐 ACCOUNT HIERARCHY SYSTEM

### 🎯 How It Works

The system implements a **strict organizational hierarchy** where each user has a `parent_user_id` that establishes their supervisor. Access control is enforced through middleware that checks if the current user is authorized to access target data.

```
Super Admin (ID: 4)
├── Captain (ID: 1) [parent_user_id: 4]
│   ├── Secretary (ID: 2) [parent_user_id: 1]
│   │   └── Clerk (ID: 3) [parent_user_id: 2]
│   └── Captain Sub (ID: 5) [parent_user_id: 4]
└── Secretary Sub (ID: 6) [parent_user_id: 1]
```

### 👥 Default User Accounts

| Role | Username | Password | Hierarchy Level | Permissions |
|------|----------|----------|-----------------|-------------|
| Super Admin | `superadmin` | `superadmin123` | 100 | Full System Access |
| Barangay Captain | `captain` | `captain` | 80 | Approve Certificates, Manage Data |
| Barangay Secretary | `secretary` | `secretary` | 60 | Issue Certificates, View Reports |
| Barangay Clerk | `clerk` | `clerk` | 40 | Assist with Certificates, Basic View |
| Captain Sub | `captain_sub` | `captain123` | 80 | Same as Captain |
| Secretary Sub | `secretary_sub` | `secretary123` | 60 | Same as Secretary |
| Clerk Sub | `clerk_sub` | `clerk123` | 40 | Same as Clerk |

### 🔑 Authentication Flow

1. **Login** → JWT token issued with hierarchy info
2. **API Access** → Token verified + role checked
3. **Data Access** → Hierarchy validated (parent of data owner)
4. **Actions** → Permission-based authorization

### 🛡️ Security Features

- **JWT Tokens**: Secure authentication with 8-hour expiration
- **Role-Based Access**: 6-tier permission system
- **Hierarchy Enforcement**: Parent-child relationship validation
- **Audit Logging**: Complete action tracking
- **Input Validation**: SQL injection prevention
- **Rate Limiting**: DDoS protection
- **CORS Protection**: Cross-origin security

---

## ✅ Step 5: Verify Installation (2 minutes)

### Docker Verification:
```bash
# Check all containers are running
docker-compose ps

# Check service health
curl http://localhost/health          # Frontend (port 80)
curl http://localhost:3001/health     # Backend API
curl http://localhost:5000/health     # AI Service
```

### Manual Verification:
- **Frontend:** http://localhost:5173 ✅ (React dashboard with login)
- **Backend API:** http://localhost:3001/health ✅
- **AI Service:** http://localhost:5000/health ✅
- **API Docs:** http://localhost:3001/api-docs ✅ (requires auth now)

### Test Hierarchy Security:
```bash
# 1. Login as captain
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"captain","password":"captain"}'

# 2. Use returned token to access protected endpoints
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/residents

# 3. Try accessing subordinate data (should work)
# 4. Try accessing superior data (should fail)
```

---

## 📚 Available Scripts

### Docker Commands:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Clean restart
docker-compose down && docker-compose up --build
```

### Development Scripts:
```bash
# Server (backend)
cd server
npm run dev              # Hot reload development
npm start                # Production start
npm run lint:fix:format  # Code quality
npx knex migrate:latest  # Run migrations
npx knex seed:run        # Run seeds

# Client (frontend)
cd client
npm run dev              # Development server
npm run build            # Production build
npm run lint:fix:format  # Code quality

# AI Service
cd ai_service
python smart_suggestions.py  # Start service
pip install -r requirements.txt  # Install deps
```

### Quality Assurance:
```bash
# Run all tests
npm test

# Format code
npm run format

# Lint code
npm run lint

# Combined quality check
npm run lint:fix:format
```

---

## 🏗️ System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Frontend  │    │   Node.js API    │    │ Python AI Engine│
│   (Docker:80)    │◄──►│   (Docker:3001)  │◄──►│   (Docker:5000) │
│                  │    │                  │    │                 │
│ • Login/Auth     │    │ • JWT Auth       │    │ • ML Algorithms │
│ • Hierarchy UI   │    │ • Hierarchy MW   │    │ • Decision Supp │
│ • Protected Routes│    │ • Knex Migrations│    │ • Chatbot       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MySQL Database │
                    │   (Docker:3306)  │
                    │                  │
                    │ • Users + Roles  │
                    │ • Hierarchy      │
                    │ • Residents      │
                    │ • Certificates   │
                    │ • Audit Logs     │
                    └─────────────────┘
```

### Key Security Features:
- **🔐 Account Hierarchy**: Parent-child user relationships
- **🛡️ JWT Authentication**: Secure token-based auth
- **👑 Role Permissions**: 6-tier access control system
- **🔗 Data Ownership**: Users can only access subordinate data
- **📊 Audit Trails**: Complete logging of all actions
- **🚫 Public API Lockdown**: All endpoints require authentication

---

## 🔧 Troubleshooting Guide

### Docker Issues:
```bash
# Check Docker is running
docker info

# Clean up containers
docker-compose down --volumes --remove-orphans

# View detailed logs
docker-compose logs [service_name]

# Rebuild specific service
docker-compose up --build [service_name]
```

### Database Issues:
```bash
# Reset database
docker-compose exec db mysql -u root -p -e "DROP DATABASE barangay_management; CREATE DATABASE barangay_management;"

# Run migrations manually
docker-compose exec server npm run knex migrate:latest
docker-compose exec server npm run knex seed:run
```

### Authentication Issues:
```bash
# Check JWT secret in environment
docker-compose exec server env | grep JWT

# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"superadmin123"}'
```

### Permission Issues:
- **Can't access data?** Check if your user is the parent of the data owner
- **Login fails?** Verify username/password and account is active
- **API returns 403?** Check hierarchy relationships and role permissions

---

## 🚀 Production Deployment

### Docker Production Setup:
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy with proper environment
docker-compose -f docker-compose.prod.yml up -d

# Set up reverse proxy (nginx/traefik)
# Configure SSL certificates
# Set up monitoring (Prometheus/Grafana)
```

### Environment Variables for Production:
```env
NODE_ENV=production
JWT_SECRET=your-very-secure-random-jwt-secret-here
DB_PASSWORD=strong-production-password
CLIENT_URL=https://yourdomain.com
```

### Security Checklist:
- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET (64+ characters)
- [ ] Configure HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Set up monitoring/alerts
- [ ] Configure log rotation

---

## 🎯 Success Indicators

**System is working when:**
- ✅ **Docker containers running:** `docker-compose ps` shows all healthy
- ✅ **Frontend accessible:** http://localhost (login page loads)
- ✅ **Authentication working:** Can login with provided credentials
- ✅ **Hierarchy enforced:** Subordinates can't access superior data
- ✅ **API protected:** All endpoints require valid JWT tokens
- ✅ **Database migrated:** All tables created via Knex migrations
- ✅ **Code formatted:** Prettier/ESLint passes without errors

**Setup Time:** ~15 minutes (Docker) | ~25 minutes (Manual)
**Status:** ✅ MODERNIZED, SECURE, AND PRODUCTION-READY

---

## 📞 Support & Documentation

### Quick Health Checks:
```bash
# All services health
curl http://localhost/health
curl http://localhost:3001/health
curl http://localhost:5000/health

# Database connection
docker-compose exec db mysql -u root -p -e "SHOW DATABASES;"

# Migration status
docker-compose exec server npx knex migrate:status
```

### Documentation Files:
- `API_DOCUMENTATION.md` - Complete API reference
- `SECURITY_AUDIT.md` - Security assessment
- `docker-compose.yml` - Service orchestration
- `server/migrations/` - Database schema evolution
- `server/seeds/` - Initial data setup

### Key Files to Know:
- `server/authController.js` - Authentication logic
- `server/authMiddleware.js` - Security middleware
- `server/knexfile.js` - Database configuration
- `docker-compose.yml` - Service definitions

---

**🎯 This modernized system provides enterprise-grade security with Docker containerization, automated code quality, and strict account hierarchy enforcement. The setup is designed for both development and production use.**
