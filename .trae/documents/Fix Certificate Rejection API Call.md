I will fix the certificate rejection bug by updating the frontend to call the correct backend API endpoint.

### Fix Certificate Rejection Logic
**File:** `client/src/pages/DocumentsDashboard.jsx`
- Update `handleRejectionConfirm` to use the correct API endpoint and method.
- **Change:** `POST /api/certificate-requests/:id/reject` → `PUT /api/certificate-requests/:id/status`
- **Payload:** Update body to include `{ status: 'rejected', remarks: reason }` to match the backend expectation.

This aligns the frontend with the existing `PUT /:request_id/status` route defined in `server/routes/certificateRequestRoutes.js`.