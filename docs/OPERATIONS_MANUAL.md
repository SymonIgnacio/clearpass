# Operations Manual

## 1. System Overview
ClearPass is a Barangay Management System running on Node.js (Server) and React (Client).

## 2. Daily Operations
### Checking System Status
- **Health Check:** `curl http://localhost:3002/api/health`
- **Logs:** Check PM2 logs: `pm2 logs clearpass-server`

### Database Backups
Backups are stored in `database/backups/`.
- **Manual Backup:** `node scripts/maintenance/backup_db.js`
- **Automated Backup:** Configure a cron job to run the above script daily.

## 3. Maintenance
### Log Rotation
Logs are stored in the database (`audit_logs` table).
- **Pruning:** Run `DELETE FROM audit_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);` periodically.

### Updates
1. `git pull`
2. `npm install` (in root, server, and client)
3. `npm run build` (client)
4. `pm2 restart ecosystem.config.cjs`

## 4. Troubleshooting
### Common Issues
- **Database Connection Failed:** Check `.env` credentials and ensure MySQL is running.
- **High Latency:** Check server load with `pm2 monit`.
- **EADDRINUSE:** Kill the process on port 3002 (`netstat -ano | findstr :3002`).

## 5. Security Protocols
- **Incident Response:** If a breach is suspected, rotate `JWT_SECRET` in `.env` and restart the server to invalidate all tokens.
- **Audit:** Regularly review `audit_logs` for suspicious activity.
