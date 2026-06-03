# ClearPass Full Audit Remediation Plan

Audit date: 2026-06-01
Workspace: `C:\xampp\htdocs\clearpass`

## Executive Summary

This audit found several production-blocking gaps: unauthenticated credential-hash exposure, document-download authorization gaps, incomplete CSRF coverage, non-expiring staff JWTs, broken local build/test tooling, known vulnerable dependencies, deployment configuration drift, and tracked generated/private operational artifacts.

The system should be treated as not production-ready until Phase 0 and Phase 1 are completed and verified.

## Confirmed Checks Run

- `git status --short`: clean worktree before this audit file was created.
- `npm run build:client`: failed because `vite` is not installed in `client/node_modules`.
- `npm run lint`: failed because `eslint` is not installed in root `node_modules`.
- `cd server && npm test -- --runInBand`: failed because `jest` is not installed in `server/node_modules`.
- `cd tests && npm test`: failed because `tests/package.json` points to missing `tests/run-tests.js`.
- JS syntax scan over `.js/.cjs/.mjs`: 303 files checked, 1 syntax failure in `server/__tests__/certificates.test.js`.
- `npm audit --omit=dev`: root has 18 production vulnerabilities: 2 critical, 5 high, 8 moderate, 3 low.
- `npm audit --omit=dev --prefix server`: server has 19 production vulnerabilities: 8 high, 9 moderate, 2 low.
- `npm audit --omit=dev --prefix client`: client has 7 production vulnerabilities: 5 high, 2 moderate.
- Python tests could not be run because `python` is not available on PATH in this environment.

## Phase 0 - Emergency Security Fixes

### 0.1 Remove unauthenticated debug data exposure

Finding:
- `server/index.js:182` exposes `GET /api/debug/users` without authentication.
- It returns `id`, `username`, `role`, and `password_hash`.

Risk:
- Any caller can retrieve password hashes and user inventory.

Fix:
- Delete the route entirely.
- If a debug endpoint is still required, place it behind `verifyToken`, admin-only RBAC, MFA verification, `NODE_ENV !== 'production'`, and never return password hashes.

Verification:
- `GET /api/debug/users` returns 404 in every environment.
- Add a regression test that asserts password hashes are never exposed by debug/admin user APIs.

### 0.2 Fix document request download authorization

Finding:
- `server/routes/documentRoutes.js:81` allows any authenticated user to call `GET /api/documents/requests/:request_id/download`.
- `server/controllers/documentController.js:370` fetches the approved request by `request_id` but does not confirm the requester owns the resident request or has an allowed staff role.

Risk:
- IDOR: a logged-in resident can download another resident's approved document if they know or guess a request ID.

Fix:
- In `downloadDocument`, enforce:
  - Resident: `requestData.resident_id === req.user.resident_id || req.user.id`.
  - Staff: only admin, secretary, clerk, or explicitly approved roles.
  - Reject all others with 403.
- Use non-enumerable request IDs or add a separate opaque download token if public download links are required.

Verification:
- Add tests for owner success, other resident 403, allowed staff success, unauthorized role 403.

### 0.3 Fix JWT lifetime and session policy

Finding:
- `server/controllers/authController.js:131` signs normal login JWTs with no expiry.
- `server/controllers/authController.js:150` stores the cookie for one year.
- MFA is only required when `MFA_ENFORCE_VERIFICATION=true`, and current login logic only applies MFA to residents.

Risk:
- Stolen cookies can remain valid indefinitely.
- High-privilege staff accounts do not get stronger verification by default.

Fix:
- Set `JWT_EXPIRES_IN` default to a short duration, for example `8h`.
- Set cookie `maxAge` to match token expiry.
- Require MFA for admin, secretary, clerk, and blotter officer in production.
- Add refresh-token rotation only if long-lived sessions are needed.

Verification:
- Unit test token expiry claim.
- Integration test expired token returns 401.
- MFA tests cover staff and resident roles.

### 0.4 Complete CSRF protection

Finding:
- `server/index.js:146` disables CSRF for login.
- `server/index.js:150` disables CSRF for certificates.
- `client/src/utils/api.js:40` skips CSRF for every endpoint containing `/auth/`, but the server applies CSRF to `/api/auth/logout`.

Risk:
- State-changing endpoints have inconsistent CSRF protection.
- Logout can fail silently in the client.

Fix:
- Decide one CSRF model and apply it consistently.
- Include CSRF tokens on logout and all state-changing cookie-auth requests.
- Re-enable CSRF on certificates and other write endpoints after updating client calls.
- Consider SameSite `strict` for sensitive admin flows if cross-site redirects are not required.

Verification:
- Tests for login, logout, certificates create/update, resident write flows.
- Browser smoke test confirms logout succeeds and clears server cookie.

### 0.5 Tighten CORS

Finding:
- `server/index.js:113` allows any `.netlify.app` and `.vercel.app` origin in all environments.
- Requests with no origin are allowed.

Risk:
- Preview-domain takeover or unintended deployments can interact with authenticated cookie APIs.

Fix:
- Replace suffix allowlisting with exact configured origins.
- Add `FRONTEND_URLS` as a comma-separated allowlist.
- Only allow no-origin requests for explicitly documented health checks or trusted internal clients.

Verification:
- CORS tests for approved origin, random Vercel/Netlify origin, localhost dev origin, and no-origin requests.

## Phase 1 - Restore Build, Test, and Dependency Health

### 1.1 Reinstall dependencies reproducibly

Finding:
- Local commands cannot find `vite`, `eslint`, or `jest`.

Fix:
- Run clean installs using lockfiles:
  - `npm ci`
  - `npm ci --prefix client`
  - `npm ci --prefix server`
  - `npm ci --prefix tests`
- Document the supported Node version. Current audit ran on Node `v24.16.0`, while server declares `>=18` and Netlify uses Node 20.

Verification:
- `npm run build:client`
- `npm run lint`
- `cd server && npm test -- --runInBand`

### 1.2 Fix broken root test package

Finding:
- Root `npm test` runs `cd tests && npm test`.
- `tests/package.json` runs `node run-tests.js`, but `tests/run-tests.js` does not exist.
- The same package references missing `comprehensive-role-tests.js`.

Fix:
- Either restore the missing runner files or update `tests/package.json` to call the existing `.cjs` and Python tests.
- Align root `package.json` scripts with the actual test layout.

Verification:
- `npm test` exits 0 or runs a documented subset with clear skip messages.

### 1.3 Fix syntax error in certificate tests

Finding:
- `server/__tests__/certificates.test.js:422` contains a duplicated object fragment:
  - Extra `commit: jest.fn(), release: jest.fn() };`

Fix:
- Remove the duplicate lines and run the server test suite.

Verification:
- `node --check server/__tests__/certificates.test.js`
- `cd server && npm test -- --runInBand`

### 1.4 Remediate vulnerable dependencies

Finding:
- Root audit includes critical `jspdf` and `basic-ftp` findings.
- Server audit includes high findings in `axios`, `@xmldom/xmldom`, `tar`, `lodash`, `minimatch`, `tmp`, `path-to-regexp`, and others.
- Client audit includes high findings in `axios`, `react-router-dom`, `@remix-run/router`, and `lodash`.

Fix:
- Update direct dependencies first:
  - `axios` to a fixed version across root, client, and server.
  - `react-router-dom` to a fixed version compatible with React.
  - `jspdf` to a fixed major version or replace with server-side PDF generation where possible.
  - `ws`, `express`, `pm2`, `nodemailer`, and `multer` after compatibility review.
- Run `npm audit fix` only after reviewing lockfile changes.
- Replace deprecated/unmaintained packages where needed, especially `csurf`.

Verification:
- `npm audit --omit=dev`
- `npm audit --omit=dev --prefix server`
- `npm audit --omit=dev --prefix client`
- Regression tests for PDF generation, routing, uploads, AI proxy calls, and WebSocket notification flows.

## Phase 2 - Authorization and RBAC Hardening

### 2.1 Fix role alias mismatch

Finding:
- `server/routes/aiRoutes.js:125` allows `checkRole(['admin', 'captain', 'officer'])`.
- `server/middleware/authMiddleware.js:49` does not map `officer`; it maps `blotter_officer`.

Risk:
- Blotter officers may be incorrectly denied from AI patrol suggestions.

Fix:
- Replace `officer` with `blotter_officer` or add an explicit alias in `ROLE_MAP`.
- Add RBAC tests for every route using string roles.

Verification:
- Blotter officer token can access intended officer routes.
- Resident and clerk tokens cannot access officer-only routes.

### 2.2 Audit resident-owned routes for IDOR

Finding:
- Some resident routes already check ownership, for example resident document download.
- Document request download does not.

Fix:
- Create a route matrix with:
  - URL
  - required role
  - ownership rule
  - MFA requirement
  - audit event requirement
- Apply ownership checks to all routes with `:id`, `:resident_id`, `:request_id`, `:docId`, and `:caseNumber`.

Verification:
- Add negative tests for cross-resident access.

### 2.3 Enforce MFA on sensitive admin operations

Finding:
- Some admin routes use `requireVerificationMfa`; many high-risk write routes do not.

Fix:
- Require MFA for:
  - user and role management
  - resident verification
  - document approval/rejection
  - security log export
  - backup and settings changes

Verification:
- Tests for pending-MFA tokens returning 403 on sensitive routes.

## Phase 3 - Data, File, and Secret Hygiene

### 3.1 Remove tracked generated and operational artifacts

Finding:
- Tracked generated/private artifacts include:
  - `server/coverage`: 487 tracked files.
  - `ai_service/__pycache__`: 5 tracked files.
  - `database/backups`: 9 tracked SQL backups.
  - `server/uploads`: 57 tracked uploaded files.
  - `ai_service/chatbot_model.pkl`: tracked binary model.

Risk:
- Repository bloat, stale coverage reports, possible personal data leakage, and accidental exposure of uploaded resident documents/backups.

Fix:
- Add ignore rules for `coverage/`, `__pycache__/`, `*.pyc`, `uploads/`, `database/backups/`, generated reports, and local artifacts.
- Remove generated/private files from git tracking after confirming no production data must be preserved.
- Move required seed/demo data into sanitized fixtures.

Verification:
- `git ls-files` shows no tracked uploads, backups, pycache, or coverage outputs.

### 3.2 Validate upload content by magic bytes

Finding:
- `server/middleware/upload.js` accepts files based on extension and MIME string only.

Risk:
- Malicious content can be uploaded with a permitted extension/MIME value.

Fix:
- Validate file signatures after upload.
- Store outside the web root.
- Normalize filenames and preserve original names only as metadata.
- Scan or quarantine files if deployment requirements include anti-malware controls.

Verification:
- Upload tests for valid PDF/image, spoofed MIME, wrong extension, oversized file, and path-like filenames.

### 3.3 Strengthen environment validation

Finding:
- `server/index.js:14` requires `DB_HOST`, `DB_USER`, `DB_NAME`, and `JWT_SECRET`, but not `DB_PASSWORD`, `FRONTEND_URL`, `AI_SERVICE_URL`, mail settings, encryption keys, or MFA settings.
- `server/database.js` falls back to root and blank password.

Fix:
- Centralize environment validation.
- In production, fail fast if any required secret or endpoint is missing.
- Remove insecure production fallbacks.

Verification:
- `NODE_ENV=production npm start` fails with a clear message when secrets are missing.
- Staging boot succeeds with a complete `.env.example`.

## Phase 4 - Deployment and Runtime Fixes

### 4.1 Fix Docker Compose environment drift

Finding:
- `docker-compose.yml` does not provide `JWT_SECRET`, but the server exits if it is missing.
- AI service is configured as `AI_SERVICE_URL=http://ai-service:5001`.
- `ai_service/Dockerfile` binds Gunicorn to `8080`, exposes `8080`, and has a health check on `8080`.
- Compose maps `5001:5001` for the AI service.
- AI health check uses `curl`, but the image does not install `curl`.

Fix:
- Align AI service port across Dockerfile, compose, app config, and backend `AI_SERVICE_URL`.
- Install `curl` or use a Python healthcheck.
- Provide required server env vars through `.env` or compose secrets.

Verification:
- `docker compose up --build`
- Server `/health` succeeds.
- Backend AI routes can reach the AI service.

### 4.2 Clarify deployment targets

Finding:
- Root `vercel.json` routes API and Python service but does not build/publish the React client.
- `netlify.toml` builds only the client.
- Railway, Vercel, Netlify, Docker, and PM2 configs coexist with different assumptions.

Fix:
- Choose primary deployment topology:
  - Option A: Netlify client + Railway server + Railway AI service.
  - Option B: Docker Compose/VPS all-in-one.
  - Option C: Vercel API + Netlify client only if Python/runtime limits are validated.
- Archive or clearly label non-primary deployment configs.

Verification:
- One documented deployment path from clean clone to working app.

## Phase 5 - Code Quality and Architecture Debt

### 5.1 Break up hotspot files

Finding:
- Architectural hotspots include:
  - `server/index.js`
  - `src/App.jsx`
  - `utils/api.js`
  - `middleware/authMiddleware.js`
  - `config/roles.js`
- Code smell scan reported 315 findings, including 200 dead-code findings, 17 long functions, 5 duplicate definitions, and 93 high-complexity functions.

Fix:
- Split server bootstrap from route registration.
- Move security middleware configuration into a dedicated module.
- Generate a route manifest and apply auth middleware from a single policy table.
- Break large React pages into feature components after tests are stable.

Verification:
- Lint and tests pass before and after each extraction.

### 5.2 Normalize API error behavior

Finding:
- `client/src/utils/api.js:62` throws on 401 before callers can inspect `response.status`.
- Several callers expect a response object and contain unreachable or inconsistent 401 handling.

Fix:
- Return a typed API error object or centralize auth-expiry handling.
- Avoid clearing all `localStorage`; clear only app-owned keys.

Verification:
- Login-expired UI flow test.
- Logout flow test.

### 5.3 Remove production console noise

Finding:
- Client code logs full API URLs, response statuses, auth state, and error details.

Fix:
- Add a lightweight logger gated by environment.
- Remove sensitive auth/user data from console output.

Verification:
- Production build has no noisy auth/API debug logs.

## Phase 6 - Database and Migration Reliability

### 6.1 Resolve duplicate migration timestamps

Finding:
- Duplicate migration timestamp prefixes:
  - `20250106000000_add_file_blob_storage.js`
  - `20250106000000_create_audit_logs.js`
  - `20250124000000_add_community_programs.js`
  - `20250124000000_add_document_verification_tables.js`
  - `20260126000000_add_attachments_to_requests.js`
  - `20260126000000_add_certificate_codes.js`

Risk:
- Knex can order by full filename, but duplicate timestamps make rollback ordering and human review error-prone.

Fix:
- Rename migrations only if they have not been applied in shared environments.
- If already applied, leave files in place and add documentation to prevent future duplicate timestamps.

Verification:
- Fresh database migration succeeds.
- Rollback strategy documented for staging and production.

### 6.2 Create schema contract tests

Finding:
- The project contains many schema-fix scripts and historical audit docs, which suggests recurring schema drift.

Fix:
- Add a schema verification test that compares expected tables/columns/indexes to the current database.
- Keep seed data deterministic and sanitized.

Verification:
- `npm run db:verify-schema-usage`
- Fresh migration plus seed run in CI.

## Phase 7 - Test Coverage and CI

### 7.1 Establish a reliable test pyramid

Fix:
- Unit tests:
  - auth middleware
  - CSRF middleware
  - role mapping
  - document ownership
  - file validation
- Integration tests:
  - login/logout/MFA
  - resident document request lifecycle
  - certificate request lifecycle
  - admin user management
  - AI service fallback
- E2E smoke tests:
  - staff login
  - resident registration
  - document request
  - blotter workflow

Verification:
- CI runs lint, build, server tests, client tests, dependency audit, and migration check.

### 7.2 Repair CI inputs

Finding:
- `.github/workflows/ci-cd.yml` exists, but local commands are currently broken.

Fix:
- Make local scripts and CI scripts identical where possible.
- Pin Node and Python versions.
- Cache dependencies safely.

Verification:
- CI passes from a clean clone.

## Recommended Work Order

1. Remove `/api/debug/users`.
2. Add document download ownership enforcement.
3. Add JWT expiry and reduce cookie lifetime.
4. Fix CSRF logout and certificate write protection.
5. Install dependencies with lockfiles and restore build/lint/test execution.
6. Fix `server/__tests__/certificates.test.js` syntax.
7. Repair root/tests package scripts.
8. Upgrade vulnerable dependencies.
9. Fix Docker/compose AI port and required env vars.
10. Remove tracked generated/private artifacts and expand `.gitignore`.
11. Add route ownership/RBAC regression tests.
12. Normalize deployment docs to one primary path.
13. Refactor hotspots only after tests are green.

## Exit Criteria

- No unauthenticated sensitive-data endpoints.
- All resident-owned data routes enforce ownership.
- JWTs expire and high-risk staff actions require MFA.
- CSRF protection is consistent for cookie-auth state changes.
- `npm run build:client`, `npm run lint`, `npm test`, and `cd server && npm test -- --runInBand` run successfully.
- Production dependency audits have no critical or high findings, or documented accepted exceptions with expiry dates.
- Docker or chosen deployment target boots from a clean clone.
- Generated/private artifacts are no longer tracked.
- CI is green on a clean branch.
