I have identified the likely causes of the issue:
1.  **Frontend State Handling**: The `load()` function in `RequestDetail.jsx` ignores `success: false` responses from the backend. This causes the UI to stick on "Validation started" and `pending_review` even if the data refresh failed.
2.  **Backend Data Integrity**: The `validateRequest` method relies on implicit MySQL casting (converting numeric Role ID to ENUM index), which is dangerous. For a Blotter Officer (Role 6), it incorrectly maps to index 6 ('resident') in the `actor_role` ENUM. While this might not crash immediately, it creates confusing data.
3.  **Silent Backend Error**: The `getRequestById` method returns a generic 500 error without logging the actual exception, making debugging difficult.

### Plan
1.  **Fix Frontend (`RequestDetail.jsx`)**:
    -   Modify `load()` to check `!json.success` and call `setMessage` with the error from the server.
    -   This ensures you see the actual error message instead of a misleading success toast.

2.  **Fix Backend (`blotterRequestController.js`)**:
    -   **Add Logging**: Instrument `getRequestById` to log the specific error causing the 500 response.
    -   **Fix Role Mapping**: In `validateRequest`, explicitly map the user's numeric role to a valid `actor_role` string (e.g., mapping Role 6 to 'secretary' or 'admin' as a fallback if 'blotter_officer' isn't in the ENUM) instead of relying on implicit index conversion.

3.  **Verify**:
    -   After applying the fixes, the "Start Validation" action should either succeed correctly (updating the status) or display a clear, actionable error message.

This approach addresses both the immediate UI confusion and the underlying data integrity/debugging issues.