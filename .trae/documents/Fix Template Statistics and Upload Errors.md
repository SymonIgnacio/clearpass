I have identified the causes for both the missing statistics and the upload issue.

**1. Statistics Issue ("0 Active Templates")**
*   **Cause:** The frontend expects a flat JSON object (e.g., `{ active: 3 }`), but the backend was returning a nested structure (`{ success: true, data: { active: 3 } }`). This caused the frontend to read `undefined` (displayed as 0).
*   **Fix:** I will modify `server/routes/templateRoutes.js` to return the statistics directly in the root of the JSON response, matching the frontend's expectation.

**2. Upload Issue ("Can't upload a template")**
*   **Cause:** The database has a **unique constraint** on the `template_name`. If you try to upload a template with a name that already exists (e.g., re-uploading "barangay clearance v1"), the database rejects it. The current error handling returns a generic "Internal server error" or similar, which is unhelpful.
*   **Fix:** I will enhance the error handling in the `/upload` endpoint to specifically catch "Duplicate entry" errors (code `ER_DUP_ENTRY`) and return a clear `409 Conflict` response telling you that the template name is already taken.

**Plan:**
1.  **Update `server/routes/templateRoutes.js`**:
    *   **Flatten `/stats` response:** Remove the `success: true, data: { ... }` wrapper.
    *   **Enhance `/upload` error handling:** Add a specific check for `error.code === 'ER_DUP_ENTRY'` and return a user-friendly message.

This will restore the dashboard numbers and allow you to understand why an upload might be failing (or upload successfully if the name is unique).