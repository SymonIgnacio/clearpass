I will proceed with the fix for the user state mismatch and verification logic as outlined in the confirmed plan.

### **Phase 1: Diagnosis & Data Inspection (Terminal)**
1.  **Run DB Audit**: Use `mysql.exe` to inspect the `users`, `residents`, `resident_applications`, and document tables for `Symonignacio1@gmail.com`.
    *   Confirm if the user has `role: 13` (Guest) despite having "Verified" documents.
    *   Check if a `residents` record was created but not linked.

### **Phase 2: Backend Fix (Safe Refactoring)**
1.  **Refactor Application Approval (`secretaryRoutes.js`)**:
    *   Modify `POST /applications/:id/approve` to **update existing Guest users** instead of returning a 409 Conflict error.
    *   Ensure it correctly links the new `resident_id` to the existing `users` row and promotes `role` to 12.
2.  **Refactor Document Verification (`secretaryRoutes.js`)**:
    *   Update `POST /documents/:id/verify` for `source_type='application'`.
    *   Ensure that verifying the document **also** triggers the application approval/user promotion logic (currently it might be missing this link for application docs).

### **Phase 3: Session & Frontend Consistency**
1.  **Update Auth Response (`authController.js`)**:
    *   Modify `/api/auth/me` to explicitly return `resident_id` so the frontend can detect the new status immediately without a full re-login.
2.  **Fix Dashboard Stats (`ResidentDashboard.jsx`)**:
    *   Refactor the "Pending Requests" calculation to stop counting "Verification Placeholders" if a real verification document exists.
    *   Ensure status strings (`Verified`, `Approved`, `Active`) are handled consistently.

### **Phase 4: Final Verification**
1.  **Re-run DB Audit**: Confirm the user `Symonignacio1@gmail.com` is now Role 12 (Resident) and `Residency_Status` is Active.
2.  **Check Dashboard**: Verify "Pending Requests" is 0 and "Completed" is accurate.