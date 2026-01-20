I have identified potential issues in both the frontend and backend that explain the user's problem ("button not working" and "misalignment").

### Analysis
1.  **Frontend (Button Disabled Issue)**:
    *   The "Create Certificate" button is likely disabled because of a state synchronization issue.
    *   The `useEffect` hook that initializes `dynamicFields` runs whenever `templates` updates. If `templates` is refreshed (even with same data), it resets `dynamicFields` to empty strings.
    *   There's also a risk that `manual_certificate_type` might not be set correctly if the template selection state is slightly out of sync.

2.  **Backend (Download Failure Issue)**:
    *   There is a clear misalignment in the document download logic.
    *   The frontend tries to download via `/api/documents/download?type=...&controlNo=...`.
    *   The backend controller `documentController.downloadDocument` only looks for `req.params.request_id` and ignores the query parameters. This causes the download to fail (404) even if the certificate is created successfully.
    *   Additionally, the `certificateController.create` method does not return the `request_id` to the frontend, making it hard to construct the correct URL.

### Plan
I will perform the following fixes:

1.  **Frontend (`DocumentsDashboard.jsx`)**:
    *   Modify the `useEffect` to prevent resetting `dynamicFields` if the extracted placeholders haven't changed.
    *   Ensure `manual_certificate_type` is robustly derived from the selected template if missing.
    *   Update the download URL construction to be more reliable.

2.  **Backend (`certificateController.js`)**:
    *   Update the `create` method to return the generated `request_id` in the JSON response.

3.  **Backend (`documentController.js`)**:
    *   Update `downloadDocument` to handle the generic `/download` route by checking `req.query` (specifically `controlNo`) when `req.params.request_id` is not present.

This comprehensive approach fixes the immediate UI issue and ensures the subsequent file generation works correctly.