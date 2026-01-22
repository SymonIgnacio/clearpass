I have identified the causes for both the CSRF error and the control number requirement.

### 1. CSRF Token Error
**Issue**: The backend has CSRF protection enabled for `/api/certificates` (server/index.js:149), but the frontend's `apiRequest` utility might not be fetching/attaching the token correctly for this specific endpoint, or the token is expired/mismatched. The logs show `EBADCSRFTOKEN`, confirming the mismatch.

**Solution**:
*   The `apiRequest` utility in `client/src/utils/api.js` automatically attempts to add the CSRF token for POST/PUT/DELETE requests.
*   However, if the token fetch fails or isn't present, it might proceed without it or with an invalid one.
*   I will verify that the frontend logic in `DocumentsDashboard.jsx` (where the issuance happens) is using `apiRequest` correctly.
*   More importantly, I will double-check if the CSRF middleware configuration in `server/index.js` needs adjustment or if the token endpoint is accessible.
*   **Fix**: I will ensure the frontend fetches a fresh CSRF token before submitting the certificate issuance form if one isn't already active.

### 2. Auto-Generate Control Number
**Issue**: The user wants the control number to be auto-generated.
**Current Logic**: In `server/controllers/certificateController.js`, lines 23-24, there is *already* logic to auto-generate a control number if one isn't provided:
```javascript
const controlNo = control_number || `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
```
**Problem**: The frontend (`DocumentsDashboard.jsx`) might be sending an empty string or null for `control_number`, or the user wants a specific *format* that differs from the default timestamp-based one. Or perhaps the frontend UI is forcing the user to type it.

**Solution**:
*   I will modify `DocumentsDashboard.jsx` to remove the manual input field for "Control Number" (or make it read-only/hidden) so the backend's auto-generation takes over.
*   I will update the backend generation logic if a specific format (e.g., sequential) is preferred, but for now, I will ensure the backend logic is actually triggered by not sending a value from the frontend.

### Implementation Plan
1.  **Frontend (DocumentsDashboard.jsx)**:
    *   Remove the "Control Number" input field from the manual issuance form.
    *   Ensure the submit handler calls `apiRequest` (which handles CSRF) instead of a raw `fetch`.
2.  **Backend (certificateController.js)**:
    *   Improve the control number generation to be more readable if needed (e.g., `CTRL-YYYY-XXXX`).
3.  **Verification**:
    *   Test issuing a certificate to confirm the CSRF error is resolved and a control number is generated.

I will start by modifying the frontend to remove the control number input and ensure proper API usage.