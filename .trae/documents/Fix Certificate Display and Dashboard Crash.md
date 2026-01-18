I have resolved the issue where certificates were not displaying, and I fixed the "certificates.filter is not a function" crash.

**Summary of Fixes:**

1. **Frontend Crash Fix (`DocumentsDashboard.jsx`):**

   * The error `certificates.filter is not a function` happened because the API sometimes returns an object (like `{ data: [] }`) instead of a plain array, especially after my previous backend changes.

   * I added a safety check: `const safeCertificates = Array.isArray(certData) ? certData : (certData.data || []);`

   * This ensures the dashboard always receives a valid array, preventing the crash.

2. **Data Visibility Fix (`certificateController.js`):**

   * Previously, the system only fetched certificates that were linked to a resident in the database (`JOIN residents`). This meant any "Manual Certificates" (which have no resident ID) were hidden.

   * I changed the query to use a `LEFT JOIN`, so **all** certificates (both linked and manual) are now retrieved.

   * I also added `COALESCE` logic to correctly display the name and address for manual certificates.

3. **Manual Issuance Fix:**

   * I updated the `create` function to properly save the manual fields (`resident_name`, `address`, etc.) you enter in the form, instead of ignoring them.

**Next Steps:**

* Please **refresh your browser** to reload the dashboard with the fixes.

* You should now see all 159+ certificates in the list, including the manual ones.

* Try issuing a new manual certificate to confirm it works end-to-end.

