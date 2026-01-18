I have identified the cause of the `403 Forbidden` error.

**Analysis:**

1. The frontend makes a `PUT` request to `/api/residents/:id/archive`.
2. The `residentRoutes.js` router (mounted at `/api/residents`) does not have a handler for `PUT /:id/archive` (it uses `DELETE /:id` for archiving).
3. The request falls through to the main `routes.js` router (mounted at `/api`).
4. `routes.js` has a handler for `PUT /residents/:id/archive` (Line 1219), but it is restricted to `[ROLES.ADMIN, ROLES.CAPTAIN]`.
5. The current user likely has the `SECRETARY` role (or similar) which is permitted in the newer `residentRoutes.js` but missing in the legacy `routes.js` fallback.

**Plan:**

1. **Update** **`server/routes.js`**:

   * Locate the `PUT /residents/:id/archive` route.

   * Add `ROLES.SECRETARY` to the allowed roles list.

   * This will align the legacy route permissions with the modern route permissions.

2. **Verify**:

   * Since I cannot run the full frontend/backend stack interactively to reproduce the click, I will verify the code change ensures `ROLES.SECRETARY` is included.

