I will fix the issue where the sidebar initially displays "User" and "Staff" after logging in as a resident/guest, instead of the correct name and role.

### **Analysis**

1.  **The Root Cause:**
    *   The `ResidentLogin` page uses the endpoint `/api/resident-auth/login`.
    *   This endpoint returns a user object with a `name` property:
        ```javascript
        user: {
          ...,
          name: user.full_name || user.username,
          role_name: ROLE_NAMES[13],
          ...
        }
        ```
    *   However, the **Sidebar component** expects a `full_name` property (based on my previous fix):
        ```javascript
        {user.full_name || user.username || 'User'}
        ```
    *   **Mismatch:** The login response sends `name`, but the Sidebar looks for `full_name`.
    *   **Why it fixes on refresh:** When you refresh, the app calls `/api/auth/me`. This endpoint uses the standard user schema which likely includes `full_name` (or we need to ensure it does), aligning with the Sidebar's expectation.

### **Fix Plan**

1.  **Update `server/routes/residentAuthRoutes.js`**:
    *   Modify the login response to send `full_name` instead of (or in addition to) `name` to be consistent with the rest of the application and the Sidebar's logic.
    *   **Change:** `name: user.full_name || user.username` -> `full_name: user.full_name || user.username`.

2.  **Verify `server/controllers/authController.js` (Optional but good practice)**:
    *   Ensure the `me` endpoint consistently returns `full_name` for all user types. (Previously verified it returns `u.*`, and `users` table has `full_name`).

**Verification Plan:**
1.  Log out and log in again as a Guest/Resident.
2.  Observe the sidebar immediately after login.
3.  It should display the full name (e.g., "Symon Ignacio") and role ("Guest" or "Resident") without needing a refresh.
