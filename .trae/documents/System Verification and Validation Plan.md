I will conduct a comprehensive "System Verification & Validation" (V&V) phase using the `barangay_management_test` database. This involves expanding the test coverage to include RBAC and the remaining core modules.

### Verification Plan

1.  **Environment Preparation**:
    *   Reset and seed the `barangay_management_test` database to ensure a clean state with all default roles (`superadmin`, `captain`, `secretary`, `clerk`).

2.  **Baseline Verification**:
    *   Execute the existing test suite (`residents`, `blotter`, `households`) to confirm the core registry modules are stable.

3.  **Gap Closure - New Integration Tests**:
    *   **RBAC & Authentication (`auth_rbac.test.js`)**:
        *   Verify Login for all roles (Admin, Captain, Secretary, Clerk).
        *   **Negative Testing**: Confirm `Clerk` *cannot* access Admin routes; `Resident` *cannot* access Staff routes.
    *   **Certificates Module (`certificates.test.js`)**:
        *   Test the full lifecycle: `Request` -> `Approve` -> `Generate/Print`.
    *   **Engagement Module (`programs_announcements.test.js`)**:
        *   Verify CRUD operations for Programs and Announcements.

4.  **Final Execution**:
    *   Run the full expanded test suite.
    *   Generate a final "System Health Report" summarizing the pass/fail status of every module.

I will begin by creating the new test files to cover the gaps found in the previous audit.