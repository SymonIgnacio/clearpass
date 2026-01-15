I have completed the comprehensive analysis of the IT admin portal and identified significant redundancy across user management, backups, settings, and analytics.

Here is the precise consolidation plan to resolve these issues:

### **Phase 1: Cleanup & Redundancy Removal**
We will remove files that are duplicates or functionally inferior to existing modern implementations.

1.  **Delete `client/src/pages/admin/Backup.jsx`**
    *   **Reason:** Redundant. `AdminBackup.jsx` is the correct, full-featured implementation.
2.  **Delete `client/src/pages/Users.jsx`**
    *   **Reason:** Functionality is fully covered by other pages:
        *   *Resident Database* → Covered by `Residents.jsx`.
        *   *System Accounts* → Covered by `StaffManagement.jsx`.
        *   *Verification* → Covered by `DocumentVerification.jsx`.
3.  **Delete `client/src/pages/SuperAdminSettings.jsx`**
    *   **Reason:** Duplicate of `Settings.jsx`. We will handle role-based display within `Settings.jsx`.
4.  **Delete `client/src/pages/admin/AIAnalytics.jsx`**
    *   **Reason:** Low-value separate page. We will merge its unique metrics (Model Accuracy, Predictions) into `AdminReports.jsx`.

### **Phase 2: Code Consolidation & Updates**
We will update the remaining files to absorb the functionality of the deleted pages.

1.  **Update `client/src/pages/AdminReports.jsx`**
    *   Add a new **"AI Insights"** tab.
    *   Migrate the API call to `/admin/ai-metrics` and the display cards (Model Accuracy, Predictions) from `AIAnalytics.jsx` into this new tab.
2.  **Update `client/src/pages/Settings.jsx`**
    *   Add conditional rendering to show the "Administrative Access" badge only when `user.role === 1` (Admin).
3.  **Update `client/src/App.jsx`**
    *   Remove routes for `AIAnalytics`, `SuperAdminSettings`, and `Users`.
    *   Redirect `/admin/users` to `StaffManagement`.
    *   Redirect `/users` to `Residents`.

### **Phase 3: Navigation Structure (Sidebar)**
We will update `client/src/components/Sidebar.jsx` to reflect the streamlined architecture.

1.  **Update "User Management" Link**: Point to `/admin/staff` (Staff Management) instead of `/admin/users`.
2.  **Update "AI Insights" Link**: Point to `/reports` (or specifically the new AI tab) instead of `/ai-analytics`.
3.  **Verify "Backup & Restore"**: Ensure it points to `/admin/backup`.

### **Verification Steps**
*   **Check RBAC**: Confirm that `StaffManagement.jsx` correctly restricts access based on roles.
*   **Test Redirections**: Ensure clicking old links (if any cached) redirects to the correct new pages.
*   **Verify Reports**: Confirm `AdminReports.jsx` loads the new AI data correctly.

This plan will reduce the codebase by ~4 files and significantly clarify the navigation structure for IT admins.
