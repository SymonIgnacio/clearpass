# Comprehensive System Audit Report

**Generated:** 1/13/2026, 11:30:16 PM
**Duration:** 0.15s

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 27 |
| Passed | 4 |
| Failed | 15 |
| Warnings | 0 |
| Skipped | 8 |
| Success Rate | 21.05% |

## Test Results by Category

### Infrastructure

- **Total:** 5
- **Passed:** 4
- **Failed:** 1
- **Success Rate:** 80.00%

### General

- **Total:** 1
- **Passed:** 0
- **Failed:** 1
- **Success Rate:** 0.00%

### Authentication

- **Total:** 6
- **Passed:** 0
- **Failed:** 6
- **Success Rate:** 0.00%

### Authorization

- **Total:** 5
- **Passed:** 0
- **Failed:** 5
- **Success Rate:** 0.00%

### Security

- **Total:** 2
- **Passed:** 0
- **Failed:** 2
- **Success Rate:** 0.00%

## Failed Tests

### Server Health Endpoint
- **Category:** infrastructure
- **Message:** Server not responding
- **Timestamp:** 2026-01-13T15:30:16.717Z

### Database Connection
- **Category:** general
- **Message:** connect ECONNREFUSED ::1:3306
- **Timestamp:** 2026-01-13T15:30:16.720Z

### Login with Invalid Credentials
- **Category:** authentication
- **Message:** 
- **Timestamp:** 2026-01-13T15:30:16.723Z

### Login with Missing Credentials
- **Category:** authentication
- **Message:** 
- **Timestamp:** 2026-01-13T15:30:16.725Z

### Login as admin
- **Category:** authentication
- **Message:** Authentication failed
- **Timestamp:** 2026-01-13T15:30:16.726Z

### Login as clerk
- **Category:** authentication
- **Message:** Authentication failed
- **Timestamp:** 2026-01-13T15:30:16.728Z

### Login as captain
- **Category:** authentication
- **Message:** Authentication failed
- **Timestamp:** 2026-01-13T15:30:16.729Z

### Invalid Token Rejection
- **Category:** authentication
- **Message:** 
- **Timestamp:** 2026-01-13T15:30:16.730Z

### Protected Route /api/residents
- **Category:** authorization
- **Message:** 
- **Timestamp:** 2026-01-13T15:30:16.732Z

### Protected Route /api/blotter
- **Category:** authorization
- **Message:** 
- **Timestamp:** 2026-01-13T15:30:16.735Z

### Protected Route /api/certificates
- **Category:** authorization
- **Message:** 
- **Timestamp:** 2026-01-13T15:30:16.736Z

### Protected Route /api/dashboard
- **Category:** authorization
- **Message:** 
- **Timestamp:** 2026-01-13T15:30:16.737Z

### Protected Route /api/admin/users
- **Category:** authorization
- **Message:** 
- **Timestamp:** 2026-01-13T15:30:16.738Z

### Rate Limiting Active
- **Category:** security
- **Message:** Rate limiting may not be active
- **Timestamp:** 2026-01-13T15:30:16.759Z

### CORS Headers Present
- **Category:** security
- **Message:** 
- **Timestamp:** 2026-01-13T15:30:16.760Z

