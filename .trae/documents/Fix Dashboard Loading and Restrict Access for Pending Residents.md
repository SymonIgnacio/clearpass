I will fix the infinite loading issue and update the dashboard to be accessible but restricted for pending users.

### 1. Fix Infinite Loading (Server-Side)
**Problem:** The `/api/auth/me` endpoint (used for session restoration) does not return the `type: 'resident'` property or other necessary fields (`resident_id`, `residency_status`, `name`) that `ResidentDashboard.jsx` relies on. This causes the `useEffect` hook to skip fetching data, leaving the page in a loading state.
**Fix:** Update `server/controllers/authController.js` in the `me` function to include:
- `resident_id`: from `user.resident_id`
- `residency_status`: from `user.Residency_Status`
- `name`: `user.full_name || user.username` (to match `residentAuthRoutes` behavior)
- `type`: Set to `'resident'` if the role is 12 (Resident) or 13 (Guest), otherwise `'staff'`.

### 2. Update Dashboard Access (Client-Side)
**Problem:** The current "Pending Verification" view blocks the entire page with a full-screen message. The user wants to access the dashboard pages but with restricted functionality.
**Fix:** Modify `client/src/pages/ResidentDashboard.jsx`:
- Remove the blocking `if (user?.role === 13 ...)` return statement.
- Inside the main render:
    - Add a prominent `Alert` or Banner at the top if the status is "Pending Verification".
    - Disable the "Request Certificate" and "File Complaint" buttons (e.g., set `disabled={isPending}` and change text).
    - Optionally, show a "Locked" icon or message on the "Recent Requests" card.
    - Ensure the `useEffect` checks for both `type === 'resident'` and roles 12/13 to be robust.

This will resolve the loading issue and provide the requested restricted access experience.