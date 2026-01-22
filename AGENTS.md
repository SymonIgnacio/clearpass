# AGENTS.md

ClearPass Barangay Management System - Agentic Coding Guidelines

---

## 1. DEVELOPMENT COMMANDS

### Quick Start
- Start all services (client + server + AI): `npm run dev:all`
- Start client only: `npm run dev` (from root) or `cd client && npm run dev`
- Start server only: `npm start` (from root) or `cd server && npm run dev`

### Build Commands
- Build production client: `npm run build` (root) or `cd client && npm run build`
- Preview production build: `npm run preview` (root) or `cd client && npm run preview`

### Linting & Formatting (ALWAYS RUN BEFORE COMMITTING)
- Lint root/server: `npm run lint` (root) or `cd server && npm run lint`
- Auto-fix server: `cd server && npm run lint:fix`
- Format server: `cd server && npm run format`
- Lint client: `cd client && npm run lint`
- Auto-fix client: `cd client && npm run lint:fix`
- Format client: `cd client && npm run format`
- Format + lint: `npm run lint:fix:format` (server) or `cd client && npm run lint:fix:format`

### Testing - ⭐ SINGLE TEST EXECUTION (CRITICAL - RUN OFTEN)
- Run ONE server test file: `cd server && npm test -- path/to/test.test.js`
- Run ONE client test file: `cd client && npm test -- path/to/test.jsx`
- Run server integration tests: `cd server && npm run test:integration`
- Watch mode for single test development: `cd server && npm test -- --watch path/to/test.test.js`

### Testing - All Tests
- Run comprehensive tests: `npm test` (from tests/ directory)
- Run with coverage: `npm run test:coverage` (root)
- Watch mode: `npm run test:watch` (root) or `cd server && npm run test:watch`
- System integration tests: `npm run test:system` (root)
- All tests including integration: `npm run test:all` (root)

### Database Operations
- Run migrations: `npm run db:migrate` (root) or `cd server && npm run db:migrate`
- Audit schema: `npm run db:audit` (root)
- Verify schema usage: `cd server && npm run db:verify-schema-usage`

### Environment
- Generate .env file: `npm run setup-env`
- Validate .env configuration: `npm run validate-env`
- Health check: `npm run health-check`

---

## 2. CODE STYLE GUIDELINES

### General Formatting (ESLint + Prettier)
- Single quotes: `'string'` (never double quotes)
- Indentation: 2 spaces (no tabs)
- Semicolons: Required at end of statements
- Line width: 100 characters max
- Trailing commas: Use ES5 style
- Arrow function parens: Avoid when possible `(x) => x` not `(x) => (x)`
- End of line: LF (Unix line endings)
- No console.log statements in production code

### Imports
- Client (ES6 modules): `import { useState, useEffect } from 'react'`
- Server (CommonJS): `const express = require('express')`
- Grouping order: External libs → Internal modules → Components → Hooks → Utils
- Absolute imports preferred for utils: `import { api } from '../utils/api'`
- Named exports preferred: `export { fn1, fn2 }` over default exports

### File Naming Conventions
- Routes: `camelCaseRoutes.js` (e.g., `residentRoutes.js`, `templateRoutes.js`)
- Middleware: `camelCaseMiddleware.js` or `camelCase.js` (e.g., `authMiddleware.js`, `errorHandler.js`)
- Controllers: `camelCaseController.js`
- Services: `PascalCaseService.js` (e.g., `DatabaseService.js`, `WebSocketService`)
- Utils (Server): `camelCase.js` (e.g., `api.js`, `logger.js`, `cache.js`, `mfaOtp.js`)
- Components (Client): `PascalCase.jsx` (e.g., `ProtectedRoute.jsx`, `ErrorBoundary.jsx`)
- Contexts (Client): `PascalCaseContext.jsx` (e.g., `AuthContext.jsx`, `NotificationContext.jsx`)
- Hooks (Client): `usePascalCase.js` or `usePascalCase.jsx`
- Pages (Client): `PascalCase.jsx` (e.g., `Dashboard.jsx`, `Blotter.jsx`)
- Migrations: `YYYYMMDDHHMMSS_descriptive_name.js` (e.g., `20250101000000_initial_schema.js`)

### Variable/Function Naming
- Constants: `UPPER_SNAKE_CASE`
- Variables: `camelCase`
- Functions: `camelCase`
- Classes/Components: `PascalCase`
- Private/internal functions: `_camelCase` (prefix underscore)
- React state setters: `setVariableName`
- Event handlers: `handleEventName` (preferred) or `onEventName` (Material-UI convention)

---

## 3. ERROR HANDLING PATTERNS

### Server-Side Route Handlers
Always wrap async route handlers with `asyncHandler` from `middleware/errorHandler`:

```javascript
const { asyncHandler } = require('../middleware/errorHandler');
const { createSuccessResponse, createErrorResponse } = require('../middleware/errorHandler');

router.get('/path', verifyToken, checkRole(['admin']), asyncHandler(async (req, res) => {
  try {
    const result = await db.execute('SELECT...', []);
    res.json(createSuccessResponse(result));
  } catch (error) {
    throw error; // Caught by errorHandler middleware
  }
}));
```

### Standard Response Format
- Success: `{ success: true, data: {...}, message: '...' }`
- Error: `{ success: false, error: { message: '...', statusCode: 400 } }`
- Use helper functions: `createSuccessResponse(data, message)`, `createErrorResponse(message, statusCode)`

### Client-Side API Calls
Always use try-catch with `apiRequest()` from `client/src/utils/api.js`:

```javascript
import { api } from '../utils/api';

try {
  const response = await api.get('/endpoint');
  if (response.ok) {
    const data = await response.json();
    // Handle success
  } else {
    throw new Error('Request failed');
  }
} catch (error) {
  console.error('Error:', error);
  setError(error.message);
}
```

### CSRF Token Handling
- CSRF tokens are automatically added by `apiRequest()` for POST/PUT/DELETE
- Skip for `/auth/login` and `/auth/register` endpoints
- On 403 CSRF errors, utility automatically retries once after 500ms delay
- Token stored in `client/src/utils/csrf.js` with automatic refresh on mismatch

---

## 4. ARCHITECTURAL PATTERNS

### Express Route Structure (Server)
Standard middleware stack order:
1. Authentication: `verifyToken`
2. Authorization: `checkRole(['admin', 'captain'])`
3. Read-only enforcement (optional): `enforceReadOnly`
4. Validation: `validateId`, `validateSearch`, `sanitizeInput`
5. File upload (if needed): `upload.single('fieldName')`
6. Route handler: wrapped with `asyncHandler`

```javascript
router.get('/', verifyToken, checkRole(['admin', 'secretary']), validateSearch, asyncHandler(controllerMethod));
```

### React Components
- Use functional components with hooks (no class components)
- Props: Destructure in function signature
- Context: Use custom hooks (`useAuth()`, `useNotifications()`, `useThemeMode()`)
- Styling: Material-UI (`@mui/material`) with `sx` prop or `styled` from `@mui/material/styles`
- Lazy loading: Use `React.lazy()` for routes, provide error fallback: `import('./Pages').catch(() => import('./ErrorPage'))`
- Error boundaries: Wrap routes in `<ErrorBoundary>` from `components/ErrorBoundary.jsx`

### Database Access
- Use `db.execute(sql, params)` for parameterized queries (prevents SQL injection)
- Always use placeholders: `SELECT * FROM users WHERE id = ?`, [id]
- Connection pooling: Configured in `server/database.js` (max 10 connections)
- Use transactions for multi-step operations

---

## 5. ROLE-BASED ACCESS CONTROL

### Numeric Role IDs (THEMIS CLEARPASS Hierarchy)
1 = IT Admin (full access, all permissions, requires MFA)
2 = Barangay Captain
3 = Secretary
4 = Clerk
5 = Captain (legacy - maps to 2)
6 = Blotter Officer
12 = Resident (verified)
13 = Resident (guest/unverified)

### Usage Examples
- Server routes: `checkRole(['admin', 'secretary'])`
- Client components: `<ProtectedRoute requiredRoles={[1, 3]} children={...} />`
- From AuthContext: `user.role` returns numeric ID

### MFA Requirements
Roles 1 (Admin), 3 (Secretary), 4 (Clerk) require MFA verification before full system access
- Check: `user.mfa_verified === true`
- Redirect to `/mfa-otp` if not verified
- MFA implementation: `server/utils/mfaOtp.js` with 6-digit OTP
- OTP stored in `mfa_otp_challenges` table with 5 attempts remaining

### Guest Email Verification
Role 13 (Guest) requires email verification before full access
- Check: `user.email_verified === true`
- Redirect to `/guest/verify-email` if not verified
- Email field stored in `residents.Email` column

---

## 6. AUTHENTICATION & SECURITY

### Cookie-Based Auth
- JWT stored in `authToken` cookie (httpOnly for security)
- CSRF protection enabled via `csurf` middleware
- Use `apiRequest()` from `client/src/utils/api.js` (adds CSRF automatically)
- Skip CSRF for `/auth/login` and `/auth/register` endpoints
- Resident login uses `pin_code` + Resident_ID (6-digit PIN)

### Security Best Practices
- Never log sensitive data (passwords, tokens, full user objects)
- Validate all inputs before database operations using `express-validator` middleware
- File uploads: Use `multer` with strict MIME type checking, max size limits
- SQL injection prevention: Always use parameterized queries with `?` placeholders
- Rate limiting: Use `express-rate-limit` for API endpoints
- Helmet: Security headers via `helmet` middleware
- Security logging: Use `securityLogger.logAuthAttempt()`, `securityLogger.logAuthorizationFailure()`, `securityLogger.logCsrfViolation()`

---

## 7. DATABASE SCHEMA REFERENCE

### Core Tables (from initial_schema.js)
- `sitios`: Geographic areas (id, name, description)
- `households`: Household management (Household_ID PK, Street_Address, Sitio_ID FK, Household_Type enum)
- `residents`: Main resident data (Resident_ID PK string, Household_ID FK, demographics, vulnerability flags, QR_Hash_String)
- `vulnerabilities`: 4Ps, PWD, Senior, Solo Parent flags (1:1 with residents, CASCADE delete)

### Blotter & Incident Management
- `blotter`: Incident reports with JSON fields (Complainant_Details, Respondent_Details), Incident_Type enum, status enum, hearing tracking
- `blotter_requests`: Resident-initiated blotter requests with full investigation workflow and status tracking
  - Status flow: `pending_review` → `for_validation` → `awaiting_response` | `ready_for_decision` → `approved` | `rejected` | `under_appeal`
  - Enhanced complainant data: contact_method, address, ID type/number
  - Investigation checklist: 8 steps (5 required) tracked in `investigation_checklist` JSON
  - Audit trail in `blotter_request_audits` with actions: submitted, assigned_validation, contacted_complainant, added_note, requested_info, resident_response, approved, rejected, appealed
  - Appeal support: residents can appeal rejected requests, officers approve/deny via `handle-appeal` endpoint
  - Bulk operations: officers can bulk assign requests and request info from multiple residents

### Document Management
- `document_requests`: Certificate issuance requests (request_id PK, resident_id FK, document_type, status enum, request_data JSON, approval_data JSON, qr_code)
- `document_templates`: Certificate templates with BLOB storage (file_data MEDIUMBLOB, file_encoding, template_content JSON)
- `certificates_log`: Issued certificates history (control_no, resident_id, certificate_type, date_issued, status)
- `certificate_types`: Certificate type definitions (name, code, fee, validity_days, required_data JSON)

### Authentication & Users
- `users`: Staff authentication (id PK, username, password hash, role tinyint, resident_id FK for validation, pin_code for residents)
- `mfa_otp_challenges`: MFA OTP storage (user_id, otp_hash, attempts_remaining, expires_at, consumed_at)

### Notifications
- `notifications`: System notifications (type, title, message, priority enum, data JSON)
- `user_notifications`: User-notification joins (user_id FK, notification_id FK, is_read, read_at timestamp)

### Audit & Logging
- `audit_logs`: Security and action logging (event_type, user_id, ip_address, action enum, result enum, details JSON)

### Community & Programs
- `community_programs`: Barangay programs (program_name, description, program_date, sitio_id FK, target_beneficiaries JSON, status enum, budget)
- `program_participants`: Program-resident joins (program_id FK, resident_id FK, joined_at)

### Additional Tables
- `residency_verification`: Resident verification documents (resident_id FK, document_type, status enum, verification_data JSON)
- `document_verification`: Document verification records (request_id FK, status enum, verification_data JSON)
- `system_assets`: System assets (asset_type, name, data JSON, uploaded_by FK)

### Key Relationships
- residents → households (Many:1 via Household_ID)
- households → sitios (Many:1 via Sitio_ID)
- residents → vulnerabilities (1:1 via Resident_ID, CASCADE delete)
- residents → document_requests (1:Many)
- households → residents (One:Many via Head_Resident_ID)
- users → residents (Optional via resident_id for validation)
- users → blotter via user roles
- document_requests → document_templates (Optional via template_id)
- document_requests → residents (Required via resident_id)

---

## 8. COMMON UTILITY FUNCTIONS

### Server Utilities (server/utils/)
- `logger.js`: Winston logger with security logging methods
  - `logger.log()`, `logger.error()`, `logger.warn()`, `logger.http()`
  - `securityLogger.logAuthAttempt()`, `securityLogger.logAuthorizationFailure()`
  - `securityLogger.logSuspiciousActivity()`, `securityLogger.logDataBreach()`, `securityLogger.logRateLimitExceeded()`, `securityLogger.logCsrfViolation()`
  - Output to `server/logs/error.log`, `combined.log`, `security.log`, `exceptions.log`, `rejections.log`
  - `requestLogger`: Middleware for HTTP request/response logging with duration tracking
  - `dbLogger`: Database operation logging with duration tracking
  - `healthLogger`: System metrics logging

- `cache.js`: Redis cache with memory fallback
  - `get(key)`: Retrieve cached value, parse JSON, return null on miss
  - `set(key, value, ttl)`: Set cached value, JSON.stringify, default TTL 3600s (1 hour)
  - `del(key)`: Delete cached value
  - `invalidatePattern(pattern)`: Delete all keys matching pattern
  - Fallback to in-memory operations when Redis unavailable

- `mfaOtp.js`: MFA OTP generation and verification
  - `generateOTP(userId)`: Generate 6-digit code, hash, store in database
  - `verifyOTP(userId, code)`: Verify OTP, decrement attempts, mark consumed

- `documentStorage.js`: Document file storage and retrieval
  - `storeDocument(req, docId)`: Handle file uploads, validate MIME types, store in database BLOB
  - `getDocument(docId)`: Retrieve document from database, send as download

- `performance.js`: Performance metrics tracking
  - `recordOperation(operation, duration)`: Log operation duration for monitoring
  - `getMetrics()`: Retrieve aggregated performance data

### Client Utilities (client/src/utils/)
- `api.js`: API request wrapper with CSRF handling
  - `api.get()`, `api.post()`, `api.put()`, `api.delete()`
  - `apiRequest(endpoint, options)`: Custom requests with automatic CSRF token addition
  - `isAuthenticated()`: Check for authToken cookie
  - `logout()`: Clear CSRF tokens, localStorage, redirect to login
  - CSRF retry logic: Auto-refresh and retry on 403 EBADCSRFTOKEN errors with 500ms delay

- `csrf.js`: CSRF token management
  - `getCsrfToken()`: Fetch token from `/api/csrf-token`, cache in localStorage
  - `addCsrfToken(headers)`: Add X-CSRF-Token header to request
  - `clearCsrfToken()`: Clear cached token

- `secureStorage.js`: Secure localStorage wrapper
  - `setItem(key, value)`: Wrapper with error handling
  - `getItem(key)`: Wrapper with error handling
  - `removeItem(key)`: Wrapper with error handling
  - `clear()`: Clear all storage

- `roles.js`: Role definitions and helpers
  - `ROLE_NAMES`: Mapping of role IDs to display names
  - `getRoleAccessLevel(roleId)`: Return access level string
  - `canAccess(roleId, requiredRoles)`: Check if role has access

- `fileValidation.js`: File upload validation
  - `validateFile(file, allowedTypes, maxSize)`: Validate MIME type, file size
  - `isImageFile(file)`: Check if file is image
  - `isPdfFile(file)`: Check if file is PDF

---

## 9. AI SERVICE INTEGRATION

### AI Service (ai_service/)
Python Flask service running on port 5000 (default)

#### Endpoints

##### POST `/api/calculate-priority`
Calculate social aid priority based on resident data

Request body:
```javascript
{
  monthly_income: number,
  is_senior: boolean,
  is_pwd: boolean,
  occupation: string
}
```

Response:
```javascript
{
  priority: "HIGH" | "MEDIUM" | "LOW",
  score: number (10-100),
  reasons: string[] (explaining why priority was assigned)
}
```

Priority Logic:
- HIGH (score 80-100): Income < 10,000 OR is_senior OR is_pwd
- LOW (score 10): Income > 20,000 AND employed
- MEDIUM (score 50): Default case

##### POST `/api/suggest-patrol`
AI-powered patrol deployment suggestions based on real blotter data

Request body:
```javascript
{
  blotter_data: [
    { incident_type: string, location: string, timestamp: ISO datetime, ... }
  ]
}
```

Response:
```javascript
{
  overall_risk_level: "HIGH" | "MEDIUM" | "LOW",
  risk_assessment: {
    total_incidents: number,
    high_risk_sitios: string[],
    peak_hours: object,
    trend: "INCREASING" | "DECREASING" | "STABLE",
    high_risk_days: string[]
  },
  patrol_suggestions: string[],
  recommended_schedule: {
    priority_areas: string[],
    suggested_tandoys: number,
    shift_coverage: string
  },
  generated_at: ISO datetime,
  fallback: boolean
}
```

##### POST `/api/chatbot/message`
BANTAY Chatbot message processing using ML NLU

Request body:
```javascript
{
  message: string
}
```

Response:
```javascript
{
  response: string,
  intent: string (greeting, certificate_inquiry, blotter_report, etc.),
  confidence: number (0.0-1.0),
  actions: string[],
  appointment_booked: boolean,
  requires_followup: boolean,
  type: "text",
  steps: string[],
  resources: string[],
  disclaimers: string[],
  timestamp: ISO datetime
}
```

##### GET `/api/health`
Health check endpoint

Response:
```javascript
{
  status: "healthy",
  service: "AI Priority Engine",
  models: {
    chatbot_nlu: "loaded" | "failed"
  }
}
```

##### GET `/api/analytics/general`
General AI analytics for admin dashboard

Response:
```javascript
{
  model_accuracy: string (percentage),
  predictions_count: number,
  service_status: "Online" | "Offline",
  last_updated: ISO datetime
}
```

#### Authentication
- Header: `X-Service-Key` (from `AI_SERVICE_SECRET` env var)
- Skip auth for `/health`, `/apidocs`, `/flasgger_static`

#### Usage Pattern
```javascript
const response = await fetch('http://localhost:5000/api/calculate-priority', {
  method: 'POST',
  headers: { 'X-Service-Key': process.env.AI_SERVICE_SECRET },
  body: JSON.stringify(residentData)
});
const priority = await response.json();

// Check for fallback data
if (priority.fallback) {
  // Use mock data
}
```

---

## 10. WEBSOCKET NOTIFICATION PATTERNS

### WebSocket Service (server/services/websocketService.js)
- Path: `/ws`
- Server attached via `WebSocket.Server({ server, path: '/ws' })`
- Clients tracked in memory Map: `userId -> WebSocket`

#### Authentication
Client must send first message:
```javascript
{
  type: 'auth',
  token: 'JWT_token_here'
}
```

Server responds with:
```javascript
{
  type: 'auth_success' | 'auth_error',
  message: 'string'
}
```

#### Notification Types
- `connection`: Connected message
- `notification`: New notification payload
- Data structure stored on WebSocket client: `userId`, `userRole`

#### Methods
```javascript
// Send to specific user
WebSocketService.sendToUser(userId, { type: 'notification', ...data });

// Send to all users with specific role
WebSocketService.sendToRole(roleId, { type: 'notification', ...data });

// Broadcast to all connected clients
WebSocketService.broadcast({ type: 'notification', ...data });

// Get connected user IDs
WebSocketService.getConnectedUsers(); // returns Array<string>

// Get connection count
WebSocketService.getConnectionCount(); // returns number
```

### Client-Side Connection
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3002/ws');

// Authenticate on connection
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'auth', token: localStorage.getItem('token') || getCookie('authToken') }));
};

// Receive notifications
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification') {
    // Handle notification - update UI, show alert, etc.
  }
};

// Handle connection close
ws.onclose = () => {
  // Attempt reconnection with exponential backoff
};

// Handle errors
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

### Notification Polling Fallback
- Poll `/api/notifications` every 30 seconds if WebSocket unavailable
- Endpoint returns array of notification objects
- Frontend `NotificationContext.jsx` implements both WebSocket and polling

---

## 11. TESTING GUIDELINES

### Server Tests (Jest)
- Mock database: `jest.mock('../database', () => ({ execute: jest.fn() }))`
- Mock middleware: `jest.mock('../middleware/authMiddleware', () => ({ verifyToken: mock, checkRole: mock }))`
- Mock auth user in tests: `{ verifyToken: (req, res, next) => { req.user = { id: 1, role: 1, mfa_verified: true }; next(); } }`
- Test file naming: `*.test.js` (in `server/__tests__/`)
- Use `supertest` for HTTP endpoint testing: `request(app).get('/api/endpoint')`
- Always clear mocks in `beforeEach()`: `jest.clearAllMocks()`
- Test isolation: Each test should be independent
- Async operations: Use `async/await` with proper error handling

### Client Tests (Vitest)
- Mock MUI icons: Configured in `client/src/test/muiIconsMock.js`
- Test file naming: `*.test.jsx` or `*.test.js` (in `client/src/__tests__/` or `client/src/pages/__tests__/`)
- Use `@testing-library/react` for component testing
- Async operations: Use `waitFor` from `@testing-library/react` for DOM updates
- User interactions: Use `fireEvent`, `userEvent` from `@testing-library/user-event`
- Testing-library setup: `client/src/test/setup.js` with cleanup after each test
- Component cleanup: Use `cleanup()` from `@testing-library/react` after each test

### ⭐ SINGLE TEST EXECUTION PATTERNS
```bash
# Run one server test file
cd server && npm test -- path/to/test.test.js

# Run one client test file  
cd client && npm test -- path/to/test.jsx

# Run one specific test with watch mode
cd server && npm test -- --watch path/to/test.test.js

# Run integration tests only
cd server && npm run test:integration
```

### Test Structure Example
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup test data
  });

  describe('Specific Behavior', () => {
    test('should do X when Y', async () => {
      // Arrange
      const mockData = { ... };
      db.execute.mockResolvedValueOnce([mockData]);

      // Act
      const response = await request(app).get('/api/endpoint');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockData);
    });
  });
});
```

---

## 12. API ENDPOINT CONVENTIONS

### REST Patterns
- GET: Retrieve resources (`/residents`, `/residents/:id`, `/templates`)
- POST: Create resources (`/residents`, `/templates/upload`, `/auth/login`)
- PUT: Update resources (`/residents/:id`, `/templates/:id`)
- DELETE: Remove resources (`/residents/:id`, `/templates/:id`)

### URL Structure
- `/api/[resource]` - List endpoint (with optional query filters)
- `/api/[resource]/:id` - Single resource by ID
- `/api/[resource]/:id/action` - Action endpoints (e.g., `/residents/:id/archive`, `/residents/:id/status`, `/residents/:id/documents`)
- `/api/[resource]/:id/related-resource` - Nested endpoints (e.g., `/residents/:id/documents`, `/templates/:id/download`)

### Query Parameters
- Filtering: `?search=term&role=1&status=active&document_type=barangay_clearance`
- Pagination: `?page=1&limit=20&offset=0`
- Include inactive: `?include_inactive=true`
- Date ranges: `?start_date=2024-01-01&end_date=2024-12-31`

### Response Format
Success:
```javascript
{
  success: true,
  message: 'Operation successful',
  data: { ... },
  timestamp: ISO datetime string
}
```

Error:
```javascript
{
  success: false,
  error: {
    message: 'Error description',
    statusCode: 400,
    details: { ... }, // optional
    timestamp: ISO datetime string
  }
}
```

---

## 13. FILE UPLOAD HANDLING

### Server-Side
- Use `multer` for multipart form data
- Configure memory storage for processing: `multer({ storage: multer.memoryStorage() })`
- File size limits: 10MB for evidence files, 5MB for certificate templates
- MIME type validation: Reject non-whitelisted types (see `middleware/imageUpload.js`)
- Whitelisted MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Client-Side
- Use `FormData` for file uploads
- Don't set `Content-Type` header (let browser set boundary)
- Use `apiRequest()` wrapper which handles FormData automatically
- Example:
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('field', 'value');
await apiRequest('/upload', { method: 'POST', body: formData });
```

### File Upload Error Handling
- `LIMIT_FILE_SIZE` error: File exceeds configured max size
- `LIMIT_UNEXPECTED_FILE` error: Too many files
- MIME type errors: Reject with descriptive message
- Always validate on server side (client-side validation can be bypassed)
- Use parameterized queries (`?` placeholders) to prevent SQL injection

---

## 14. BLOTTER REQUEST API ENDPOINTS

### Resident-Facing Endpoints (Role 12: Verified Resident)
| Endpoint | Method | Purpose | Auth | Body |
|----------|--------|---------|------|------|
| `POST /api/blotter-requests` | Create request | verifyToken | incident_type, incident_date, incident_time, location_sitio, location_details, description_text, respondent_name, respondent_alias, respondent_address, respondent_contact, respondent_resident_id, complainant_contact_method, complainant_address, complainant_id_type, complainant_id_number, images[] |
| `GET /api/blotter-requests/my` | Resident history | verifyToken | page, limit |
| `POST /api/blotter-requests/:id/respond-info` | Respond to officer info request | verifyToken | message, images[] |
| `POST /api/blotter-requests/:id/appeal` | Submit appeal for rejected request | verifyToken | message, images[] |

### Officer/Admin Endpoints (Roles 1, 2, 3, 4, 6)
| Endpoint | Method | Purpose | Auth | Body |
|----------|--------|---------|------|------|
| `GET /api/blotter-requests` | List all requests | verifyToken, checkRole | status, assigned_officer_id, page, limit |
| `GET /api/blotter-requests/:id` | Get request details with audits | verifyToken, checkRole | include_audits (optional) |
| `PATCH /api/blotter-requests/:id/validate` | Start validation, assign officer | verifyToken, checkRole | assign_officer_id, due_at, note |
| `PATCH /api/blotter-requests/:id/investigation` | Update investigation checklist/notes | verifyToken, checkRole | investigation_checklist, investigation_findings |
| `POST /api/blotter-requests/:id/contact-complainant` | Log contact with complainant | verifyToken, checkRole | method, date, notes, outcome |
| `POST /api/blotter-requests/:id/request-info` | Request info from resident | verifyToken, checkRole | message, required_fields |
| `PATCH /api/blotter-requests/:id/status` | Approve/reject | verifyToken, checkRole | action (approve/reject), reason, notes |
| `POST /api/blotter-requests/bulk-assign` | Bulk assign to officer | verifyToken, checkRole | request_ids[], officer_id |
| `POST /api/blotter-requests/bulk-request-info` | Bulk request info from residents | verifyToken, checkRole | request_ids[], message |
| `PATCH /api/blotter-requests/:id/handle-appeal` | Approve/deny appeal | verifyToken, checkRole | action (approve_appeal/deny_appeal), message |

### Status Flow
- `pending_review`: Initial status after resident submission
- `for_validation`: Officer assigned, validation in progress
- `awaiting_response`: Officer requested info from resident
- `ready_for_decision`: Investigation complete, awaiting approval/rejection
- `approved`: Converted to blotter case (check `approved_blotter_case_number`)
- `rejected`: Rejected with option to appeal
- `under_appeal`: Resident submitted appeal, awaiting officer review

### Investigation Checklist Steps (5 Required)
1. `reviewed_complaint` (required): Reviewed complaint details thoroughly
2. `contacted_complainant` (required): Contacted complainant for verification
3. `attempted_contact_respondent` (optional): Attempted to contact respondent
4. `reviewed_evidence` (required): Reviewed submitted evidence
5. `conducted_investigation` (required): Conducted investigation/interview
6. `documented_findings` (required): Documented investigation findings
7. `verified_location` (optional): Verified incident location
8. `confirmed_jurisdiction` (required): Confirmed incident falls under barangay jurisdiction

---

## 14. IMPORTANT CONSTRAINTS & NOTES

- No comments in production code (clean code preferred)
- Use existing utilities before creating new ones
- Follow established folder structure
- Never commit secrets (.env, credentials.json, API keys)
- Always run linting before committing: `npm run lint` (server) or `cd client && npm run lint`
- Test in dev environment before production changes
- MySQL max_allowed_packet: 64MB (configured in C:\xampp\mysql\bin\my.ini)
- Redis used for caching with memory fallback if unavailable
- Winston logging outputs to `server/logs/` directory
- WebSocket connections tracked in memory Map by userId
- AI service runs on Flask with CORS enabled for all routes
- MFA required for roles 1, 3, 4 before full system access
- Email verification required for role 13 before full system access
- All file uploads must be validated for MIME type and size
- Use parameterized queries (`?` placeholders) to prevent SQL injection
- All async route handlers must be wrapped with `asyncHandler()`
- Use `console.log()` for development debugging only, remove before production

---

## 15. QUICK REFERENCE PATTERNS

### Common Server Patterns
```javascript
// Get current user from request
const userId = req.user?.id || req.user?.resident_id;
const userRole = req.user?.role;

// Query with pagination
const offset = (page - 1) * limit;
const [rows] = await db.execute('SELECT * FROM table LIMIT ? OFFSET ?', [limit, offset]);

// Transaction handling
const trx = await db.transaction();
try {
  await trx('table1').insert(data1);
  await trx('table2').insert(data2);
  await trx.commit();
} catch (error) {
  await trx.rollback();
  throw error;
}
```

### Common Client Patterns
```javascript
// Auth state
const { user, isAuthenticated, loading } = useAuth();

// Notification state
const { notify } = useNotifications();
const { unreadCount, markAsRead } = useNotifications();

// Theme mode
const { mode, toggleDarkMode } = useThemeMode();

// Protected route usage
<ProtectedRoute requiredRoles={[1, 2]} children={<YourComponent />} />

// API call pattern
const response = await api.get('/endpoint');
if (!response.ok) throw new Error('Request failed');
const data = await response.json();
```

### Common Validation Patterns
```javascript
// Server-side validation
const { validationResult } = require('express-validator');
const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json(createErrorResponse('Validation failed', 400, errors.array()));
}

// Client-side validation
if (!input || input.trim() === '') {
  setError('This field is required');
  return false;
}
```
