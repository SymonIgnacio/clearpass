# ClearPass Setup Guide

**Version:** 3.0.0  
**Last Updated:** January 2026  
**Setup Time:** 15-20 minutes

---

## Prerequisites

- Node.js 18+
- MySQL 8.0+
- Python 3.11+ (for AI service)
- Git

**Verify:**
```bash
node --version    # v18+
mysql --version   # 8.0+
python --version  # 3.11+
```

---

## Quick Start (15 minutes)

### 1. Clone & Install (3 min)
```bash
git clone <repository-url>
cd clearpass
npm run install:all
```

### 2. Database Setup (3 min)
```bash
# Start MySQL (XAMPP or local)
mysql -u root -p -e "CREATE DATABASE clearpass;"

# Run migrations
cd server
npx knex migrate:latest
npx knex seed:run
cd ..
```

### 3. Environment Configuration (2 min)
```bash
# Server
cp server/.env.example server/.env
# Edit: DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET

# Client
cp client/.env.example client/.env
# Edit: VITE_API_URL
```

### 4. Start Services (5 min)
```bash
# Option A: All at once
npm run dev:all

# Option B: Individual terminals
cd server && npm start        # Terminal 1
cd client && npm run dev      # Terminal 2
cd ai_service && python smart_suggestions.py  # Terminal 3
```

### 5. Verify (2 min)
- Frontend: http://localhost:5173
- Backend: http://localhost:3001/health
- AI Service: http://localhost:5000/health

---

## Environment Variables

### Server (.env)
```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=clearpass
JWT_SECRET=<128-char-secret>
PORT=3001
```

### Client (.env)
```bash
VITE_API_URL=http://localhost:3001
```

---

## Default Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Captain | captain | captain |
| Secretary | secretary | secretary |
| Clerk | clerk | clerk |

---

## Troubleshooting

**Database connection failed:**
```bash
# Check MySQL running
# Verify credentials in server/.env
mysql -u root -p -e "SELECT 1"
```

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill
```

**Migration errors:**
```bash
cd server
npx knex migrate:rollback
npx knex migrate:latest
```

---

## Docker Setup (Alternative)

```bash
# Build and start
docker-compose up --build

# Services available at:
# - Frontend: http://localhost
# - Backend: http://localhost:3001
# - Database: localhost:3306
```

---

## Next Steps

1. Login with default account
2. Change default passwords
3. Configure production settings
4. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
