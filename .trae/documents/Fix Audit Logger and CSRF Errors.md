I have identified the causes for both errors and have a fix ready.

### **1. Fix Audit Logger Error (`Bind parameters must not contain undefined`)**

**Issue:** The `logAuditToDatabase` function passes `undefined` values (specifically `session_id` and potentially others) to the database query. The MySQL driver requires explicit `null` values.
**Fix:** Update `server/middleware/auditLogger.js` to strictly convert any `undefined` fields to `null` before executing the SQL query.

### **2. Fix CSRF Error (`ForbiddenError: invalid csrf token`)**

**Issue:** The CSRF protection is configured with `sameSite: 'strict'`. In a development environment where the frontend (`port 5174`) and backend (`port 3002`) run on different ports, this can prevent the browser from sending the CSRF cookie, leading to validation failure.
**Fix:** Update `server/index.js` to change the CSRF cookie setting to `sameSite: 'lax'`. This maintains security while being more permissive for cross-port communication in development.

**Plan:**

1. **Edit** **`server/middleware/auditLogger.js`**:

   * Sanitize `auditEntry` properties to ensure no `undefined` values are passed to `db.execute`.
2. **Edit** **`server/index.js`**:

   * Modify the `csrf` middleware configuration to use `sameSite: 'lax'`.

