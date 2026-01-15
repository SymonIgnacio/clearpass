# Role Normalization & Routing Fixes

## Issue

Users with legacy role `5` (Old Superadmin) were experiencing `403 Forbidden` errors on:

- `/api/blotter`: Restricted to normalized roles `[1, 2, 3, 4, 6]`. Role `5` was rejected.
- `/api/sitios`: Routing conflict caused requests to hit a legacy route handler in `routes.js` that required role validation, instead of the modern `sitioRoutes.js` which is open to all authenticated users.

## Solution Architecture

### 1. Database Normalization

- **Action**: Migrated all users with role `5` to role `1` (IT Admin).
- **SQL**: `UPDATE users SET role = 1 WHERE role = 5;`
- **Result**: Data is now consistent with the `ROLE_MAP` definition (`admin: 1`).

### 2. Middleware Hardening (`authMiddleware.js`)

- **Action**: Updated `checkRole` to normalize `req.user.role` dynamically.
- **Logic**:
  - If `user.role === 5`, treat as `1`.
  - If `user.role` is a string (e.g., "admin"), map to ID via `ROLE_MAP`.
- **Benefit**: Ensures valid access even for users with old JWT tokens issued before the DB migration.

### 3. Routing Priority (`index.js`)

- **Action**: Moved `app.use('/api/sitios', ...)` **before** the catch-all `app.use('/api', require('./routes'))`.
- **Benefit**: Ensures the modern `sitioRoutes.js` (Reference Data, accessible to all) handles the request instead of the legacy restricted route.

## Verification

- **Blotter**: Admin (Role 1) is explicitly allowed in `blotterRoutes.js`.
- **Sitios**: All authenticated users can access reference data.
- **Legacy**: Old tokens with Role 5 are transparently accepted as Role 1.
