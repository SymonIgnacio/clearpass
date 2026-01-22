I will fix the `ForbiddenError: invalid csrf token` by implementing a robust token refresh and retry mechanism in the frontend API utility. This will handle cases where the client's cached CSRF token becomes stale (e.g., after server restart or session expiry).

### Frontend Fixes
**File:** `client/src/utils/api.js`
1.  **Implement Retry Logic**:
    *   Intercept `403 Forbidden` responses in the `apiRequest` function.
    *   Check if the error code is `EBADCSRFTOKEN` or the message indicates a CSRF issue.
    *   If confirmed as a CSRF error:
        *   Call `clearCsrfToken()` to invalidate the stale token.
        *   Call `addCsrfToken()` to fetch a fresh token from the server.
        *   Retry the original request with the new token.
    *   Limit retries to 1 attempt to prevent infinite loops.

**File:** `client/src/utils/csrf.js`
1.  **Verify Token Clearing**: Ensure `clearCsrfToken` correctly nullifies the cached token so `getCsrfToken` is forced to fetch a new one. (Confirmed by code review, but I will double-check).

### Verification
*   I will verify the fix by checking the code changes.
*   The user can then verify by attempting to issue a certificate again. If the token was stale, the first attempt might log a retry, but the action should succeed.
