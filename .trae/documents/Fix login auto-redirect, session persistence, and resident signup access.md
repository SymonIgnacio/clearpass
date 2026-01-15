## Goals (based on your answers)
- Enable resident self-registration.
- Keep a separate staff/admin login page.
- Make login/session behavior consistent (no “back to login” while authenticated).

## Root causes mapped to your three issues
1. **Signup page can’t be accessed**: `/signup` route is commented out in [App.jsx](file:///c:/xampp/htdocs/clearpass/client/src/App.jsx#L310-L318), but the login button links to it in [Login.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/Login.jsx#L162-L180).
2. **Auto admin login after clicking Create Account**: because `/signup` doesn’t exist, navigation falls into protected routing; if an `authToken` cookie still exists, [ProtectedRoute](file:///c:/xampp/htdocs/clearpass/client/src/components/ProtectedRoute.jsx#L19-L22) will allow entry and it looks like “auto login”. Browser autofill makes this look worse.
3. **Back button returns to login**: `/login` and `/officerlogin` don’t redirect away when already authenticated, so back navigation can show the login page even though the cookie session is still valid.

## Proposed solution (efficient + clean)
### 1) Make resident signup reachable and correct
- Add a public `/signup` route as an alias to resident registration:
  - Either render `ResidentRegister` directly or `Navigate` to `/resident/register`.
- Update the “Create an Account” button in [Login.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/Login.jsx#L162-L180) to point to `/signup` (keeps a nice URL) or directly to `/resident/register`.
- Fix `ResidentRegister.jsx` runtime error by adding the missing `handleChange`.

### 2) Enforce truly separate staff vs resident login
- Keep these URLs:
  - Residents: `/login` (Resident Login)
  - Staff/Admin: `/officerlogin` (Officer Login)
- Make the backend enforce the separation using the already-existing routes:
  - `/auth/resident/login` must only allow role 12.
  - `/auth/officer-login` must reject role 12.
  - This prevents residents logging in via staff page and prevents staff logging in via resident page.
- Update `AuthContext.login()` to accept an optional `endpoint` (default stays `/auth/login`), so:
  - [Login.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/Login.jsx) uses `/auth/resident/login`.
  - [OfficerLogin.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/OfficerLogin.jsx) uses `/auth/officer-login`.

### 3) Fix session persistence / back-button behavior
- Add a redirect-on-auth guard in both login pages:
  - If `loading === false` and `isAuthenticated && user`, redirect away from login.
  - Residents go to `/resident/dashboard`.
  - Staff/Admin go to `/` (dashboard).
- Improve [ProtectedRoute](file:///c:/xampp/htdocs/clearpass/client/src/components/ProtectedRoute.jsx) unauth redirect:
  - If `requiredRoles` contains `12`, redirect to `/login`.
  - Otherwise redirect to `/officerlogin`.
  - This makes unauth access land on the correct login page.

### 4) Reduce “stale auth” edge cases on logout
- Make cookie clearing unambiguous by setting `path: '/'` in both `res.cookie()` and `res.clearCookie()` in [authController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/authController.js#L135-L215).

## Verification checklist
- Logout → reload `/login` → click Create Account → registration form renders.
- Navigate to `/signup` directly → registration form renders.
- Register a resident → login via `/login` works → resident routes work.
- Login as staff via `/officerlogin` → back button does not leave you on login (it redirects back to dashboard).
- Staff creds on resident login page get rejected; resident creds on officer login get rejected.

If you confirm this plan, I’ll implement it across the router, the two login pages, `ProtectedRoute`, `AuthContext`, and the auth controller.