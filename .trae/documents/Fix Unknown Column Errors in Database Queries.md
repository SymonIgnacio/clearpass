I will fix the `Unknown column` errors by updating the SQL queries to match the actual database schema.

### 1. Fix `document_requests` Query Error
The `document_requests` table uses `request_id` as its primary key and does not have an `id` column.
- **File:** `server/controllers/certificateRequestController.js`
- **Action:** Remove `dr.id` from the `SELECT` statements in:
  - `getAllRequests` (the one causing the error log)
  - `getMyRequests` (proactive fix)

### 2. Fix `residents` Insert Error
The `residents` table does not have a `Sitio_ID` column; it links to Sitios through the `households` table.
- **File:** `server/routes/secretaryRoutes.js`
- **Action:** Remove `Sitio_ID` from the `INSERT INTO residents` statement in the application approval route.
