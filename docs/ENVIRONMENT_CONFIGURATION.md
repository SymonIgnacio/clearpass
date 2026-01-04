# Environment Configuration Guide

## Overview
This document outlines all environment variables required for the ClearPass system to function properly.

## Server Environment Variables

### Required Variables
These variables MUST be set for the system to function:

```bash
# Database Configuration
DB_HOST=localhost                    # Database server hostname
DB_USER=root                        # Database username
DB_PASSWORD=your_password_here      # Database password
DB_NAME=barangay_management         # Database name
DB_PORT=3306                        # Database port (default: 3306)

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h                  # Token expiration time
```

### Optional Variables
These variables have default values but can be customized:

```bash
# Server Configuration
SERVER_PORT=3001                    # Server port (default: 3001)
NODE_ENV=development                # Environment: development|production

# AI Service Configuration
AI_SERVICE_URL=http://localhost:5001  # AI service endpoint
AI_SERVICE_ENABLED=true             # Enable/disable AI features

# Security Configuration
RATE_LIMIT_WINDOW=15                # Rate limit window in minutes
RATE_LIMIT_MAX=100                  # Max requests per window
AUTH_RATE_LIMIT_MAX=5               # Max auth attempts per window

# File Upload Configuration
MAX_FILE_SIZE=10485760              # Max file size in bytes (10MB)
UPLOAD_PATH=./uploads               # File upload directory

# Email Configuration (if implemented)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Client Environment Variables

### Required Variables
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api  # Backend API URL

# WebSocket Configuration (optional)
VITE_WS_URL=ws://localhost:3001             # WebSocket URL for real-time features
```

### Optional Variables
```bash
# Development Configuration
VITE_DEBUG=false                    # Enable debug mode
VITE_LOG_LEVEL=info                 # Logging level: error|warn|info|debug

# Feature Flags
VITE_ENABLE_AI_FEATURES=true        # Enable AI features in UI
VITE_ENABLE_ANALYTICS=true          # Enable analytics dashboard
```

## AI Service Environment Variables

### Required Variables
```bash
# Service Configuration
PORT=5001                           # AI service port
DEBUG=false                         # Debug mode

# Database Connection (for AI data)
DATABASE_URL=mysql://user:pass@localhost:3306/barangay_management
```

## Environment Setup Instructions

### Development Setup

1. **Server Environment**:
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your database credentials
   ```

2. **Client Environment**:
   ```bash
   cd client
   cp .env.example .env
   # Verify API URL matches server port
   ```

3. **AI Service Environment**:
   ```bash
   cd ai_service
   cp .env.example .env
   # Configure AI service settings
   ```

### Production Setup

1. **Security Considerations**:
   - Use strong, unique JWT_SECRET (minimum 32 characters)
   - Set NODE_ENV=production
   - Use HTTPS URLs for all API endpoints
   - Enable proper database authentication

2. **Performance Optimization**:
   - Adjust rate limiting based on expected load
   - Configure appropriate file size limits
   - Set up database connection pooling

3. **Monitoring**:
   - Enable logging in production
   - Set up health check endpoints
   - Configure error reporting

## Environment Validation

The system includes automatic environment validation:

### Server Validation
- Checks for required database variables
- Validates JWT secret presence
- Verifies database connectivity on startup

### Client Validation
- Validates API URL format
- Checks for required configuration

## Common Issues and Solutions

### Database Connection Issues
```bash
# Check database credentials
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=barangay_management

# Verify database exists
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS barangay_management;"
```

### Port Conflicts
```bash
# If port 3001 is in use, change both server and client:
# Server: SERVER_PORT=3002
# Client: VITE_API_BASE_URL=http://localhost:3002/api
```

### JWT Issues
```bash
# Generate secure JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Environment Templates

### Development Template (.env.development)
```bash
# Development Environment
NODE_ENV=development
SERVER_PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=barangay_management_dev
JWT_SECRET=dev_secret_change_in_production
AI_SERVICE_ENABLED=true
```

### Production Template (.env.production)
```bash
# Production Environment
NODE_ENV=production
SERVER_PORT=3001
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_secure_password
DB_NAME=barangay_management
JWT_SECRET=your_super_secure_32_char_secret
AI_SERVICE_ENABLED=true
RATE_LIMIT_MAX=50
```

### Testing Template (.env.test)
```bash
# Testing Environment
NODE_ENV=test
SERVER_PORT=3003
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=barangay_management_test
JWT_SECRET=test_secret_for_testing_only
AI_SERVICE_ENABLED=false
```