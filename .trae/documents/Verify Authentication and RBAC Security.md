## Authentication & RBAC Verification Plan

Based on the analysis of `authController.js`, `routes.js`, and the frontend routing config, here is how the system currently enforces security and how I will verify it:

### 1. Authentication System Verification

**Current Implementation:**

* **Separation Enforced:** `authController.login` explicitly checks the request path:

  * If path contains `/officer-login` and user is `RESIDENT` -> **403 Forbidden**.

  * If path contains `/resident/login` and user is `STAFF` (non-resident) -> **403 Forbidden**.

* **Credentials:** Standard `bcrypt` comparison remains unchanged.

* **Roles Supported:** Admin (1), Captain (2), Secretary (3), Clerk (4), Blotter Officer (6), Resident (12).

**Verification Steps:**

* Run a test script to attempt login for **every role** against **both endpoints**.

* **Expectation:**

  * Staff (Admin, Captain, etc.) -> Success on `/officer-login`, Fail on `/resident/login`.

  * Resident -> Success on `/resident/login`, Fail on `/officer-login`.

### 2. Role-Based Access Control (RBAC) Verification

**Current Implementation:**

* **Frontend (`App.jsx`):**

  * Protected routes use `ProtectedRoute` with specific `requiredRoles`.

  * Example: `admin/settings` requires `[1]` (Admin).

  * Example: `clerk/dashboard` requires `[1, 4]` (Admin, Clerk).

* **Backend (`routes.js`):**

  * Routes use `verifyToken` followed by `verifyRole([...])`.

  * Example: `/admin/users` requires `ROLES.ADMIN`.

**Verification Steps:**

* The test script will inspect `server/routes.js` and `client/src/App.jsx` (static analysis) to confirm no role IDs were altered.

* **Manual Confirmation:** I have already read `roles.js` and `App.jsx`, and the IDs match the standard configuration (1=Admin, 12=Resident, etc.).

### 3. Testing Requirements

I will create and run a comprehensive test script (`scripts/verify_auth_rbac.js`) that:

1. **Simulates Logins:** Uses `axios` (or `fetch`) to hit the local running server.
2. **Tests all Roles:** Superadmin, Captain, Secretary, Clerk, Blotter officer, Resident.
3. **Tests Cross-Access:** Verifies that a Resident cannot use the Officer login and vice-versa.
4. **Verifies Session:** Checks that a valid token is returned.

### 4. Expected Outcomes

* **Success:** All valid logins return 200 OK + Token.

* **Rejection:** Invalid role/endpoint combinations return 403.

* **Consistency:** No changes to existing RBAC rules (Admin still has full access, Captain is read-only where specified, etc.).

I will now proceed to create the test script and execute it to provide the final confirmation.
