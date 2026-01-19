I will fix the beneficiary rejection error and implement user notifications for status changes.

### **1. Fix "Error rejecting beneficiary" (400 Bad Request)**
*   **Root Cause**: Parameter mismatch.
    *   **Frontend** (`BeneficiaryValidation.jsx`): Sends `{ action, reason }`.
    *   **Backend** (`secretaryRoutes.js`): Expects `{ status, notes }`.
*   **Fix**: Update the **backend** (`secretaryRoutes.js`) to accept the frontend's parameter names (`action` and `reason`) while maintaining backward compatibility (optional, but cleaner to just map them). I will modify the route to destructure `status` from `action` and `notes` from `reason` if the original fields are missing.

### **2. Implement User Notification**
*   **Requirement**: "does it notify the user who requested it when it becomes approved or rejected".
*   **Current State**: The rejection logic in `secretaryRoutes.js` (lines 288-319) updates the database but **does not** send any notification.
*   **Fix**:
    *   Add a notification step inside the `POST /beneficiaries/:id/validate` route.
    *   Use the existing `global.createNotification` helper (or `db.execute` on `notifications` table) to alert the user.
    *   **Fetch User ID**: I need to query the `users` table to find the `user_id` associated with the `resident_id` being validated.
    *   **Message Content**:
        *   **Approved**: "Your beneficiary status claim has been approved."
        *   **Rejected**: "Your beneficiary status claim has been rejected. Reason: [Reason]"

### **Implementation Steps**
1.  **Modify `server/routes/secretaryRoutes.js`**:
    *   Update parameter extraction: `const { action, reason, status, notes } = req.body; const finalStatus = status || action; const finalNotes = notes || reason;`
    *   Update the validation check to use `finalStatus`.
    *   Inside the logic for both 'approved' and 'rejected', look up the user's ID using the `Resident_ID`.
    *   Insert a notification record for that user.

This ensures the rejection works without error and the user is informed of the outcome.