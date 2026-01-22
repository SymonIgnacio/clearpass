I will fix the document download issue by updating the frontend to use the correct API endpoint format.

**Problem Analysis**
The error `{"success":false,"message":"Missing request identifier (request_id or controlNo)"}` occurs because the frontend is sending the request ID as a query parameter (`?requestId=...`), but the backend controller only checks for it in the URL path (`req.params.request_id`) or expects a `controlNo` query parameter.

**Proposed Changes**
1.  **Modify `client/src/pages/DocumentsDashboard.jsx`**:
    *   Update the `handleUpdateStatus` function.
    *   Change the `window.open` URL construction from:
        `/api/documents/download?type=...&requestId=${requestId}`
        to:
        `/api/documents/requests/${requestId}/download`
    *   This aligns with the existing backend route definition: `router.get('/requests/:request_id/download', ...)`

**Verification**
After applying the fix, approving a certificate request should correctly trigger the PDF download endpoint with the `request_id` properly mapped in the backend controller, resolving the "Missing request identifier" error.