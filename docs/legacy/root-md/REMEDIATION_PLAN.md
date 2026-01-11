# Remediation Plan: Critical System Fixes

**Date:** January 11, 2026
**Priority:** Critical
**Status:** In Progress

---

## 1. Objective
To immediately resolve critical blocking issues in user creation, security, and database alignment identified in the Audit Report (01/11).

## 2. Phased Implementation

### Phase 1: Critical Fixes (Immediate Action)
**Goal:** Restore functionality for Resident Registration and Admin User Management.

#### 1.1 Fix Resident Controller (`server/controllers/residentController.js`)
-   **Security Fix:** Replace `crypto.createHash('sha256')` with `bcrypt.hash()` to match the login system.
-   **Schema Fix (Users):**
    -   Target column: `password_hash` (was `password`).
    -   Target column: `role` (was implicit string `'resident'`).
    -   Value Fix: Use integer `12` (Resident Role ID) instead of string `'resident'`.
-   **Schema Fix (Residents):**
    -   Ensure `QR_Hash_String` generation is robust.

#### 1.2 Fix Admin Controller (`server/controllers/adminController.js`)
-   **Schema Fix:**
    -   Target column: `role` (was `role_id`).
    -   Ensure `role` values are passed as integers.

### Phase 2: Feature Completion
**Goal:** Enable missing functionality.

#### 2.1 Implement File Uploads
-   **Component:** `residentController.js`
-   **Action:** Replace placeholder `req.files` logic with actual file processing (using `multer` or raw file handling if already set up) to save documents to `uploads/documents/`.

### Phase 3: Data Integrity & Verification
**Goal:** Ensure system stability.

#### 3.1 Verification Steps
1.  **Test:** Create a new Resident via the "Open Register" endpoint.
    -   *Expected:* User created in `users` table with valid BCrypt hash.
    -   *Expected:* Resident created in `residents` table.
2.  **Test:** Login with the new Resident credentials.
    -   *Expected:* Successful login (Token issued).
3.  **Test:** Create a new Staff user via Admin panel.
    -   *Expected:* User created in `users` table with correct `role` integer.

---

## 3. Execution Log

- [ ] Create Remediation Plan
- [ ] Fix `residentController.js`
- [ ] Fix `adminController.js`
- [ ] Verify Fixes
