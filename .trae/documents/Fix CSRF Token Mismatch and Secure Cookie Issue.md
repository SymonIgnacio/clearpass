I have analyzed the CSRF implementation across the client and server. The setup looks mostly correct, but the error `EBADCSRFTOKEN` persists, indicating a mismatch between the token in the header and the secret in the cookie.

Here's the likely culprit:
The `csurf` middleware in `server/index.js` is configured with `cookie: { secure: process.env.NODE_ENV === 'production' }`.
*   If `NODE_ENV` is set to `production` but you are running on `localhost` without HTTPS, the browser **will not set the cookie** because it's marked `Secure`.
*   Without the cookie, the server can't verify the token, resulting in "Forbidden".

Another possibility is that the `apiRequest` utility in `client/src/utils/api.js` catches the CSRF fetch error silently (line 46-49) and proceeds without the token, which would definitely cause a 403.

### Plan

1.  **Relax CSRF Cookie Security for Development**
    *   In `server/index.js`, I will explicitly force `secure: false` for the CSRF cookie if the environment is NOT production. It currently checks `process.env.NODE_ENV === 'production'`, but I want to be double sure it's not defaulting to true in your local setup if `NODE_ENV` is missing or set oddly.

2.  **Enhance Client-Side Token Fetching**
    *   In `client/src/utils/csrf.js`, I will add more robust error logging to see if `getCsrfToken` is actually succeeding.
    *   In `client/src/utils/api.js`, I will ensure that if fetching the CSRF token *fails*, we don't just silently continue for state-changing requests (POST/PUT/DELETE). We should probably throw an error or retry, because the request is guaranteed to fail without it.

3.  **Verify `DocumentsDashboard.jsx`**
    *   I will double-check that my previous edit to `DocumentsDashboard.jsx` (switching to `apiRequest`) was applied correctly and that there are no mixed `fetch` calls remaining for certificate issuance.

This multi-pronged approach fixes the most common environment configuration issue while also hardening the client logic against silent failures.