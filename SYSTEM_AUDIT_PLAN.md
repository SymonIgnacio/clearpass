# Comprehensive System Audit Plan & Progress Tracker

## Phase 1: Foundation & Security Scan
- [ ] **Environment Validation**: Run `npm run validate-env`
- [ ] **Database Health**: Verify connection pooling and schema integrity
- [ ] **Dependency Audit**: Run `npm audit`
- [ ] **RBAC Route Scan**: Audit all 27 route files for `verifyToken` / `checkRole`
- [ ] **Secret Scanning**: Regex scan for hardcoded credentials

## Phase 2: Core Services Logic Audit (Partial Test)
- [ ] **Authentication**: Login, MFA, Logout
- [ ] **User Management**: Staff Creation, Role Updates, Soft Delete
- [ ] **Resident Identity**: Registration, Profile Update, Household Linking
- [ ] **Communication**:
    - [ ] Email Service (Mock/Dry Run)
    - [ ] WebSocket Service

## Phase 3: Operational Modules Audit (Partial Test)
- [ ] **Certificates**:
    - [ ] Resident Request
    - [ ] Admin Approval & Generation
    - [ ] Template Management (Upload)
- [ ] **Blotter & Justice**:
    - [ ] Case Creation & Status Updates
    - [ ] Resident-Admin Sync
- [ ] **Community Programs**:
    - [ ] Event Creation
    - [ ] Participant Addition
- [ ] **Announcements**: Creation & Visibility

## Phase 4: Advanced Features & Jobs Audit (Partial Test)
- [ ] **AI Integration**: Trigger Analysis & Log Verification
- [ ] **Reporting**: PDF/CSV Generation
- [ ] **Background Jobs**: Document Retention Logic

## Phase 5: Frontend & Uploads Validation (Partial Test)
- [ ] **Resident ID Upload**: UI & Backend Handling
- [ ] **System Assets**: Seal/Letterhead Upload
- [ ] **Verification**: Upload Modal Logic

## Phase 6: Reporting
- [ ] Compile `AUDIT_REPORT_2026.md`
- [ ] Compile `TEST_CASES_2026.md`
