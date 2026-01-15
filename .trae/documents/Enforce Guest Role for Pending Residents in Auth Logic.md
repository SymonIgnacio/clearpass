I will fix the issue where pending residents are incorrectly treated as active residents by updating the backend logic to enforce the "Guest" status based on the residency verification status.

### **Root Cause**

The `authController.me` endpoint (used by `AuthContext` to refresh user data) reads the user's role directly from the `users` table and does not cross-reference the `residents` table's `Residency_Status`. Additionally, the SQL `CASE` statement used to map role IDs to names is missing the definition for the **Guest (13)** role, leading to potential null values or defaults falling back to "Resident".

### **Plan**

1. **Update** **`server/controllers/authController.js`**:

   * Modify the `me` function (and MFA related functions) to `LEFT JOIN` the `residents` table.

   * Implement dynamic role resolution: If `residents.Residency_Status` is 'Pending Verification', force the returned role to be **13 (Guest)**, regardless of the `users` table value.

   * Update the SQL `CASE` statements to explicitly map `WHEN 13 THEN 'Guest'`.

2. **Verify**:

   * This ensures that even if the database state is inconsistent (e.g., `users.role` is 12), the application logic will correctly downgrade the user to "Guest" until they are verified.

