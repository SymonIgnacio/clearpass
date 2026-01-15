# Fix Application Approval 500 Error & Visibility Issues

I have identified the causes for both the 500 error and the missing applications. The 500 error is likely caused by a hardcoded `Sitio_ID` that may not exist, and the visibility issue is due to a strict backend filter.

## Technical Plan

### 1. Backend Fixes (`server/routes/secretaryRoutes.js`)

**Fix 500 Error (Hardcoded Foreign Key):**
- In the `POST /applications/:id/:action` handler (approve logic):
  - Replace the hardcoded `Sitio_ID` (1) with a dynamic lookup.
  - Query the `sitios` table using the application's `sitio` name (`app.sitio`).
  - Fallback to the first available ID in `sitios` if the name doesn't match, to ensure the INSERT succeeds.

**Fix Visibility (Strict Filter):**
- Update `GET /applications` route:
  - Remove the hardcoded `WHERE status = 'pending'`.
  - Add support for a `status` query parameter (e.g., `?status=approved`).
  - If `status` is provided, filter by it.
  - If `status` is not provided, default to 'pending' (to maintain backward compatibility) or return all. I will implement filtering by the provided status to allow the frontend to control the view.

### 2. Frontend Fixes (`client/src/pages/DocumentVerification.jsx`)

**Implement Status Filter:**
- Add a state variable `filterStatus` (default: 'pending').
- Add a UI control (Tabs or Select dropdown) above the applications table to switch between "Pending", "Approved", and "Rejected".
- Update `fetchApplications` to include the selected status in the API request: `/api/secretary/applications?status=${filterStatus}`.

**Improve UX:**
- Display the `reviewed_at` timestamp and `reviewed_by` (if available) in the table when viewing Approved/Rejected applications.
- Ensure the "Approve/Reject" buttons are hidden or disabled for already processed applications.

## Verification
1.  **Backend**: Test `POST .../approve` with `APP-2025-002` to ensure it returns 200 OK and creates the resident.
2.  **Frontend**: Verify that switching tabs shows the correct applications and that the newly approved application moves from "Pending" to "Approved".
