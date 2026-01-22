I will fix the CSRF token error by adjusting the server-side cookie configuration and hardening the client-side retry mechanism.

**Server-Side Fix (`server/index.js`)**

1. Update the `csurf` configuration to explicitly set `sameSite: 'lax'` in all environments. The current setting of `false` for development can lead to inconsistent browser behavior regarding cookie propagation.
2. Keep `secure` as `false` for development (localhost) and `true` for production.

**Client-Side Fix (`client/src/utils/api.js`)**

1. Increase the retry delay in the 403 error handler from 100ms to 500ms to prevent race conditions where the new cookie hasn't been persisted by the browser before the retry request is sent.
2. Add explicit logging when a CSRF retry is attempted and whether a new token was successfully obtained.

**Verification**

1. After applying the fixes, I will verify the changes by creating a test file `test-csrf.js` (or similar) to simulate the client flow if needed, but primarily I will rely on the user to retry the manual certificate issuance.
2. I will also verify the `server/index.js` middleware order remains correct.

