# Routes Directory

This directory contains modular route definitions following Express Router pattern.

## Route Files

### adminRoutes.js

- **Base Path**: `/api/admin`
- **Controller**: adminController
- **Authentication**: Required (Admin, Captain roles)
- **Endpoints**:
  - `GET /summary` - System summary statistics
  - `GET /users` - User management reports
  - `GET /blotter` - Blotter case reports
  - `GET /certificates` - Certificate issuance reports
  - `GET /residents` - Resident statistics
  - `GET /system` - System health metrics
  - `GET /security` - Security audit logs

### residentRoutes.js

- **Base Path**: `/api/residents`
- **Controller**: residentController
- **Authentication**: Required (Admin, Captain, Clerk roles)
- **Endpoints**:
  - `GET /` - List residents (paginated)
  - `GET /:id` - Get resident by ID
  - `POST /` - Create new resident
  - `PUT /:id` - Update resident
  - `DELETE /:id` - Archive resident
  - `POST /bulk-import` - Bulk import from Excel
  - `POST /:id/generate-qr` - Generate QR code
  - `POST /check-duplicate` - Check for duplicates
  - `GET /household/:id/members` - Get household members

### certificateRoutes.js

- **Base Path**: `/api/certificates`
- **Controller**: certificateController
- **Authentication**: Required
- **Endpoints**:
  - `GET /` - List certificates (role-based filtering)

### blotterRoutes.js

- **Base Path**: `/api/blotter`
- **Controller**: blotterController
- **Authentication**: Required (Admin, Captain, Clerk roles)
- **Endpoints**:
  - `GET /` - List blotter cases (paginated)
  - `POST /` - Create new case
  - `PUT /:id` - Update case
  - `DELETE /:id` - Delete case

### censusRoutes.js

- **Base Path**: `/api/census`
- **Authentication**: Required
- **Endpoints**:
  - `GET /summary` - Census summary statistics
  - `GET /demographics` - Demographic breakdown
  - `GET /vulnerable-groups` - Vulnerable population data

### userRoutes.js

- **Base Path**: `/api/users`
- **Controller**: userController
- **Authentication**: Required (Admin role)
- **Endpoints**:
  - `GET /` - List users (paginated)
  - `GET /:id` - Get user by ID
  - `POST /` - Create new user
  - `PUT /:id` - Update user
  - `POST /:id/toggle-status` - Enable/disable user
  - `POST /:id/reset-password` - Reset user password
  - `DELETE /:id` - Delete user

## Route Pattern

All routes follow this pattern:

```javascript
const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/controllerName');

router.get('/', verifyToken, checkRole(['admin', 'captain', 'clerk']), controller.getAll);

router.post('/', verifyToken, checkRole(['admin', 'clerk']), controller.create);

module.exports = router;
```

## Middleware Stack

Routes use these middleware layers:

1. **verifyToken**: JWT authentication
2. **checkRole**: Role-based authorization
3. **validation**: Input validation (where applicable)
4. **controller method**: Business logic

## Role-Based Access

| Role         | Permissions                          |
| ------------ | ------------------------------------ |
| **Admin**    | Full system access                   |
| **Captain**  | View all data, approve operations    |
| **Clerk**    | Manage residents, issue certificates |
| **Resident** | View own data only                   |

## Mounting in index.js

Routes are mounted with `/api` prefix:

```javascript
app.use('/api/admin', adminRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/blotter', blotterRoutes);
app.use('/api/census', censusRoutes);
app.use('/api/users', userRoutes);
```

## API Documentation

Full API documentation available at:

- Swagger UI: `/api-docs`
- Markdown: `docs/API_DOCUMENTATION.md`

## Recent Changes (2024)

- All routes now use `/api/*` prefix exclusively
- Removed duplicate route definitions
- Standardized middleware application
- Consistent error handling
- Role-based access control enforced
