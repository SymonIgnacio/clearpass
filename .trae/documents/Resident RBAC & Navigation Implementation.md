# Resident RBAC Implementation Plan

I have analyzed the current RBAC system and identified that while the backend and route structure support residents (Role ID: 12), the UI (Sidebar) and Root routing are not optimized for them. The current Sidebar does not expose resident-specific features, and the root path `/` loads a staff-centric dashboard.

## 1. Sidebar & Navigation Updates
**File:** `client/src/components/Sidebar.jsx`
- **Objective:** Provide a dedicated navigation experience for residents.
- **Changes:**
  - Remove `12` (Resident) from the generic "Dashboard" (`/`) menu item.
  - Add a dedicated "Resident Dashboard" item pointing to `/resident/dashboard`.
  - Create a new "Resident Services" menu group containing:
    - **My Profile**: `/resident/profile`
    - **Request Certificate**: `/resident/request-certificate`
    - **Request History**: `/resident/requests`
    - **File Complaint**: `/resident/blotter-report`
    - **Complaint History**: `/resident/complaints`
    - **Announcements**: `/resident/announcements`

## 2. Route Guard & Redirection
**File:** `client/src/App.jsx`
- **Objective:** Ensure residents landing on `/` are correctly directed to their specific dashboard.
- **Changes:**
  - Implement a `RoleBasedDashboard` wrapper for the index route.
  - Logic: If `user.role === 12`, redirect to `/resident/dashboard`. Otherwise, render the standard staff `Dashboard`.

## 3. Permission Definitions
**File:** `client/src/utils/permissions.js`
- **Objective:** Ensure all resident capabilities are explicitly defined.
- **Changes:**
  - Verify `PERMISSIONS.RESIDENT` covers all new menu items (it currently seems comprehensive, but I will double-check `VIEW_OWN_CERTIFICATES` vs `REQUEST_HISTORY` usage).

## 4. Documentation
**File:** `docs/RBAC_UPDATE.md` (New File)
- **Objective:** Document the RBAC structure for future reference.
- **Content:**
  - Role ID mappings (highlighting Resident=12).
  - Navigation structure per role.
  - Route protection rules.

## Execution Steps
1.  **Refactor Sidebar**: Update `menuStructure` to split Staff vs. Resident views.
2.  **Update Routing**: Implement the root path redirection logic in `App.jsx`.
3.  **Verify**: Check that a Resident user sees the correct menu and cannot access staff pages (already handled by `ProtectedRoute`, but the UI won't show links).
4.  **Document**: Create the RBAC documentation.
