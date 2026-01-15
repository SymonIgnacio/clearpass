I will implement the Role-Based Access Control (RBAC) and dashboard separation as requested, ensuring strict adherence to the system requirements.

### 1. Separate Dashboards
I will create two new dedicated dashboard components to replace the generic one for specific roles:
*   **`ClerkDashboard.jsx` (Role 4)**:
    *   **Features**: Focus on Certificate Issuance, Resident Verification, and Workload.
    *   **Data**: Certificates issued, Pending verifications.
    *   **Actions**: Issue Certificate, Verify Resident.
    *   **Restrictions**: No Blotter data/actions.
*   **`BlotterDashboard.jsx` (Role 6)**:
    *   **Features**: Focus on Case Management, Crime Analytics, and Patrols.
    *   **Data**: Active Cases, Resolved Cases, Crime Hotspots.
    *   **Actions**: Report Incident, View Blotter.
    *   **Restrictions**: No Certificate data/actions.

### 2. RBAC Enforcement (Frontend)
*   **`App.jsx`**:
    *   Route `/clerk/dashboard` to `ClerkDashboard`.
    *   Route `/officer/dashboard` to `BlotterDashboard`.
    *   Restrict `/residents` route to Roles `[1, 2, 3, 4]` (Admin, Captain, Secretary, Clerk). *Blotter Officer will rely on Case Management for resident lookups if needed.*
    *   Ensure all protected routes have explicit `requiredRoles`.
*   **`Sidebar.jsx`**:
    *   Add Role 4 (Clerk) to "Resident Records" link (read-only list access).
    *   Add Role 6 (Blotter Officer) links for "Attendance" and "Reports".
    *   Ensure hidden links remain hidden for unauthorized roles.
*   **`WriteProtected.jsx`**:
    *   Update logic to block Role 4 (Clerk) from write actions (Add Resident, Add Household, Bulk Import) in the Residents page, enforcing the "Cannot manually register residents" requirement.

### 3. Verification
*   I will verify that Clerk can view the resident list but cannot add/import residents.
*   I will verify that Blotter Officer sees the specific Blotter Dashboard and cannot access unrelated pages.
*   I will verify that unauthorized direct URL access redirects to `/unauthorized`.
