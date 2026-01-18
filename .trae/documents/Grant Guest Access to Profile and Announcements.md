I have confirmed the cause of the "Access Denied" issue.

**Analysis:**
1.  **Frontend Routing (`App.jsx`):** The routes `/resident/profile` and `/resident/announcements` currently have `requiredRoles={[12]}`.
    *   Role 12 = Resident (Verified)
    *   Role 13 = Guest (Pending)
    *   Since the user is Role 13 (Guest), the `ProtectedRoute` component correctly blocks access and shows the "Access Denied" page.
2.  **Backend Routes (`residentAuthRoutes.js`):** The `/profile` endpoint also has `checkRole(['resident'])` middleware, which might need adjustment or exception handling for Role 13 users who want to view their *application* details as their "profile". However, the frontend route guard is the immediate blocker.

**Plan:**
1.  **Update Frontend Routing (`App.jsx`):**
    *   Allow Role 13 (Guest) to access `/resident/profile` and `/resident/announcements`.
    *   Change `requiredRoles={[12]}` to `requiredRoles={[12, 13]}` for these routes.

2.  **Verify/Update Backend Profile Access:**
    *   The `/profile` endpoint currently expects a `resident_id`. For Role 13 (Guest), they don't have a `resident_id` yet (it's null).
    *   The frontend `ResidentProfile.jsx` (which I will check) likely calls `/resident-auth/profile`.
    *   I need to ensure `ResidentProfile.jsx` handles the "Pending" state gracefully (fetching from application data instead of resident data if `resident_id` is missing), or update the backend `/profile` endpoint to return application data for guests.
    *   *Self-correction:* The `ResidentDashboard.jsx` already handles fetching application data for guests. I should check if `ResidentProfile.jsx` does the same. If not, I'll update it to be compatible with guests.

I will start by updating the frontend routes in `App.jsx` as that is the primary blocker. Then I will check `ResidentProfile.jsx` to ensure it doesn't crash for guests.