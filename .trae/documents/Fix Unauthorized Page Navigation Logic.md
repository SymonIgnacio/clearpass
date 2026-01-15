I will fix the "Access Denied" navigation issue by updating the `Unauthorized.jsx` component.

**Goal:** Ensure that when a user clicks "Go to Dashboard" from the Access Denied page, they are redirected to the correct dashboard based on their role, rather than defaulting to the IT Admin dashboard (`/`).

**Plan:**
1.  **Modify `Unauthorized.jsx`:**
    *   Import `useAuth` to access the current user's role.
    *   Create a `handleDashboardRedirect` function that checks `user.role` and navigates to the appropriate path:
        *   **Resident (Role 12):** Navigate to `/resident/dashboard`.
        *   **Secretary (Role 3):** Navigate to `/secretary/dashboard`.
        *   **Clerk (Role 4):** Navigate to `/clerk/dashboard`.
        *   **Blotter Officer (Role 6):** Navigate to `/officer/dashboard`.
        *   **Captain (Role 2):** Navigate to `/captain/dashboard`.
        *   **Admin (Role 1):** Navigate to `/` (default).
    *   Update the "Go to Dashboard" button `onClick` handler to use this new function.

This change will prevent residents or other staff from being accidentally routed to the IT Admin dashboard path (which they can't access anyway) and getting stuck in a loop.
