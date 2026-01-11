I will modify `server/controllers/adminController.js` to ensure the API responses match the structure expected by the frontend `AdminReports.jsx` component.

**1. Update `getUsersReport`**
   - Add `login_statistics` query (Total, Success, Failed attempts in last 30 days).
   - Add `recent_users` query (Top 5 most recent users).
   - Ensure the response object includes these new fields.

**2. Update `getBlotterReport`**
   - Add `monthly_trends` query (Cases grouped by Year/Month).
   - Add `active_locations` query (Top locations by incident count).

**3. Update `getCertificatesReport`**
   - Add `monthly_issuance` query (Certificates grouped by Year/Month).
   - Add `top_issuers` query (Users with most certificates issued).

**4. Update `getResidentsReport`**
   - Add `age_demographics` query (Minors, Adults, Seniors based on Birthdate).
   - Add `verification_status` query (Based on Residency_Status).
   - Add `sitio_distribution` query (Resident count by Sitio).

**5. Update `getSystemReport`**
   - Add `api_health` object (Mocked status for key endpoints).

**6. Update `getSecurityReport`**
   - Add `clearpass_security` query (Blotter stats, blocked users).
   - Add `failed_login_sources` query (Failed logins by IP/Username).
   - Add `security_events` query (Recent audit logs).

This will resolve the `TypeError: Cannot read properties of undefined (reading 'total_attempts')` error and prevent similar errors in other tabs.