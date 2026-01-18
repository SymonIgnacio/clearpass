I will fix the issues with the resident dashboard, sidebar visibility, and profile access.

### **Analysis of Remaining Issues**

1.  **Sidebar Visibility**:
    *   **Issue**: "My dashboard doesnt appear on my sidebar".
    *   **Cause**: In `Sidebar.jsx`, the "My Dashboard" menu item (`/resident/dashboard`) is restricted to role `[12]` (Resident).
    *   **Fix**: Update the `roles` array for "My Dashboard" to include `13` (Guest).

2.  **Dashboard Infinite Loading**:
    *   **Issue**: "it just keeps on loading and loading".
    *   **Cause**: My previous fix in `ResidentDashboard.jsx` moved the `requestsData` definition, but I suspect the `fetchDashboardData` function might be hitting an error or not completing for guests. Specifically, if `user.resident_id` is null, it skips the certificate fetch, but we need to ensure `setLoading(false)` is always reached.
    *   **Verification**: Reviewing the code again, the `finally { setLoading(false) }` block is present. However, if the profile fetch fails silently or returns an unexpected structure, it might be an issue.
    *   **Refinement**: Ensure the `fetchDashboardData` logic robustly handles the "Guest" state where `user.resident_id` is null. The manual profile construction seems correct, but I'll double-check.

3.  **Profile Access Denied**:
    *   **Issue**: "when im trying to access my profile it says that im unauthorized".
    *   **Cause**: The sidebar links to `/resident/profile`. The backend route `/api/resident-auth/profile` in `residentAuthRoutes.js` (lines 305-342) is protected by `checkRole(['resident'])`.
    *   **Conflict**: `checkRole(['resident'])` maps to Role 12. Guests are Role 13.
    *   **Fix**: Update `residentAuthRoutes.js` to allow `['resident', 'guest']` (or Roles 12 and 13) for the profile endpoint. Also, update the logic inside the route to handle `resident_id` being null (fetch from `resident_applications` as a fallback, similar to what I did in `residentProfileController.js`). Wait, `residentProfileController.js` handles `/api/resident-profile/profile`, but `residentAuthRoutes.js` handles `/api/resident-auth/profile`. The frontend seems to be using `/resident-auth/profile` in `ResidentDashboard.jsx` (line 130). I need to align them.

4.  **Documents Error**:
    *   **Issue**: "when i try to access my documents it says this [Error]".
    *   **Cause**: `ResidentDocuments.jsx` imports `Error` from `@mui/icons-material` but tries to use it as a constructor `throw new Error(...)`.
    *   **Fix**: Confirm the alias `import { ... Error as ErrorIcon ... }` is applied. My previous attempt might have had a race condition or partial apply. I will re-apply the fix to be certain.

### **Fix Plan**

1.  **Update `client/src/components/Sidebar.jsx`**:
    *   Add Role 13 to "My Dashboard" menu item.

2.  **Update `server/routes/residentAuthRoutes.js`**:
    *   Update `/profile` endpoint to allow Role 13 (`guest`).
    *   Add logic to fetch profile from `resident_applications` if `resident_id` is null.

3.  **Verify/Fix `client/src/pages/ResidentDocuments.jsx`**:
    *   Ensure `Error` is aliased to `ErrorIcon`.

4.  **Verify `client/src/pages/ResidentDashboard.jsx`**:
    *   Ensure data fetching doesn't hang.

**Verification Plan:**
1.  Reload as Guest.
2.  Check Sidebar -> "My Dashboard" should be visible.
3.  Click "My Dashboard" -> Should load without hanging.
4.  Click "My Profile" -> Should load profile data (from application).
5.  Click "My Documents" -> Should load without error.
