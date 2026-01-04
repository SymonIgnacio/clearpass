# 🚀 CLEARPASS DEPLOYMENT GUIDE

**Version:** 1.0.1  
**Last Updated:** January 12, 2025  
**Status:** Production Ready

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### System Requirements
- [ ] Node.js 18.0.0+ installed
- [ ] MySQL 8.0+ installed and running
- [ ] npm 9.0.0+ installed
- [ ] Git installed
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Nginx or Apache (for reverse proxy)
- [ ] SSL certificate (Let's Encrypt or commercial)

### Access Requirements
- [ ] Database credentials
- [ ] Server SSH access
- [ ] Domain name configured
- [ ] DNS records updated
- [ ] Firewall rules configured

---

## 🔧 STEP 1: SERVER SETUP

### 1.1 Update System
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git nginx certbot python3-certbot-nginx
```

### 1.2 Install Node.js 18 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

### 1.3 Install MySQL 8.0
```bash
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Create database
sudo mysql -u root -p
```

```sql
CREATE DATABASE barangay_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'clearpass'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON barangay_management.* TO 'clearpass'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 📦 STEP 2: APPLICATION DEPLOYMENT

### 2.1 Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/your-org/clearpass.git
cd clearpass
sudo chown -R $USER:$USER /var/www/clearpass
```

### 2.2 Install Dependencies
```bash
# Server dependencies
cd server
npm install --production

# Client dependencies
cd ../client
npm install
```

### 2.3 Configure Environment Variables
```bash
cd /var/www/clearpass/server
cp .env.example .env
nano .env
```

**Production .env Configuration:**
```env
# Database Configuration
DB_HOST=localhost
DB_USER=clearpass
DB_PASSWORD=your_secure_password_here
DB_NAME=barangay_management
DB_PORT=3306

# Server Configuration
SERVER_PORT=3002
NODE_ENV=production
CLIENT_URL=https://your-domain.com

# JWT Configuration (CRITICAL: Generate strong secret)
JWT_SECRET=your_64_character_random_secret_key_here_use_crypto_randomBytes
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# AI Service (Optional)
AI_SERVICE_URL=http://localhost:5001

# Logging
LOG_LEVEL=info
LOG_RETENTION_DAYS=90

# Certificate Signatory
CERTIFICATE_SIGNATORY_CAPTAIN=Captain Juan Dela Cruz
CERTIFICATE_SIGNATORY_SECRETARY=Secretary Maria Santos
CERTIFICATE_LOCATION=Barangay Batia, Bocaue, Bulacan
```

**Generate Strong JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.4 Run Database Migrations
```bash
cd /var/www/clearpass/server

# Run migrations
npx knex migrate:latest

# Seed initial data
npx knex seed:run
```

### 2.5 Build Frontend
```bash
cd /var/www/clearpass/client

# Create production .env
cp .env.example .env.production
nano .env.production
```

```env
VITE_API_BASE_URL=https://api.your-domain.com/api
NODE_ENV=production
```

```bash
# Build for production
npm run build

# Output will be in client/dist/
```

---

## 🌐 STEP 3: NGINX CONFIGURATION

### 3.1 Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/clearpass
```

```nginx
# API Server Configuration
server {
    listen 80;
    server_name api.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL Configuration (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # API Proxy
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket Support
    location /ws/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:3002/health;
        access_log off;
    }
}

# Frontend Configuration
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/clearpass/client/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3.2 Enable Site and Get SSL
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/clearpass /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Get SSL certificates
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔄 STEP 4: PM2 PROCESS MANAGEMENT

### 4.1 Create PM2 Ecosystem File
```bash
cd /var/www/clearpass/server
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'clearpass-api',
    script: './index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 4.2 Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the command it outputs

# Monitor
pm2 monit
pm2 logs clearpass-api
```

### 4.3 PM2 Commands Reference
```bash
# Status
pm2 status
pm2 list

# Logs
pm2 logs clearpass-api
pm2 logs clearpass-api --lines 100

# Restart
pm2 restart clearpass-api
pm2 reload clearpass-api  # Zero-downtime reload

# Stop
pm2 stop clearpass-api

# Delete
pm2 delete clearpass-api

# Monitor
pm2 monit
pm2 plus  # Advanced monitoring (requires signup)
```

---

## 🔒 STEP 5: SECURITY HARDENING

### 5.1 Firewall Configuration
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MySQL (only from localhost)
sudo ufw deny 3306/tcp

# Check status
sudo ufw status
```

### 5.2 Fail2Ban Setup
```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Configure
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

```bash
# Start Fail2Ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 5.3 Secure MySQL
```bash
# Edit MySQL config
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
bind-address = 127.0.0.1
max_connections = 100
max_allowed_packet = 16M
```

```bash
# Restart MySQL
sudo systemctl restart mysql
```

---

## 📊 STEP 6: MONITORING SETUP

### 6.1 Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/clearpass
```

```
/var/www/clearpass/server/logs/*.log {
    daily
    rotate 90
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 6.2 Setup Monitoring Alerts
```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 6.3 Health Check Monitoring
```bash
# Create health check script
nano /var/www/clearpass/scripts/health-check.sh
```

```bash
#!/bin/bash
HEALTH_URL="https://api.your-domain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -ne 200 ]; then
    echo "Health check failed with status $RESPONSE"
    # Send alert (email, SMS, etc.)
    pm2 restart clearpass-api
fi
```

```bash
# Make executable
chmod +x /var/www/clearpass/scripts/health-check.sh

# Add to crontab
crontab -e
```

```cron
*/5 * * * * /var/www/clearpass/scripts/health-check.sh
```

---

## 🔄 STEP 7: BACKUP STRATEGY

### 7.1 Database Backup Script
```bash
nano /var/www/clearpass/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/clearpass"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="barangay_management"
DB_USER="clearpass"
DB_PASS="your_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

```bash
chmod +x /var/www/clearpass/scripts/backup-db.sh

# Schedule daily backups
crontab -e
```

```cron
0 2 * * * /var/www/clearpass/scripts/backup-db.sh
```

### 7.2 Application Backup
```bash
# Backup application files
tar -czf /var/backups/clearpass/app_$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='logs' \
  --exclude='.git' \
  /var/www/clearpass
```

---

## 🧪 STEP 8: POST-DEPLOYMENT TESTING

### 8.1 Health Check
```bash
curl https://api.your-domain.com/health
# Expected: {"status":"healthy",...}
```

### 8.2 API Test
```bash
# Test login
curl -X POST https://api.your-domain.com/api/auth/officer-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

### 8.3 Frontend Test
```bash
# Open in browser
https://your-domain.com

# Check console for errors
# Test login functionality
# Verify all pages load
```

### 8.4 Load Testing (Optional)
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API endpoint
ab -n 1000 -c 10 https://api.your-domain.com/health
```

---

## 🚨 TROUBLESHOOTING

### Issue: API Not Responding
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs clearpass-api --lines 50

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check port
sudo netstat -tulpn | grep 3002
```

### Issue: Database Connection Failed
```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u clearpass -p barangay_management

# Check credentials in .env
cat /var/www/clearpass/server/.env | grep DB_
```

### Issue: SSL Certificate Problems
```bash
# Renew certificates
sudo certbot renew --dry-run
sudo certbot renew

# Check certificate
sudo certbot certificates
```

### Issue: High Memory Usage
```bash
# Check PM2 memory
pm2 status

# Restart if needed
pm2 restart clearpass-api

# Check system memory
free -h
```

---

## 📞 SUPPORT & MAINTENANCE

### Regular Maintenance Tasks
- **Daily:** Check PM2 logs for errors
- **Weekly:** Review system metrics
- **Monthly:** Update dependencies
- **Quarterly:** Security audit

### Update Procedure
```bash
# 1. Backup everything
/var/www/clearpass/scripts/backup-db.sh

# 2. Pull latest code
cd /var/www/clearpass
git pull origin main

# 3. Update dependencies
cd server && npm install
cd ../client && npm install && npm run build

# 4. Run migrations
cd server && npx knex migrate:latest

# 5. Restart application
pm2 reload clearpass-api

# 6. Test
curl https://api.your-domain.com/health
```

---

## ✅ DEPLOYMENT COMPLETE

Your ClearPass system is now deployed and running in production!

### Next Steps:
1. ✅ Monitor logs for 48 hours
2. ✅ Conduct user acceptance testing
3. ✅ Train staff on system usage
4. ✅ Setup regular backups
5. ✅ Document any custom configurations

### Important URLs:
- Frontend: https://your-domain.com
- API: https://api.your-domain.com
- Health Check: https://api.your-domain.com/health
- API Docs: https://api.your-domain.com/api-docs

---

**Deployment Date:** [Fill in]  
**Deployed By:** [Fill in]  
**Version:** 1.0.1  
**Status:** ✅ Production

---

*For support, contact your system administrator.*
