I will fix the resident login and registration issues by updating the cookie handling and request payloads.

**Analysis of Issues:**
1.  **Login Failure After Logout:** The resident login endpoint (`/resident-auth/login`) sends the JWT token in the JSON response but *does not* set the `httpOnly` cookie (`authToken`). When the user logs out (clearing the cookie) and tries to log back in, the frontend receives a token but the browser doesn't store it as a session cookie. This causes subsequent requests (like `refreshUser` or `me`) to fail authentication.
2.  **Registration Loading/Redirection:**
    *   `ResidentRegister.jsx` manually sets `document.cookie`, which is redundant and less secure than the server-side approach we just implemented.
    *   The registration payload is missing fields collected in the form (`street_address`, `sitio`, `date_arrival`), causing data loss or potential backend validation errors if strict schemas are enforced later.
    *   The "Loading..." state might persist if the `refreshUser` call fails or if the navigation logic is race-conditioned with the cookie availability.

**Plan:**

1.  **Update Backend (`residentAuthRoutes.js`):**
    *   Modify the `/login` route to set the `authToken` cookie using `res.cookie()`, mirroring the logic we just added to the `/register` route. This ensures consistent session management.

2.  **Update Frontend (`ResidentRegister.jsx`):**
    *   **Remove Manual Cookie:** Delete the `document.cookie = ...` line. We will rely entirely on the server's `Set-Cookie` header.
    *   **Fix Payload:** Update the `apiRequest` body to include `street_address` and `date_arrival`.
    *   **Map Sitio:** The backend expects `sitio_id` (likely an integer), but the frontend sends a string name (`Batia Proper`, etc.). I need to map these names to IDs (e.g., Batia Proper=1, Northville 5=2, etc.) or check if the backend handles string lookups. *Self-Correction*: The backend registration code uses `sitio_id` but the frontend sends `sitio`. I will send it as `sitio_id` if I can deduce the ID, or pass the string if the backend schema allows it. Looking at `residentAuthRoutes.js`, it uses `household_id` and `sitio_id` in the destructuring but `sitio_id` is *not* used in the `INSERT` query. It seems `sitio_id` is derived from `household_id` or currently ignored. I will include `street_address` (as `Purok` or similar) and `date_arrival` in the payload to match the `INSERT` columns (`...Date_Arrival...`).
    *   **Improve Navigation:** Ensure `navigate` is called only after `refreshUser` completes successfully.

**Task List:**
1.  Update `server/routes/residentAuthRoutes.js`: Add `res.cookie` to `/login`.
2.  Update `client/src/pages/ResidentRegister.jsx`: Remove manual cookie, add missing fields to payload, map fields correctly (Street Address -> `Purok` or similar? The backend insert has `...First_Name...` but no address columns? Wait, looking at the `INSERT` query in `residentAuthRoutes.js`:
    ```javascript
    INSERT INTO residents (..., Household_ID, Date_Arrival, ...)
    ```
    It *does not* seem to insert `Street_Name` or `Sitio` directly into the `residents` table in the snippet I read. It might rely on `Household_ID`.
    *Refinement*: I will check the `residents` table schema or just pass the data in the request body for now so it's not lost, even if the current backend ignores it. Actually, I should probably add `Street_Name` and `Purok` (Sitio) to the INSERT if they exist in the schema.
    *Decision*: For this task, I will primarily focus on the **login cookie fix** and **frontend cleanup**. I will map `street_address` to `Street_Name` and `sitio` to `Purok` in the payload, and update the backend `INSERT` to include them if they are missing.

    *Wait*, reading `residentAuthRoutes.js` again (lines 163-167):
    `INSERT INTO residents (Resident_ID, First_Name, ..., Household_ID, Date_Arrival, ...)`
    It *misses* address fields! This is why "nothing appears". The resident is created but lacks address info. I will add `Street_Name` and `Purok` to the `INSERT` query in the backend.

**Revised Plan:**
1.  **Backend (`residentAuthRoutes.js`):**
    *   Update `/login` to set `authToken` cookie.
    *   Update `/register` to accept `street_address` and `sitio` (mapped to `Purok`?) and `date_arrival`.
    *   Update the `INSERT INTO residents` query to include `Street_Name` and `Purok` (if columns exist) or `Sitio_ID`. I'll assume `Street_Name` and `Purok` are the standard address columns based on typical schemas.

2.  **Frontend (`ResidentRegister.jsx`):**
    *   Remove `document.cookie`.
    *   Pass `street_address` and `sitio` and `date_arrival` in the API call.

This should fix the login persistence and ensure new accounts have their address data.