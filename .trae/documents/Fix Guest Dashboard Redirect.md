I have identified the issue. The user is logged in as a "Guest" (Role 13), but they are seeing the Admin Dashboard elements. This is likely because the `AppShell` or `Header` components are displaying elements that should be hidden for guests, or the redirect logic in `App.jsx` isn't catching the Guest role correctly for the dashboard redirect.

The user provided a screenshot showing they are on a dashboard that says "Barangay Command Center" with stats like "Total Population", which is the Admin/Staff dashboard. They also have a sidebar with "Resident Portal".

**Root Cause Analysis:**
1.  **Redirect Logic:** In `App.jsx`, `RoleBasedDashboard` only checks for `role === 12` (Resident) to redirect to `/resident/dashboard`. It **does not** check for `role === 13` (Guest).
    ```javascript
    const RoleBasedDashboard = () => {
      const { user } = useAuth()
      if (user && parseInt(user.role) === 12) { // Missing check for 13
        return <Navigate to="/resident/dashboard" replace />
      }
      return <Dashboard /> // Falls back to Admin Dashboard
    }
    ```
2.  **Header:** The header title "Barangay Batia Management System" is generic, but the user is seeing the admin dashboard content.

**Plan:**
1.  **Update `App.jsx`:** Modify `RoleBasedDashboard` to redirect **both** Role 12 (Resident) and Role 13 (Guest) to `/resident/dashboard`.
2.  **Verify Sidebar/Header:** Ensure the Sidebar and Header are appropriate for the Guest role (which I've already done in previous steps, but the redirect is the key fix here).

This simple fix will ensure that when a Guest logs in, they are immediately sent to their specific dashboard instead of falling through to the default (Admin) dashboard.
