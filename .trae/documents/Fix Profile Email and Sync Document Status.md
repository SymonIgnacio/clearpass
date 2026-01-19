I will fix the missing email in the profile page and repair the inconsistent document statuses in the database.

### **1. Fix Missing Email in "My Profile"**
*   **Root Cause**: The frontend (`ResidentProfile.jsx`) expects the email property to be lowercase `email`, but the backend (`residentProfileController.js`) returns it as uppercase `Email` (since it does `SELECT r.*` from the `residents` table where the column is likely capitalized, or MySQL is returning it that way).
*   **Fix**: Update `server/controllers/residentProfileController.js` to explicitly select and alias the email column as lowercase, or ensure the response object includes a lowercase `email` property.
    *   I will modify the query to `SELECT r.*, r.Email as email ...`.
    *   Alternatively, I can map it in the JSON response: `res.json({ success: true, data: { ...residents[0], email: residents[0].Email } });`

### **2. Fix "Pending Review" Status for Rejected Documents**
*   **Requirement**: "fix the old record and then i will try it again".
*   **Action**: I will execute a one-time SQL command to synchronize the `resident_documents` table with the `vulnerabilities` table.
    *   **Logic**: If `vulnerabilities.validation_status` is 'rejected', set corresponding `resident_documents.verification_status` to 'rejected'.
    *   **Query**:
        ```sql
        UPDATE resident_documents rd
        JOIN vulnerabilities v ON rd.resident_id = v.Resident_ID
        SET rd.verification_status = 'rejected'
        WHERE v.validation_status = 'rejected' 
        AND rd.document_type IN ('4Ps Proof', 'PWD ID', 'Senior ID', 'Solo Parent ID', 'OSY Certification')
        AND rd.verification_status = 'pending';
        ```
    *   I will run this using the `mysql` command line tool.

### **Plan Details**
1.  **Backend Code Change**: Modify `residentProfileController.js` to ensure `email` is returned in lowercase.
2.  **Database Repair**: Run the SQL update to fix the "Pending Review" status for existing rejected claims.

This will resolve both the UI display issue and the data inconsistency.