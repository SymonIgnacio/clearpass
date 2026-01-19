# Overlooked Bug: Download Fails for Applicants

I have found the issue with document downloading.

## 1. The Issue: Wrong Table Targeted
- **Frontend**: The "Eye" icon (view/download) calls `/api/secretary/documents/:id/download`.
- **Backend**: This route in `secretaryRoutes.js` is **hardcoded** to check `resident_documents`.
- **The Bug**: Since Symon's file is in `application_documents`, the database query returns 0 rows (Not Found).
- **Frontend Error**: The frontend receives a 400/404 error and shows "Failed to download document".

## 2. The Fix: Dynamic Table Selection (Same as Verify)
- I will modify the backend route `/api/secretary/documents/:id/download` to accept a `source_type` query parameter (e.g., `?source_type=application`).
- I will update the frontend `ResidencyVerification.jsx` to pass this parameter when clicking the view button.
- I will also ensure the backend reads the `file_data` (BLOB) column correctly for both tables, since we switched to database storage.

## Plan Execution
1.  **Backend**: Update `server/routes/secretaryRoutes.js` (Download Route) to handle `source_type` and fetch from the correct table.
2.  **Frontend**: Update `client/src/pages/admin/ResidencyVerification.jsx` to pass `?source_type=...` in the download URL.

This will allow you to view the uploaded files for new applicants.
