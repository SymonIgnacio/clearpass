I have analyzed the logs and the code. The error `net::ERR_ABORTED` along with the stack trace pointing to `ResidentDashboard.jsx:103` (which is a `window.location.reload()`) indicates an infinite reload loop.

**Root Cause:**
The `ResidentDashboard` component checks for specific "unread" notifications (like "Residency Verified") and triggers a page reload to refresh the user's session/role. However, it does not mark the notification as "read" before reloading. As a result:
1.  The page reloads.
2.  The component mounts and fetches notifications again.
3.  The same unread notification is found.
4.  The page reloads again.
5.  This loop causes the browser to abort network requests (`ERR_ABORTED`) and eventually fail.

**Proposed Solution:**
I will modify `client/src/pages/ResidentDashboard.jsx` to break this loop by:
1.  **Marking the notification as read** immediately when it triggers an action, using `markAsRead` from `NotificationContext`.
2.  **Replacing `window.location.reload()`** with `refreshUser()` from `AuthContext`. This updates the user's session/role without a full page reload, which is smoother and faster.

**Implementation Plan:**
1.  **Update `ResidentDashboard.jsx`**:
    *   Import `markAsRead` from `useNotifications`.
    *   Import `refreshUser` from `useAuth`.
    *   Modify the `useEffect` hook that handles notifications to call `markAsRead(latest.id)` and `refreshUser()` instead of `window.location.reload()`.

**Verification:**
After applying the fix, the infinite reload loop should stop, and the console errors (`ERR_ABORTED`) should disappear. The dashboard should correctly update the user's status when a verification notification is received.