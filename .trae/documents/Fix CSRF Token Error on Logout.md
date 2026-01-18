I will fix the CSRF token error during logout and ensure the session is properly cleared.

### **Analysis**
1.  **The Error:** `EBADCSRFTOKEN` occurs because the frontend intentionally excludes the CSRF token for all endpoints containing `/auth/` to avoid circular dependencies.
2.  **The Conflict:** The backend explicitly enforces CSRF protection on the logout route (`app.use('/api/auth/logout', csrfProtection)` in `server/index.js`), but the frontend skips sending the token for it.
3.  **The Consequence:** The logout request fails on the server (403 Forbidden), preventing the `authToken` cookie from being cleared server-side. This likely leaves a stale session that interferes with subsequent logins or dashboard access, especially if browsers share cookies or state.

### **Fix Plan**

1.  **Update Frontend API Logic (`client/src/utils/api.js`)**:
    *   Modify the condition that skips CSRF token injection.
    *   Current: `!endpoint.includes('/auth/')` (Skips all auth routes).
    *   New: `!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')` (Skips only login/register, allowing logout to carry the token).

2.  **Verify Backend Protection**:
    *   Confirm `server/index.js` applies `csrfProtection` to `/api/auth/logout` (Confirmed in research).
    *   This change aligns the frontend behavior with the backend's security requirements.

**Verification Plan:**
1.  Log in as a resident.
2.  Open the browser developer tools (Network tab).
3.  Click **Logout**.
4.  Verify the `POST /api/auth/logout` request includes the `X-CSRF-Token` header.
5.  Verify the request succeeds (200 OK) and the server error `EBADCSRFTOKEN` no longer appears.
