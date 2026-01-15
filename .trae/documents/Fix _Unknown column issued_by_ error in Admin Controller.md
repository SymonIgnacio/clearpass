I will fix the `Unknown column 'c.issued_by'` error by updating the SQL queries in `adminController.js` to match the actual database schema.

### **Planned Changes**

**File:** `server/controllers/adminController.js`

1.  **Fix `getDetailedCertificatesReport`:**
    *   Remove `c.issued_by` from the `SELECT` statement in the `certificates` query.
    *   The database schema does not store the issuer's name in the `certificates_log` table, so we will default this field to "System" in the report output.

2.  **Fix `getCertificatesReport`:**
    *   Replace the "Top Issuers" query (which relies on the non-existent `issued_by` column) with an empty array `[]`.
    *   This prevents the main dashboard from crashing while preserving the rest of the report data.

### **Verification**
*   After applying the fix, the "Detailed Certificates Report" and "Certificates Dashboard" should load without errors.
*   The "Issued By" column in the detailed report will show "System" (or generic text) instead of crashing.