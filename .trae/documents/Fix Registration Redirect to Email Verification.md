# Fix Registration Redirect to Email Verification

The issue is that `ResidentRegister.jsx` is hardcoded to redirect to `/resident/dashboard` after success, completely bypassing the new `/guest/verify-email` page we just built.

## Plan

### 1. Update Backend Registration Response
*   **File**: `server/routes/residentAuthRoutes.js`
*   **Action**: Ensure the registration response includes `user.email_verified` (set to `false`) and `user.role` (set to `13`). This ensures the frontend has the correct data immediately.

### 2. Update Frontend Registration Logic
*   **File**: `client/src/pages/ResidentRegister.jsx`
*   **Action**: Modify the `handleSubmit` success block.
    *   Check `data.user.role === 13` (Guest) AND `!data.user.email_verified`.
    *   If true, redirect to `/guest/verify-email` instead of `/resident/dashboard`.

## Execution
1.  **Modify Backend**: Add explicit fields to registration response.
2.  **Modify Frontend**: Add conditional redirect logic.
