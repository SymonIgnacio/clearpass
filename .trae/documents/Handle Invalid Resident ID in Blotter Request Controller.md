I will modify the `blotterRequestController.js` to handle the invalid resident ID gracefully.

### **Problem**
The error `ER_NO_REFERENCED_ROW_2` confirms that the user (ID 10249) is linked to a `resident_id` that does not exist in the `residents` table. This is an orphaned record or bad test data.

### **Plan**
1.  **Modify `server/controllers/blotterRequestController.js`**:
    *   In the `submitRequest` method, before the `INSERT` query:
    *   Add a validation step to check if `req.user.resident_id` exists in the `residents` table.
    *   `SELECT 1 FROM residents WHERE Resident_ID = ?`
    *   If no record is found, return a `400 Bad Request` with a clear message: "Your user account is not linked to a valid resident profile. Please contact the administrator."
2.  **Verify**:
    *   The 500 error will be replaced by a clear 400 error message.

**Note:** This fix handles the error gracefully in the code. To fix the *data* issue preventing submission, the administrator would need to update the user's `resident_id` in the database to a valid one, but I cannot do that blindly without knowing the correct ID.