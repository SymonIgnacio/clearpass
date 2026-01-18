I will fix the resident registration and role assignment issues by aligning the JWT payload structure and cookie handling with the main authentication flow.

**Analysis of the Issue:**
1.  **"Super Admin" Label:** The registration endpoint (`residentAuthRoutes.js`) generates a JWT and user object that includes `role: 13` but is missing the `role_name` property. The frontend `Header.jsx` likely defaults to "Super Admin" (or a fallback) when `role_name` is undefined or when the role ID isn't recognized in its limited `color` logic.
2.  **"Access Denied":**
    *   Newly registered residents are assigned Role 13 (Guest/Pending).
    *   The frontend `App.jsx` protects resident routes (`/resident/*`) with `requiredRoles={[12]}` (Resident).
    *   Role 13 is not in the allowed list for these routes, causing the `ProtectedRoute` to redirect to `/unauthorized` or show "Access Denied".
    *   The "Go to Dashboard" button likely tries to redirect to `/resident/dashboard` (for role 12), creating a loop or dead end for role 13.
3.  **Cookie Issue:** The registration endpoint returns the token in the JSON body but fails to set the `authToken` httpOnly cookie, which is required for the `verifyToken` middleware on subsequent requests (like `checkRole`).

**Plan:**

1.  **Update Backend (`residentAuthRoutes.js`):**
    *   **Fix JWT Payload:** Ensure the token signed during registration matches the structure in `authController.js` (using integer `id` from `users` table, not string `resident_id`).
    *   **Add Role Name:** Include `role_name: 'Guest'` (or 'Pending Verification') in the response user object and JWT.
    *   **Set Cookie:** Implement `res.cookie('authToken', ...)` logic identical to `authController.login` to ensure the session is established immediately upon registration.

2.  **Update Frontend (`App.jsx`):**
    *   **Allow Guests:** Update the `requiredRoles` for `/resident/dashboard` and `/resident/profile` to include Role 13 (Guest). This allows pending users to access their dashboard to see their status or upload requirements.
    *   **Redirect Logic:** Update `RoleBasedDashboard` component to handle Role 13 and redirect them to `/resident/dashboard` instead of the default admin dashboard.

3.  **Update Frontend (`Header.jsx`):**
    *   **Fix Role Label:** Update the `Chip` logic to handle `user.role_name === 'Guest'` or `user.role === 13` explicitly, preventing the "Super Admin" fallback.

**Task List:**
1.  Modify `server/routes/residentAuthRoutes.js` to fix JWT payload, add `role_name`, and set httpOnly cookie.
2.  Update `client/src/App.jsx` to allow Role 13 access to resident routes.
3.  Update `client/src/components/Header.jsx` to display "Guest" or "Pending" correctly.

This approach resolves the immediate "Access Denied" error by granting permissions to the Guest role and fixes the "Super Admin" visual bug by providing the correct metadata.