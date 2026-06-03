# ClearPass Phase Remediation Checklist

Created: 2026-06-01
Source plan: `audits/FULL_AUDIT_REMEDIATION_PLAN_2026-06-01.md`

Use this file as the working tracker. Complete each phase in order unless a later item is required to unblock verification.

## Phase 0 - Emergency Security Fixes

- [x] Remove unauthenticated `GET /api/debug/users` from `server/index.js`.
- [x] Confirm `/api/debug/users` returns 404 or is unavailable in all environments.
- [x] Add regression coverage proving user APIs never expose `password_hash`.
- [x] Add ownership authorization to document request downloads.
- [x] Verify owner resident can download their own approved document.
- [x] Verify a different resident receives 403 for another resident's document.
- [x] Verify only approved staff roles can download resident documents.
- [x] Add JWT expiry for normal login tokens.
- [x] Align auth cookie `maxAge` with JWT expiry.
- [x] Require MFA for high-risk staff roles in production.
- [x] Re-enable or consistently enforce CSRF for all cookie-auth state-changing routes.
- [x] Fix client logout so it sends CSRF when server requires it.
- [x] Re-enable CSRF protection for certificate write routes.
- [x] Replace broad Vercel/Netlify CORS suffix allowlisting with exact allowed origins.
- [x] Add CORS tests for approved origin, random preview origin, localhost dev origin, and no-origin behavior.

## Phase 1 - Build, Test, and Dependency Health

- [x] Run `npm ci` at repo root.
- [x] Run `npm ci --prefix client`.
- [x] Run `npm ci --prefix server`.
- [x] Run `npm ci --prefix tests`.
- [x] Document the supported Node version (`.nvmrc`, root `package.json` engines: Node 24.x / npm 11.x).
- [x] Fix `tests/package.json` so `npm test` points to existing test runners.
- [x] Restore or replace missing `tests/run-tests.js`.
- [x] Restore or remove references to missing `comprehensive-role-tests.js`.
- [x] Fix syntax error in `server/__tests__/certificates.test.js`.
- [x] Verify `node --check server/__tests__/certificates.test.js`.
- [x] Verify `npm run build:client`.
- [x] Verify `npm run lint` (passes with 189 warnings tracked as cleanup debt).
- [ ] Verify `cd server && npm test -- --runInBand` (blocked: full suite exceeded 4 minutes and was stopped; focused security tests pass).
- [x] Run root `npm test`.
- [x] Upgrade vulnerable root production dependencies.
- [x] Upgrade vulnerable server production dependencies.
- [x] Upgrade vulnerable client production dependencies.
- [x] Verify `npm audit --omit=dev`.
- [x] Verify `npm audit --omit=dev --prefix server`.
- [x] Verify `npm audit --omit=dev --prefix client`.

## Phase 2 - Authorization and RBAC Hardening

- [x] Fix `officer` vs `blotter_officer` role alias mismatch.
- [x] Add RBAC tests for AI patrol routes.
- [x] Create route matrix for role, ownership, MFA, and audit requirements.
- [x] Audit all routes with `:id`, `:resident_id`, `:request_id`, `:docId`, and `:caseNumber`.
- [x] Add negative tests for cross-resident access.
- [x] Require MFA for user and role management.
- [x] Require MFA for resident verification.
- [x] Require MFA for document approval and rejection.
- [x] Require MFA for security log export.
- [x] Require MFA for backup and settings changes.

## Phase 3 - Data, File, and Secret Hygiene

- [x] Add ignore rules for `coverage/`.
- [x] Add ignore rules for `__pycache__/` and `*.pyc`.
- [x] Add ignore rules for uploads and local generated files.
- [x] Add ignore rules for `database/backups/`.
- [x] Remove tracked `server/coverage` files after confirming no useful artifact must remain.
- [x] Remove tracked `client/dist` build output after confirming the client builds successfully.
- [x] Remove tracked `ai_service/__pycache__` files.
- [x] Remove tracked `database/backups` files after confirming they contain no required seed data.
- [x] Remove tracked `server/uploads` files after confirming they are not required fixtures.
- [x] Decide whether `ai_service/chatbot_model.pkl` should be tracked or moved to artifact storage.
- [x] Validate upload file content by magic bytes.
- [x] Add upload tests for valid PDF/image files.
- [x] Add upload tests for spoofed MIME and wrong extension files.
- [x] Add upload tests for oversized and path-like filenames.
- [x] Centralize production environment validation.
- [x] Remove insecure production database fallbacks.
- [x] Create or update `.env.example` with required variables.

## Phase 4 - Deployment and Runtime Fixes

- [x] Add required server env vars to Docker Compose or compose `.env`.
- [x] Align AI service port between Dockerfile, Compose, app config, and `AI_SERVICE_URL`.
- [x] Fix AI service healthcheck dependency on missing `curl`.
- [ ] Verify `docker compose up --build` (blocked locally: Docker is not installed or not available on PATH).
- [ ] Verify server `/health`.
- [ ] Verify backend AI routes reach AI service.
- [x] Choose one primary deployment topology.
- [x] Mark non-primary deployment configs as secondary or archive them.
- [x] Document clean-clone deployment steps.

## Phase 5 - Code Quality and Architecture Debt

- [ ] Split server bootstrap from route registration.
- [ ] Move security middleware setup into a dedicated module.
- [ ] Create a route authorization policy table or manifest.
- [ ] Refactor `server/index.js` after tests are green.
- [ ] Refactor large React pages only after test coverage is stable.
- [ ] Normalize API error handling in `client/src/utils/api.js`.
- [ ] Fix client 401 behavior so callers have consistent control.
- [ ] Stop clearing all `localStorage`; clear only app-owned keys.
- [ ] Replace production console logging with environment-gated logging.
- [ ] Confirm production build has no noisy auth/API debug logs.

## Phase 6 - Database and Migration Reliability

- [ ] Decide how to handle duplicate migration timestamps.
- [ ] Document rollback/order expectations for duplicate-timestamp migrations.
- [ ] Verify fresh database migration succeeds.
- [ ] Add schema contract tests for tables, columns, and indexes.
- [ ] Make seed data deterministic and sanitized.
- [ ] Verify `npm run db:verify-schema-usage`.
- [ ] Verify fresh migration plus seed run in CI.

## Phase 7 - Test Coverage and CI

- [ ] Add unit tests for auth middleware.
- [ ] Add unit tests for CSRF middleware.
- [ ] Add unit tests for role mapping.
- [ ] Add unit tests for document ownership.
- [ ] Add unit tests for file validation.
- [ ] Add integration tests for login, logout, and MFA.
- [ ] Add integration tests for resident document request lifecycle.
- [ ] Add integration tests for certificate request lifecycle.
- [ ] Add integration tests for admin user management.
- [ ] Add integration tests for AI service fallback.
- [ ] Add E2E smoke test for staff login.
- [ ] Add E2E smoke test for resident registration.
- [ ] Add E2E smoke test for document request.
- [ ] Add E2E smoke test for blotter workflow.
- [ ] Align local scripts and CI scripts.
- [ ] Pin Node and Python versions in CI.
- [ ] Ensure CI runs lint, build, tests, audit, and migration checks.
- [ ] Verify CI passes from a clean clone.

## Final Exit Criteria

- [ ] No unauthenticated sensitive-data endpoints remain.
- [ ] All resident-owned data routes enforce ownership.
- [ ] JWTs expire.
- [ ] High-risk staff actions require MFA.
- [ ] CSRF protection is consistent for cookie-auth state changes.
- [x] `npm run build:client` succeeds.
- [x] `npm run lint` succeeds.
- [x] `npm test` succeeds.
- [ ] `cd server && npm test -- --runInBand` succeeds.
- [x] Production audits have no critical or high findings, or approved documented exceptions.
- [ ] Chosen deployment target boots from a clean clone.
- [ ] Generated/private artifacts are no longer tracked.
- [ ] CI is green.
