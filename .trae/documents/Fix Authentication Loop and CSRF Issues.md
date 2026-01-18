I will fix the login/logout bugs by addressing the root cause: the CSRF protection on the logout endpoint prevents users from clearing their session cookies when their token is invalid or missing. This creates a loop where the user is locally logged out but the server still considers them logged in.

### **Plan of Action**

#### **1. Server-Side Fixes (`server/index.js`)**
- **Disable CSRF on Logout**: Remove `app.use('/api/auth/logout', csrfProtection);`.
  - **Why**: If a user's CSRF token is invalid (e.g., session expired, tab closed, or desynchronized), the server currently rejects their logout request with a `403 Forbidden`. This leaves the authentication cookie active on the server while the client thinks it's logged out. Allowing logout without CSRF is standard practice to ensure users can always exit a session.

#### **2. Client-Side Fixes (`client/src/contexts/AuthContext.jsx`)**
- **Enhance Logout Logic**: Update the `logout` function to ensure a clean state reset.
  - **Reload on Logout**: Add `window.location.reload()` or hard navigation after logout to ensure all in-memory states (React state, cached variables) are completely purged.
  - **Robust Error Handling**: Ensure `localStorage` and `user` state are cleared even if the backend logout call throws an error (though the server fix above should prevent this).

#### **3. UX Improvement (`client/src/pages/OfficerLogin.jsx`)**
- **Verify Redirect Logic**: The current logic automatically redirects residents to their dashboard if they visit the Officer Login page. Once the logout bug is fixed, this behavior will correctly send logged-in residents to their dashboard, and allow them to properly logout from there if they wish to switch accounts. No code changes are strictly necessary here once the root cause is fixed, but I will review it to ensure it handles the transition smoothly.

### **Verification Strategy**
1.  **Login as Resident**: Authenticate as a resident user.
2.  **Logout**: Click logout. Verify that the `authToken` cookie is removed from the browser.
3.  **Access Officer Page**: Navigate to `/officerlogin`.
4.  **Login as Admin**: Authenticate as an admin/officer.
5.  **Success**: Verify successful login without "Invalid CSRF token" errors or automatic redirection to the resident dashboard.
