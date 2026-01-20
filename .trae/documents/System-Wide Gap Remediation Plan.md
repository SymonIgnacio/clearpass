I have conducted a comprehensive system-wide analysis and identified critical gaps in role management, data integrity, and security. Below is the remediation plan to align the frontend, backend, and database.

### 1. Fix Role Misalignment (Critical)
**Issue:** The frontend `permissions.js` uses legacy ID `5` for IT Admin, while the backend `roles.js` uses `1`. This breaks navigation for seeded admins.
**Action:**
*   Update `client/src/utils/permissions.js` to import `ROLES` from a shared constant or hardcode the correct ID `1`.
*   Standardize backend role checks to use the `ROLES` constant everywhere.

### 2. Unify Resident Data Flow
**Issue:** Resident data is fragmented across `users`, `residents`, and `resident_applications`, leading to sync risks where a user remains a "Guest" despite approval.
**Action:**
*   Create a robust `approveApplication` transaction in `secretaryController.js` that updates `resident_applications` status AND promotes `users.role` to `RESIDENT (12)` in one atomic operation.
*   Ensure the frontend `ResidentDashboard.jsx` correctly handles the transition state.

### 3. Align Database Schema & Frontend
**Issue:** `Email` vs `Mobile_Number` confusion in `households`/`residents` tables causing potential data loss in forms.
**Action:**
*   Audit `ResidentForm.jsx` and `SmartResidentSearch.jsx` to ensure they use the correct column names (`Email` for residents, `Mobile_Number` for legacy/households if applicable).
*   Verify `document_templates` uses `LONGBLOB` to prevent truncation of large templates.

### 4. Security & Hardcoding Fixes
**Issue:** CSRF disabled for certificates; Hardcoded "Barangay Batia" strings.
**Action:**
*   Re-enable CSRF protection for `/api/certificates` and fix the underlying CORS/SameSite configuration.
*   Replace hardcoded location strings in `documentController.js` and `templateController.js` with dynamic lookups from the `system_settings` table.

### 5. API Standardization
**Issue:** Inconsistent error responses (`{error}` vs `{success: false}`).
**Action:**
*   Standardize `certificateRequestController.js` and `documentController.js` to return `{ success: false, message: '...' }` for consistency with the frontend error handlers.

### Immediate Next Steps
I will proceed with **Task 1 (Role Alignment)** and **Task 5 (API Standardization)** as they are blocking the correct flow of the features we just built. Then I will address the data integrity issues.