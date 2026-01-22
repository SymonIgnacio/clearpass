## Scope
- Resolve errors when opening My Profile/Resident Profile
- Fix failures when requesting acknowledgement/claiming beneficiary status
- Add robust error handling and consistent API contracts

## Current Findings
- Client pages and routing:
  - ResidentProfile page: data fetch and beneficiary update [ResidentProfile.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/ResidentProfile.jsx)
  - Dashboard navigation: [ResidentDashboard.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/ResidentDashboard.jsx#L414-L423)
  - Route guard: [ProtectedRoute.jsx](file:///c:/xampp/htdocs/clearpass/client/src/components/ProtectedRoute.jsx#L19-L47)
- Server endpoints:
  - GET/PUT profile: [residentProfileRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/residentProfileRoutes.js#L11-L33) → [residentProfileController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/residentProfileController.js)
  - Beneficiary update: PUT /api/resident-profile/beneficiary-status [residentProfileController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/residentProfileController.js#L145-L277)
- Likely causes:
  - Auth/role mismatch causing guard redirects or 403
  - Null residentId or profile fields leading to runtime errors
  - CSRF/403 retries from api utility [api.js](file:///c:/xampp/htdocs/clearpass/client/src/utils/api.js#L82-L106)
  - FormData keys/file validations not matching server expectations

## Console Logs (7 items to check)
1) Verification status fetch error [ResidentProfile.jsx:L113](file:///c:/xampp/htdocs/clearpass/client/src/pages/ResidentProfile.jsx#L113)
2) Blotter history fetch error [ResidentProfile.jsx:L125](file:///c:/xampp/htdocs/clearpass/client/src/pages/ResidentProfile.jsx#L125)
3) Beneficiary submission error [ResidentProfile.jsx:L211](file:///c:/xampp/htdocs/clearpass/client/src/pages/ResidentProfile.jsx#L211)
4) Request start log [api.js:L28](file:///c:/xampp/htdocs/clearpass/client/src/utils/api.js#L28)
5) CSRF missing/refresh warnings [api.js:L47-L93](file:///c:/xampp/htdocs/clearpass/client/src/utils/api.js#L47-L93)
6) 403 auto-recover warning [api.js:L106](file:///c:/xampp/htdocs/clearpass/client/src/utils/api.js#L106)
7) Beneficiary update server error [residentProfileController.js:L274](file:///c:/xampp/htdocs/clearpass/server/controllers/residentProfileController.js#L274)

## Plan
- Reproduce and capture
  - Open My Profile and capture console + Network errors; note status codes and failing URLs
  - Attempt beneficiary claim; record payload, files, and server responses
- Client hardening
  - Guard null residentId/profile fields in ResidentProfile fetches; use safe defaults
  - Normalize error handling: show non-blocking toasts and fallback UI instead of uncaught exceptions
  - Validate upload inputs: file size/MIME; ensure FormData keys match server
  - Route access messaging for guests when guard blocks
- Server hardening
  - residentProfileController: return clear 4xx for validation/auth, only 5xx for unexpected errors
  - Validate beneficiary payload; sanitize filenames; enforce allowed MIME/types; size limits
  - Ensure queries use Knex/parameters and handle missing records gracefully
- Logging & Observability
  - Centralize client logs via a lightweight logger; reduce noisy console output
  - Add structured server logs for profile/beneficiary endpoints with correlation IDs
- Tests
  - Client tests for error states and upload validation
  - Server integration tests for profile fetch/update and beneficiary update
- Verification
  - Run full stack, retest flows, confirm no errors and consistent user messaging

## Clarifying Questions
- What role are you logged in with when errors appear (resident vs guest)?
- Can you paste the exact 7 console errors/messages and failing request URLs?
- What files are you attaching for beneficiary claim (types/sizes)?
- Is the backend running on port 3002 and the client on 5174?
- Do errors persist after refresh or only on first load?
