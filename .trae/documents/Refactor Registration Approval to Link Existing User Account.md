I have no further questions. The requirement is clear: **Link the existing user account to the new resident profile instead of creating a duplicate account.**

### **Implementation Plan**
I will modify `server/routes/secretaryRoutes.js` to:

1.  **Remove User Creation:** Delete the `INSERT INTO users` block and the password generation logic.
2.  **Update Existing User:** Change the logic to `UPDATE users` matching the application's email.
    *   Set `resident_id` to the newly generated Resident ID.
    *   Set `role` to `ROLES.RESIDENT` (so they gain resident privileges).
3.  **Update Response:** Remove the returned credentials from the API response.

I will proceed with these changes immediately.
