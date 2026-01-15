# Resident RBAC & Navigation Updates

## Overview
This document details the modifications made to the Role-Based Access Control (RBAC) system to support a dedicated Resident experience.

## Role Definition
- **Role Name**: Resident
- **Role ID**: `12`
- **Access Level**: Self-Service Only

## Changes Implemented

### 1. Navigation Structure (`Sidebar.jsx`)
The sidebar navigation has been split to provide a tailored view for residents versus staff.

**Resident Menu (Role 12 Only):**
- **My Dashboard**: `/resident/dashboard` (Replaces generic Dashboard)
- **My Services**:
  - My Profile: `/resident/profile`
  - Request Certificate: `/resident/request-certificate`
  - My Requests: `/resident/requests`
  - File Complaint: `/resident/blotter-report`
  - My Complaints: `/resident/complaints`
  - Announcements: `/resident/announcements`

**Staff Menu (Roles 1, 2, 3, 4, 6):**
- **Dashboard**: `/` (Generic Command Center)
- **Resident Services** (Staff View)
- **Case Management**
- **Analytics**
- **Administration**

### 2. Route Protection (`App.jsx`)
- **Root Redirection**: A `RoleBasedDashboard` component now intercepts the root path `/`.
  - If User is Resident (Role 12) -> Redirects to `/resident/dashboard`.
  - If User is Staff -> Renders standard `Dashboard`.
- **Route Guards**: All resident-specific routes are protected with `requiredRoles={[12]}`.

## Verification
To verify these changes:
1.  **Login as Resident**:
    - Should land on `/resident/dashboard`.
    - Sidebar should show "My Dashboard" and "My Services".
    - Should NOT see "Administration" or "Case Management".
2.  **Login as Staff (e.g., Captain)**:
    - Should land on `/` (Command Center).
    - Sidebar should show standard staff menu.
    - Should NOT see "My Services".

## Future Maintenance
- When adding new resident features, add them to the `residentServices` group in `Sidebar.jsx` and ensure `roles: [12]` is set.
- Ensure new routes in `App.jsx` are wrapped in `<ProtectedRoute requiredRoles={[12]}>`.
