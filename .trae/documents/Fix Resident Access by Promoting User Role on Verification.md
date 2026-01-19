I will fix the issue where approved residents are stuck with "Guest" access by updating the `verifyResident` function in `server/controllers/adminController.js`.

Currently, the system only updates the `residents` table status to "Active" but fails to promote the user's role from "Guest" (13) to "Resident" (12) in the `users` table.

**Plan:**
1.  **Modify `server/controllers/adminController.js`**:
    *   In the `verifyResident` function, specifically inside the `verification_type === 'residency'` block.
    *   Add a SQL query to update the linked user's role:
        ```sql
        UPDATE users SET role = 12 WHERE resident_id = ?
        ```
    *   This ensures that once a resident is verified, their user account is officially promoted, unlocking full dashboard features.

2.  **Verify**:
    *   I will review the code change to ensure it correctly targets the user associated with the verified resident ID.
    *   (Self-Correction/Refinement): I will also verify if the user needs to re-login. Since `authController.js` calculates `effective_role` on every `/me` call (session check), the change will take effect immediately upon the next page refresh or dashboard load, without requiring a logout.

This fix addresses the root cause: the disconnect between "Residency Status" and "User Role".