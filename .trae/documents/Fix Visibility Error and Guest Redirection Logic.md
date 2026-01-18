I have identified the two issues reported.

### **Issue 1: `ReferenceError: Visibility is not defined`**
*   **Cause:** The `Visibility` icon was removed from the named imports but not yet added as a default import (or the previous edit failed to apply it correctly). The component tries to use `<Visibility />` but the variable doesn't exist.
*   **Fix:** I will explicitly add `import Visibility from '@mui/icons-material/Visibility';` to `ResidentDashboard.jsx`.

### **Issue 2: Guest Redirecting to Admin Dashboard**
*   **Cause:** When the `ErrorBoundary` catches an error (like the ReferenceError above), the "Go Home" button likely uses a hardcoded path or a logic that defaults to `/` or `/dashboard`. If the `ProtectedRoute` or `AuthContext` logic sees the user is logged in (even as a guest), it might be misrouting them, OR the "Go Home" button in the error boundary itself is pointing to the wrong place.
*   **Fix:** I will check `ErrorBoundary.jsx`.
    *   If it hardcodes `/admin/dashboard`, I will change it to check the user's role or default to `/resident/dashboard` for guests.
    *   If it uses `window.location.href = '/'`, I will ensure the root route redirects correctly based on the user role.

### **Plan**
1.  **Fix `ResidentDashboard.jsx`:** Add the missing `Visibility` import.
2.  **Fix `ErrorBoundary.jsx`:** Update the "Go Home" button logic to redirect intelligently based on the user's role (Resident vs Admin).

I will start by fixing the import error, which is the root cause of the crash. Then I will inspect the ErrorBoundary.