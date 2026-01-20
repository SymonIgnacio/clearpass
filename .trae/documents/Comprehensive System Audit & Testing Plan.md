I have conducted a full recursive scan of the workspace and refined the plan to be exhaustive. I will execute this plan by creating a tracking document `SYSTEM_AUDIT_PLAN.md` and then proceeding phase-by-phase with partial testing as requested.

### **Phase 1: Foundation & Security Scan**
*   **Objective**: Verify the integrity of the base system (Env, DB, Security).
*   **Checklist**:
    *   [ ] **Environment Validation**: Run `npm run validate-env` to check all required variables.
    *   [ ] **Database Health**: Verify connection pooling and schema integrity using `server/services/DatabaseService.js`.
    *   [ ] **Dependency Audit**: Run `npm audit` to check for known vulnerabilities in `package.json`.
    *   [ ] **RBAC Route Scan**: Execute a custom script to audit all **27 route files** (including `adminRoutes`, `residentRoutes`, `aiRoutes`) for missing `verifyToken` or `checkRole`.
    *   [ ] **Secret Scanning**: Regex scan for hardcoded credentials.

### **Phase 2: Core Services Logic Audit (Partial Test)**
*   **Objective**: Test the "nervous system" of the application.
*   **Checklist**:
    *   [ ] **Authentication**: Test Login (Resident/Admin/Officer), MFA Flow (`mfaOtp.js`), and Logout.
    *   [ ] **User Management**: Test Staff Creation, Role Updates, and Soft Deletion (`userController.js`).
    *   [ ] **Resident Identity**: Test Registration, Profile Update, and Household Linking (`residentController.js`).
    *   [ ] **Communication Infrastructure**:
        *   **Email**: Test `emailService.js` (using mock transport to verify logic without sending).
        *   **Real-time**: Verify `websocketService.js` initialization and connection handling.

### **Phase 3: Operational Modules Audit (Partial Test)**
*   **Objective**: specific functional workflows.
*   **Checklist**:
    *   [ ] **Certificates**:
        *   Resident Request (`certificateRequestController`).
        *   Admin Approval & Generation (`certificateController`, `docxtemplater`).
        *   **Template Management**: Admin Template Upload (`templateRoutes.js`).
    *   [ ] **Blotter & Justice**:
        *   Case Creation & Status Updates (`blotterController`).
        *   Resident-Admin Sync (`blotterComplaintController`).
    *   [ ] **Community Programs**:
        *   Event Creation & Participant Addition (`programController`).
    *   [ ] **Announcements**: Creation and Visibility (`announcementRoutes.js`).

### **Phase 4: Advanced Features & Jobs Audit (Partial Test)**
*   **Objective**: specific high-value features.
*   **Checklist**:
    *   [ ] **AI Integration**: Trigger `AIAnalysisService` and verify it logs to `ai_analysis_runs`.
    *   [ ] **Reporting**: Test PDF/CSV generation logic (`reportController`).
    *   [ ] **Background Jobs**: Manually trigger `documentRetention.js` logic to verify cleanup rules.

### **Phase 5: Frontend & Uploads Validation (Partial Test)**
*   **Objective**: Verify UI interactions for files.
*   **Checklist**:
    *   [ ] **Resident ID Upload**: Validate `CertificateRequest.jsx` handling.
    *   [ ] **System Assets**: Validate Seal/Letterhead upload (`systemAdminController.js`).
    *   [ ] **Verification**: Check `VerificationUploadModal.jsx` logic.

### **Phase 6: Reporting**
*   **Objective**: Consolidate findings.
*   **Deliverables**:
    *   `SYSTEM_AUDIT_PLAN.md`: The living checklist.
    *   `AUDIT_REPORT_2026.md`: Detailed findings.
    *   `TEST_CASES_2026.md`: Execution logs.

**Execution Policy**:
*   I will pause after every phase if critical issues are found.
*   I will use **non-destructive** test data (marked with `is_test=1` or similar where possible, or cleaned up immediately).
*   I will **not** modify existing code logic unless strictly necessary to fix a critical blocker preventing the audit itself.

**Confirmation**:
I am ready to create the `SYSTEM_AUDIT_PLAN.md` and begin Phase 1. Please confirm.