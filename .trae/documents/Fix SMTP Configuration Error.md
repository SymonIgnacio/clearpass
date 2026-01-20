# Fix SMTP Configuration Error

The error `SMTP not configured` happens because your **backend server** is reading `server/.env`, which is missing the email credentials. You added them to the root `.env`, but the server isn't looking there.

## Plan

### 1. Update `server/.env`
I will copy the SMTP configuration from the root `.env` into `server/.env`.

**Add these lines:**
```env
# Email Service Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=themisbioprofiling@gmail.com
SMTP_PASS=sltl bxdo qgck ksyv
MFA_ENFORCED=true
MFA_PENDING_JWT_EXPIRES_IN=15m
```

## Why this happened?
The project has two `.env` files:
1.  `c:\xampp\htdocs\clearpass\.env` (Root - where you added credentials)
2.  `c:\xampp\htdocs\clearpass\server\.env` (Server - where the code actually looks)

I will fix this sync issue now.
