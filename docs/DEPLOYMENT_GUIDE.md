# ClearPass Deployment Guide

**Target:** Production deployment  
**Last Updated:** January 2026

---

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security audit completed
- [ ] Backup created
- [ ] SSL certificates ready

---

## Production Environment

### Required Variables
```bash
NODE_ENV=production
DB_HOST=<production-host>
DB_USER=<db-user>
DB_PASSWORD=<strong-password>
DB_NAME=clearpass
JWT_SECRET=<128-char-secret>
CLIENT_URL=https://yourdomain.com
```

### Security Settings
```bash
# Change all default passwords
# Rotate JWT secret every 90 days
# Enable HTTPS/SSL
# Configure firewall rules
# Set up database backups
```

---

## Deployment Options

### Option 1: Traditional Server

```bash
# Build frontend
npm run build

# Start with PM2
npm install -g pm2
pm2 start server/index.js --name clearpass-api
pm2 startup
pm2 save
```

### Option 2: Docker

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Configure reverse proxy (nginx)
```

---

## CORS Configuration

### Production CORS
```javascript
// server/index.js
const corsOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
```

---

## Database Migration

```bash
# Production migration
cd server
NODE_ENV=production npx knex migrate:latest

# Backup before migration
mysqldump -u root -p clearpass > backup_$(date +%Y%m%d).sql
```

---

## Health Monitoring

```bash
# Health check endpoint
curl https://yourdomain.com/health

# Monitor logs
tail -f server/logs/error.log
tail -f server/logs/combined.log
```

---

## Process Management (PM2)
For production, use PM2 to manage processes:
```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## Database Backups
A backup script is provided in `scripts/maintenance/backup_db.js`.
Schedule it using Windows Task Scheduler or Cron:
```bash
node scripts/maintenance/backup_db.js
```

## Security & Performance
- **Firewall:** Ensure ports 3002 (API) and 5173 (Client) are allowed.
- **SSL:** Use Nginx or Apache as a reverse proxy with SSL certificates.
- **Load Balancing:** PM2 runs in cluster mode (`instances: 'max'`) by default.

---

## Monitoring

- Check `/health` endpoint every 60 seconds
- Monitor error logs daily
- Review audit logs weekly
- Track slow queries (>1000ms)
- Monitor disk space
- Check database connections

---

## Rollback Plan

```bash
# Rollback migration
cd server
npx knex migrate:rollback

# Restore database
mysql -u root -p clearpass < backup_previous.sql

# Restart services
pm2 restart clearpass-api
```
