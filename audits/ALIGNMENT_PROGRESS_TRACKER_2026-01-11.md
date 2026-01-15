# ClearPass Alignment Progress Tracker (Frontend × Backend × Database)

- Created (UTC): 2026-01-11
- Project root: `c:\xampp\htdocs\clearpass`
- Status: Active

## Why This File Exists

System misalignments were **confirmed** via:

- Live DB audit output: [DB_LIVE_AUDIT_OUTPUT.txt](file:///c:/xampp/htdocs/clearpass/audits/DB_LIVE_AUDIT_OUTPUT.txt)
- Exported SQL dump: [barangay_management Newest Jan11.sql](file:///c:/xampp/htdocs/clearpass/database/barangay_management%20Newest%20Jan11.sql)
- Prior audit report (code + runtime observations): [SYSTEM_AUDIT_2026-01-10T22-04-33Z.md](file:///c:/xampp/htdocs/clearpass/audits/SYSTEM_AUDIT_2026-01-10T22-04-33Z.md)
- Requirements document under review: [System_requirements.md](file:///c:/xampp/htdocs/clearpass/System_requirements.md)

Because misalignments exist, **System_requirements.md should not be revised to “fit” the current system yet**. This tracker plans the fixes needed to reach alignment, after which the requirements document can be updated if desired.

## Status Legend

- Not Started
- In Progress
- Blocked
- Completed

## Summary of Confirmed Misalignments

### A) RBAC Role IDs mismatch (Requirements vs Database vs App usage)

- Confirmed in DB: roles are `1 IT Admin`, `2 Captain`, `3 Secretary`, `4 Clerk`, `6 Blotter Officer`, `12 Resident` ([DB_LIVE_AUDIT_OUTPUT.txt](file:///c:/xampp/htdocs/clearpass/audits/DB_LIVE_AUDIT_OUTPUT.txt#L46-L68), [Jan11.sql](file:///c:/xampp/htdocs/clearpass/database/barangay_management%20Newest%20Jan11.sql#L1900-L1921)).
- Requirements define different role numbers (notably Resident=4, Captain=5, Secretary=6): [System_requirements.md](file:///c:/xampp/htdocs/clearpass/System_requirements.md#L1-L191).
- Impact:
  - Role-gated routes and UI may grant/deny incorrectly.
  - Audit/compliance claims are not defensible until reconciled.

### B) Seeded `users.role` values are incorrect (DB data integrity)

- In the SQL dump, multiple seeded users have role IDs that do not correspond to their intended role name (e.g., `captain` user has role `6`, `secretary` user has role `2`) ([Jan11.sql](file:///c:/xampp/htdocs/clearpass/database/barangay_management%20Newest%20Jan11.sql#L1979-L1988)).
- Impact:
  - Even perfectly-written RBAC code will behave incorrectly for these accounts.

### C) DB schema uses `users.role` (not `role_id`) but parts of backend branch on `role_id`

- The DB schema defines `users.role` (tinyint) as the role ID ([Jan11.sql](file:///c:/xampp/htdocs/clearpass/database/barangay_management%20Newest%20Jan11.sql#L1952-L1973)).
- Backend route code was observed branching on `req.user.role_id` in document request routes (see prior report evidence): [SYSTEM_AUDIT_2026-01-10T22-04-33Z.md](file:///c:/xampp/htdocs/clearpass/audits/SYSTEM_AUDIT_2026-01-10T22-04-33Z.md#L60-L88).
- Impact:
  - Authorization logic may silently fail-open/fail-closed depending on token payload.

### D) Missing table used by backend (`document_requests`)

- Live DB earlier indicated `document_requests` missing; the SQL dump also contains no `CREATE TABLE document_requests` ([Jan11.sql](file:///c:/xampp/htdocs/clearpass/database/barangay_management%20Newest%20Jan11.sql)).
- Impact:
  - Any endpoint reading/writing `document_requests` cannot work against this DB.

### E) Document security requirement mismatch (encryption/retention)

- Requirements claim “All uploaded documents are encrypted and stored securely” + retention/disposal policies ([System_requirements.md](file:///c:/xampp/htdocs/clearpass/System_requirements.md#L186-L191)).
- DB shows BLOB storage for documents/templates:
  - `document_templates.file_data` MEDIUMBLOB
  - `resident_verification_requests.file_data` BLOB
    ([DB_LIVE_AUDIT_OUTPUT.txt](file:///c:/xampp/htdocs/clearpass/audits/DB_LIVE_AUDIT_OUTPUT.txt#L150-L156))
- Prior audit found disk-based uploads too (multer disk storage), which likely remains for other flows: [SYSTEM_AUDIT_2026-01-10T22-04-33Z.md](file:///c:/xampp/htdocs/clearpass/audits/SYSTEM_AUDIT_2026-01-10T22-04-33Z.md#L140-L158).
- Impact:
  - Compliance gap until encryption-at-rest + access logging + retention is implemented end-to-end.

## Goals (What “Aligned” Means)

Alignment is achieved when all are simultaneously true:

- Roles: Requirements, DB `roles`, server auth claims, and frontend role checks refer to the **same role IDs and names**.
- Users: Seeded admin/staff accounts have correct `users.role` values and map to an existing `roles.id`.
- Endpoints: No backend endpoint references a non-existent DB table/column.
- Document security: Storage location(s) are defined, encrypted-at-rest, access-logged, and have retention/disposal policy implemented and enforced.
- Verification: A repeatable checklist confirms alignment (see “Verification Checklist”).

## Ownership Model

- Owner (overall): IT Admin
- Database: DBA / IT Admin
- Backend: Backend Engineer
- Frontend: Frontend Engineer
- Security/Compliance: IT Admin (with stakeholders)

## Action Plan (Prioritized)

### P0 — Stop incorrect authorization outcomes (Critical)

#### P0.1 Fix seeded user roles in database

- Status: Completed
- Owner: DBA / IT Admin
- Risk: High (current staff accounts behave incorrectly)
- Evidence: [Jan11.sql](file:///c:/xampp/htdocs/clearpass/database/barangay_management%20Newest%20Jan11.sql#L1979-L1988)
- Tasks:
  - [x] (Completed) Decide intended role per seeded username (`superadmin`, `captain`, `secretary`, `clerk`, `officer`, `resident`)
  - [x] (Completed) Implement DB fix as a migration (apply via `npm run db:migrate`): [20260111124500_fix_seeded_user_roles.js](file:///c:/xampp/htdocs/clearpass/server/migrations/20260111124500_fix_seeded_user_roles.js)
  - [x] (Completed) Verify seeded roles via DB query (`mysql`): `SELECT username, role FROM users WHERE username IN (...)`
- Testing:
  - [x] (Completed) Verify seeded roles + RBAC allow/deny via DB checks + token smoke tests: [seededUsersDbVerification.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/seededUsersDbVerification.test.js), [rbacSmokeTokens.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/rbacSmokeTokens.test.js)
- ## Notes:

#### P0.2 Choose and enforce a single “Role ID Source of Truth”

- Status: Completed
- Owner: IT Admin
- Decision options:
  - Option A (Recommended for minimal disruption): Make the system’s source of truth the **current DB role IDs** (1,2,3,4,6,12), then update requirements doc later to match.
  - Option B: Change DB to match the current requirements doc (1–6), then update code + data + client accordingly (higher disruption).
- Tasks:
  - [x] (Completed) Select option (A) and record decision here
  - [x] (Completed) Freeze role IDs in DB via referential integrity (`users.role` -> `roles.id`): [20260111174000_enforce_role_integrity.js](file:///c:/xampp/htdocs/clearpass/server/migrations/20260111174000_enforce_role_integrity.js)
  - [x] (Completed) Ensure server JWT claim is `role` (numeric) matching DB `roles.id`
  - [x] (Completed) Ensure frontend uses the same role IDs
  - [x] (Completed) Remove legacy magic-number role checks in routes/controllers as found
- Notes:
  - Decision: Option A (DB role IDs are the source of truth)
  - Rationale: DB already contains real production data; minimizing disruption while standardizing code and guards
  - Evidence:
    - Backend: [authMiddleware.js](file:///c:/xampp/htdocs/clearpass/server/middleware/authMiddleware.js), [systemAdminRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/systemAdminRoutes.js), [caseManagementRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/caseManagementRoutes.js), [aiAnalyticsRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/aiAnalyticsRoutes.js), [documentRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/documentRoutes.js), [certificateController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/certificateController.js), [blotterController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/blotterController.js)
    - Frontend: [DocumentVerification.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/DocumentVerification.jsx), [Users.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/Users.jsx)

#### P0.3 Remove `role_id` assumptions in backend authorization

- Status: Completed
- Owner: Backend Engineer
- Evidence: prior audit indicates `role_id` branching in document request routes: [SYSTEM_AUDIT_2026-01-10T22-04-33Z.md](file:///c:/xampp/htdocs/clearpass/audits/SYSTEM_AUDIT_2026-01-10T22-04-33Z.md#L60-L88)
- Tasks:
  - [x] (Completed) Standardize to `req.user.role` only (single field)
  - [x] (Completed) Add a server-side guard to reject tokens missing `role`
  - [x] (Completed) Add a focused regression test for token normalization: [authMiddlewareNormalization.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/authMiddlewareNormalization.test.js)
- Testing:
  - [ ] (Not Started) API integration tests for role-based allow/deny across sensitive endpoints

### P1 — Restore functional correctness of document request flows

#### P1.1 Decide the canonical table for “document requests”

- Status: Completed
- Owner: Backend Engineer + DBA
- Observed existing tables in dump:
  - `clearance_requests` exists: [Jan11.sql](file:///c:/xampp/htdocs/clearpass/database/barangay_management%20Newest%20Jan11.sql#L1451-L1466)
  - `document_requests` does not exist in dump
- Tasks:
  - [x] (Completed) Identify what `/api/documents/requests` is intended to store (resident document/certificate requests queue)
  - [x] (Completed) Decision: use `document_requests` as the canonical table (separate from `clearance_requests`)
  - [x] (Completed) Ensure `document_requests` exists in DB (repair migration): [20260111130000_repair_roles_and_document_requests.js](file:///c:/xampp/htdocs/clearpass/server/migrations/20260111130000_repair_roles_and_document_requests.js)
- Testing:
  - [x] (Completed) Create/read/update lifecycle tests for resident vs staff roles: [documentRequestsLifecycle.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/documentRequestsLifecycle.test.js)
- Notes:
  - Decision: `document_requests`

#### P1.2 Enforce ownership rules for residents (prevent IDOR)

- Status: Completed
- Owner: Backend Engineer
- Tasks:
  - [x] (Completed) For resident role, derive `resident_id` from token/user mapping (ignore body-provided `resident_id`)
  - [x] (Completed) Ensure staff access is restricted to allowed roles only
  - [x] (Completed) Add logging/audit entries for document access events (DB: `audit_logs`)
- Testing:
  - [x] (Completed) Negative tests: resident cannot read/create for another resident_id (unit/integration via mocked DB)
  - [x] (Completed) Audit trail test: document request create/view appears in `audit_logs` and `/api/admin/logs`: [documentRequestsAuditTrail.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/documentRequestsAuditTrail.test.js)

### P2 — Security & Compliance alignment (documents + auditability)

#### P2.1 Define a single document storage strategy (DB BLOB vs filesystem)

- Status: Completed
- Owner: IT Admin + Backend Engineer
- Evidence: DB BLOBs exist ([DB_LIVE_AUDIT_OUTPUT.txt](file:///c:/xampp/htdocs/clearpass/audits/DB_LIVE_AUDIT_OUTPUT.txt#L150-L156)) and prior audit suggests disk uploads also exist ([SYSTEM_AUDIT_2026-01-10T22-04-33Z.md](file:///c:/xampp/htdocs/clearpass/audits/SYSTEM_AUDIT_2026-01-10T22-04-33Z.md#L140-L158)).
- Tasks:
  - [x] (Completed) List all document entrypoints and where they store bytes today
  - [x] (Completed) Choose target: File storage (encrypted) + DB metadata
  - [x] (Completed) Implement encryption-at-rest for filesystem-stored resident/application documents
  - [x] (Completed) Implement retention + disposal job for filesystem-stored documents (toggle)
- Testing:
  - [x] (Completed) Confirm decrypt works only for authorized roles (secured endpoints + tests)
  - [x] (Completed) Confirm access is logged (who/what/when/why) for document download endpoints (audit_logs + tests)
- Notes:
  - Strategy decision:
    - File storage (encrypted) + DB metadata for uploads (resident/app docs, system assets)
  - Current entrypoints (observed):
    - DB BLOB: template upload/download (`document_templates.file_data`) via [templateRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/templateRoutes.js)
    - Filesystem: resident docs stored to `server/uploads/documents` via [upload.js](file:///c:/xampp/htdocs/clearpass/server/middleware/upload.js) used by [residentRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/residentRoutes.js) + [residentController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/residentController.js)
    - System assets (seal/letterhead) now persisted on disk + indexed in DB: [systemAdminRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/systemAdminRoutes.js) + [systemAdminController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/systemAdminController.js) + [20260111133000_create_system_assets.js](file:///c:/xampp/htdocs/clearpass/server/migrations/20260111133000_create_system_assets.js)
    - Secure download endpoints now exist for filesystem-stored resident/application documents:
      - Resident self-service + staff: [residentRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/residentRoutes.js) + [residentController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/residentController.js)
      - Secretary verification: [secretaryRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/secretaryRoutes.js)
  - Encryption implementation:
    - Utility: [documentStorage.js](file:///c:/xampp/htdocs/clearpass/server/utils/documentStorage.js)
    - Migration: [20260111160000_add_document_encryption_and_retention.js](file:///c:/xampp/htdocs/clearpass/server/migrations/20260111160000_add_document_encryption_and_retention.js)
    - Env:
      - `DOCUMENTS_ENCRYPTION_ENABLED=true`
      - `DOCUMENTS_MASTER_KEY=<base64 32-byte key>`
  - Retention/disposal implementation:
    - Job: [documentRetention.js](file:///c:/xampp/htdocs/clearpass/server/jobs/documentRetention.js)
    - Env:
      - `DOCUMENT_RETENTION_ENABLED=true`
      - `DOCUMENT_RETENTION_DAYS=365` (default)
  - Document access logging:
    - Event types (examples): `RESIDENT_DOCUMENT_DOWNLOADED`, `APPLICATION_DOCUMENT_DOWNLOADED`
    - Evidence: [auditLogger.js](file:///c:/xampp/htdocs/clearpass/server/middleware/auditLogger.js), [documentDownloadsAuditTrail.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/documentDownloadsAuditTrail.test.js)

#### P2.2 Align “MFA for document verification roles” requirement with implementation

- Status: Completed
- Owner: IT Admin + Backend Engineer + Frontend Engineer
- Requirement reference: [System_requirements.md](file:///c:/xampp/htdocs/clearpass/System_requirements.md#L186-L191)
- Tasks:
  - [x] (Completed) Decide what counts as MFA: OTP via email
  - [x] (Completed) Add MFA enforcement hook (disabled by default) for verification routes: [mfaMiddleware.js](file:///c:/xampp/htdocs/clearpass/server/middleware/mfaMiddleware.js)
  - [x] (Completed) Implement MFA OTP flow (challenge + verify + token mfa_verified claim)
  - [x] (Completed) Add audit logs for MFA events (`MFA_OTP_SENT`, `MFA_OTP_VERIFIED`, `MFA_OTP_FAILED`)
- Testing:
  - [x] (Completed) End-to-end-ish test: login requires OTP then verify upgrades session: [mfaOtpFlow.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/mfaOtpFlow.test.js)
- Notes:
  - Enforcement toggle: `MFA_ENFORCE_VERIFICATION=true`
  - OTP delivery: SMTP via env (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`)
  - OTP endpoints: `POST /api/auth/mfa/request`, `POST /api/auth/mfa/verify`
  - UI route: `/mfa` (OTP entry page) in [MfaOtp.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/MfaOtp.jsx)

### P3 — Documentation alignment (only after system is corrected)

#### P3.1 Update System_requirements.md role numbers to match final source of truth

- Status: Completed
- Owner: IT Admin
- Preconditions:
  - [x] (Completed) P0.2 completed and role IDs are stable
  - [x] (Completed) P0.1 completed and seeded users corrected
- Tasks:
  - [x] (Completed) Update role numbers and role descriptions to match the system’s final mapping
  - [x] (Completed) Add a “Role ID Mapping” table section
  - [x] (Completed) Add an “Implementation Notes” section (JWT claim name, DB column name)
- Evidence:
  - [System_requirements.md](file:///c:/xampp/htdocs/clearpass/System_requirements.md)

## Milestones / Timeline (Fill Dates As You Execute)

- M0 (Start): 2026-01-11 — Tracker created
- M1: Role data corrected (P0.1) — Target date: 2026-01-11 — Status: Completed
- M2: Role source of truth chosen + enforced (P0.2/P0.3) — Target date: 2026-01-11 — Status: Completed
- M3: Document request storage aligned (P1.1/P1.2) — Target date: 2026-01-11 — Status: Completed
- M4: Document security controls aligned (P2.1/P2.2) — Target date: 2026-01-11 — Status: Completed
- M5: Requirements updated to match final system (P3.1) — Target date: 2026-01-11 — Status: Completed

## Verification Checklist (Alignment Confirmation)

### Roles and Accounts

- [x] (Completed) `SELECT * FROM roles ORDER BY id;` matches documented role mapping (verified in prior DB verification update)
- [x] (Completed) Seeded users (`superadmin`, `captain`, `secretary`, `clerk`, `officer`, `resident`) have correct `users.role` (verified in prior DB verification update)
- [x] (Completed) JWT payload contains `role` and it matches DB `roles.id` (auth middleware normalization + tests)
- [x] (Completed) Frontend role checks match backend role checks (role IDs standardized)

### Database Schema vs Backend

- [x] (Completed) No backend endpoint references non-existent table/column (spot-check + automated test): `npm run db:verify-schema-usage`
- [x] (Completed) Document request endpoints use an existing, defined table (migration + lifecycle tests)

### Security/Compliance

- [x] (Completed) Uploaded documents are encrypted-at-rest in the chosen storage strategy
- [x] (Completed) Document access is logged (read/write) with user identity and purpose
- [x] (Completed) Retention/disposal policy is implemented and tested
- [x] (Completed) MFA is enforced for document verification roles (as defined)

## Risk Assessment & Mitigations

### Risk: Breaking access for real users during role mapping changes

- Severity: High
- Mitigations:
  - Deploy role mapping changes behind a feature flag (if applicable)
  - Perform DB updates in a transaction and keep a rollback script
  - Validate with staging copy of DB dump before production

### Risk: Silent authorization drift across legacy routes

- Severity: High
- Mitigations:
  - Add an automated endpoint/RBAC snapshot test to detect changes
  - Remove/disable legacy route mounts once parity is achieved

### Risk: Sensitive document exposure during storage transition

- Severity: Critical
- Mitigations:
  - Encrypt before write; never store plaintext bytes post-migration
  - Restrict DB/file access at OS and DB user levels
  - Implement structured audit logs and review them

## Progress Updates (Append-Only)

### Update: 2026-01-11

- Status: Tracker created
- Notes:
  - Confirmed DB roles differ from requirements.
  - Confirmed seeded user roles in dump are incorrect.
  - Confirmed `document_requests` table is absent in dump.

### Update: 2026-01-11 (Implementation)

- Status: In Progress
- What changed:
  - Standardized JWT role normalization + eliminated backend `role_id` usage paths.
  - Corrected frontend route guards to use DB-aligned role IDs (Resident=12).
  - Aligned `/api/documents/requests` with the migrated `document_requests` schema and enforced resident ownership.
  - Added a migration to correct seeded users’ `users.role`.
- Evidence links:
  - [authMiddleware.js](file:///c:/xampp/htdocs/clearpass/server/middleware/authMiddleware.js)
  - [documentRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/documentRoutes.js)
  - [residentAuthRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/residentAuthRoutes.js)
  - [App.jsx](file:///c:/xampp/htdocs/clearpass/client/src/App.jsx)
  - [20260111124500_fix_seeded_user_roles.js](file:///c:/xampp/htdocs/clearpass/server/migrations/20260111124500_fix_seeded_user_roles.js)
  - [authMiddlewareNormalization.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/authMiddlewareNormalization.test.js)
- Next actions:
  - Run `npm run db:migrate` to apply the role-fix migration and (if missing) create `document_requests`.
  - Re-verify seeded roles with a DB query and do a role-based smoke test login for each seeded account.

### Update: 2026-01-11 (DB Verified)

- Status: In Progress
- What changed:
  - Applied migrations:
    - `20260111124500_fix_seeded_user_roles.js` (seeded user roles corrected)
    - `20260111130000_repair_roles_and_document_requests.js` (recreated `document_requests`, ensured role `6` exists)
  - Verified via `mysql`:
    - `roles` now includes 1,2,3,4,6,12
    - Seeded users now have expected `users.role` values (`superadmin=1`, `captain=2`, `secretary=3`, `clerk=4`, `officer=6`, `resident=12`)
    - `document_requests` table now exists
- Next actions:
  - Create a minimal integration test covering `POST /api/documents/requests` + `GET /api/documents/requests` as resident.
  - Confirm `audit_logs` entries appear in `/api/admin/logs` after a document request action.

### Update: 2026-01-11 (Role & Document UX hardening)

- Status: In Progress
- What changed:
  - Removed remaining hard-coded role ID checks and standardized to DB-aligned roles constants in backend routes/controllers.
  - Added secure download endpoints for filesystem-stored resident/application documents and wired the secretary/admin UIs to use them.
- Evidence links:
  - Backend: [residentRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/residentRoutes.js), [residentController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/residentController.js), [secretaryRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/secretaryRoutes.js)
  - Frontend: [DocumentVerification.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/DocumentVerification.jsx), [Users.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/Users.jsx)
  - Tests: [residentDocumentsDownload.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/residentDocumentsDownload.test.js), [secretaryApplicationDocumentsDownload.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/secretaryApplicationDocumentsDownload.test.js), [DocumentVerification.openFileFromEndpoint.test.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/__tests__/DocumentVerification.openFileFromEndpoint.test.jsx)

### Update: 2026-01-11 (Audit trail parity)

- Status: In Progress
- What changed:
  - Ensured `GET /api/documents/requests` is treated as a sensitive GET and recorded into `audit_logs`.
  - Added an integration test proving `DOCUMENT_REQUEST_CREATED` + `DOCUMENT_REQUEST_VIEWED` show up in `/api/admin/logs`.
- Evidence links:
  - Backend: [auditLogger.js](file:///c:/xampp/htdocs/clearpass/server/middleware/auditLogger.js), [adminRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/adminRoutes.js), [documentRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/documentRoutes.js)
  - Tests: [documentRequestsAuditTrail.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/documentRequestsAuditTrail.test.js)

### Update: 2026-01-11 (Document encryption-at-rest + retention)

- Status: In Progress
- What changed:
  - Added encryption-at-rest for filesystem-stored resident/application uploaded documents, with decryption-on-download in secure endpoints.
  - Added DB migration adding encryption + disposal metadata fields.
  - Added retention disposal job (toggle) that deletes expired files and marks rows disposed.
- Evidence links:
  - Backend utility: [documentStorage.js](file:///c:/xampp/htdocs/clearpass/server/utils/documentStorage.js)
  - Migration: [20260111160000_add_document_encryption_and_retention.js](file:///c:/xampp/htdocs/clearpass/server/migrations/20260111160000_add_document_encryption_and_retention.js)
  - Retention job: [documentRetention.js](file:///c:/xampp/htdocs/clearpass/server/jobs/documentRetention.js)
  - Endpoints: [residentController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/residentController.js), [secretaryRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/secretaryRoutes.js)
  - Tests: [residentEncryptedDocumentDownload.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/residentEncryptedDocumentDownload.test.js)

### Update: 2026-01-11 (Document access logging)

- Status: In Progress
- What changed:
  - Added explicit audit logging for non-JSON document download responses, so downloads are recorded in `audit_logs`.
  - Added tests verifying audit events for resident and application document downloads.
- Evidence links:
  - Backend: [auditLogger.js](file:///c:/xampp/htdocs/clearpass/server/middleware/auditLogger.js), [residentController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/residentController.js), [secretaryRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/secretaryRoutes.js)
  - Tests: [documentDownloadsAuditTrail.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/documentDownloadsAuditTrail.test.js)

### Update: 2026-01-11 (OTP MFA for verification roles)

- Status: In Progress
- What changed:
  - Implemented OTP-based MFA for IT Admin/Secretary/Clerk with `mfa_verified` claim in JWT and enforcement on verification-sensitive endpoints.
  - Added OTP challenge storage + audit events for MFA lifecycle.
  - Added a minimal UI route to enter OTP and complete MFA.
- Evidence links:
  - Backend: [authController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/authController.js), [mfaOtp.js](file:///c:/xampp/htdocs/clearpass/server/utils/mfaOtp.js), [mfaMiddleware.js](file:///c:/xampp/htdocs/clearpass/server/middleware/mfaMiddleware.js), [auditLogger.js](file:///c:/xampp/htdocs/clearpass/server/middleware/auditLogger.js)
  - Migration: [20260111170000_create_mfa_otp_challenges.js](file:///c:/xampp/htdocs/clearpass/server/migrations/20260111170000_create_mfa_otp_challenges.js)
  - Tests: [mfaOtpFlow.test.js](file:///c:/xampp/htdocs/clearpass/server/__tests__/mfaOtpFlow.test.js)
  - Frontend: [MfaOtp.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/MfaOtp.jsx), [ProtectedRoute.jsx](file:///c:/xampp/htdocs/clearpass/client/src/components/ProtectedRoute.jsx), [AuthContext.jsx](file:///c:/xampp/htdocs/clearpass/client/src/contexts/AuthContext.jsx), [Login.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/Login.jsx)

### Update: YYYY-MM-DD

- Status:
- What changed:
- Evidence links:
- Blockers:
- Next actions:
- Notes:
