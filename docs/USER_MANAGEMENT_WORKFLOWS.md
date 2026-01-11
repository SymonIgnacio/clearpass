# User Management Workflows & Permissions

## Overview
This document outlines the user management system for ClearPass, covering Staff Management, Resident Management, and the Role-Based Access Control (RBAC) structure.

## 1. Role Hierarchy & Permissions
The system enforces a strict hierarchy to prevent privilege escalation.

| Level | Role Name | Description | Key Permissions |
| :--- | :--- | :--- | :--- |
| **1** | **Admin / IT Admin** | System Superuser | Full access to all modules, User Management, System Config. |
| **2** | **Captain** | Executive | Read-only access to all reports and dashboards. |
| **3** | **Secretary** | Operations Lead | Manage Residents, Certificates, Blotter, and Clearances. |
| **4** | **Clerk** | Staff | Process Certificates and view Resident profiles. |
| **6** | **Blotter Officer** | Security | Manage Blotter/Incident records. |
| **12** | **Resident** | End User | View own profile, Request documents. |

### Hierarchy Rules
1.  **Creation:** A user can only create staff with a **lower** hierarchy level (Higher Number) than themselves.
    *   *Exception:* Admins (Level 1) can create other Admins.
2.  **Editing:** A user cannot edit the profile of someone with a **higher or equal** hierarchy level.
    *   *Example:* A Secretary (Level 3) cannot edit an Admin (Level 1) or another Secretary (Level 3).

## 2. Staff Management Workflow

### Creating a New Staff Member
1.  Navigate to **Admin > Staff Management**.
2.  Click **"Add Staff"**.
3.  **Step 1: Account Credentials**
    *   Enter Username, Email, and Password.
4.  **Step 2: Personal Information**
    *   Enter First Name and Last Name.
5.  **Step 3: Role Assignment**
    *   Select a Role from the dropdown.
    *   *Note:* The dropdown only shows roles allowed for your level.
6.  **Step 4: Confirm**
    *   Review and submit.

### Modifying Staff Roles
1.  Locate the staff member in the directory.
2.  Click the **Edit (Pencil)** icon.
3.  Change the **Role** dropdown.
4.  **Security Check:** The system will reject the request if you attempt to promote them above your own rank.

## 3. Resident Management Workflow

### Creating a Resident (Admin Side)
1.  Navigate to **Residents > Masterlist**.
2.  Click **"Add Resident"**.
3.  Fill in the demographic form (Name, Address, etc.).
4.  **System Action:**
    *   Creates a `residents` record.
    *   Automatically creates a linked `users` account (Role: Resident).
    *   Generates a temporary password.

### Resident Self-Registration
1.  User visits the public `/register` page.
2.  Fills in personal details and uploads ID.
3.  **System Action:**
    *   Creates a `users` account.
    *   Creates a `resident_applications` record (Status: Pending).
4.  **Verification:**
    *   Secretary reviews application in **Admin > Applications**.
    *   Upon approval, the system moves data to the `residents` table.

### Managing Account Status
1.  Navigate to **Residents**.
2.  Select a resident.
3.  Use the **"Active/Inactive"** toggle.
    *   **Effect:** This updates both the Resident Profile status and the User Login `is_active` flag.

## 4. Audit Logging
All user management actions are logged for security auditing.

| Action | Event Type | Details Logged |
| :--- | :--- | :--- |
| Create Staff | `USER_CREATED` | Creator ID, New User ID, Assigned Role |
| Update Staff | `USER_UPDATED` | Updater ID, Target ID, Fields Changed |
| Change Role | `ROLE_CHANGED` | Old Role, New Role |
| Login Failure | `LOGIN_FAILED` | IP Address, Username Attempted |

Logs are stored in:
1.  **Database:** `audit_logs` table (Viewable in System Logs).
2.  **File System:** `server/logs/audit.log` (For backup).
