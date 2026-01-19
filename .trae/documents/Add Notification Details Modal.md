I will fix the notification detail modal and ensure the document status updates correctly.

### **1. Notification Details Modal**
*   **Current State**: The notifications are clickable (line 98 in `NotificationBell.jsx`), but the `handleNotificationClick` function (lines 32-36) only marks the notification as read. It does **not** open a modal or display details.
*   **Requirement**: "i want to see a modal with the detailes of the notification".
*   **Plan**:
    *   Import `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` from Material UI.
    *   Add state for `selectedNotification` and `modalOpen`.
    *   Update `handleNotificationClick` to set the selected notification and open the modal (in addition to marking as read).
    *   Render a `Dialog` component that displays the notification's title, full message, type, and timestamp.

### **2. Pending Review Status Issue**
*   **Problem**: "i still see the pending review status" (implied: for rejected documents).
*   **Investigation**:
    *   I previously added logic to `secretaryRoutes.js` to update `resident_documents` status to 'rejected' when a beneficiary claim is rejected.
    *   However, if the user is still seeing "Pending Review", it's possible:
        *   The frontend (`ResidentDocuments.jsx` or similar) hasn't refreshed the data.
        *   The update query in `secretaryRoutes.js` didn't match the records (e.g., case sensitivity or mismatch in `document_type`).
*   **Verification**:
    *   I used `document_type IN ('4Ps Proof', 'PWD ID', ...)` in the backend update.
    *   I need to ensure the frontend displays the *current* status from the database.
    *   If the user's screenshot shows "Pending Review" *after* my previous fix, it might be because they haven't refreshed, OR the backend update failed silently.
    *   **Refined Plan**: I will double-check the SQL query I added to `secretaryRoutes.js` to ensure it matches the document types exactly as they are stored in the DB. (I used the string literals from the code, but I should verify).
    *   Also, I will verify if `ResidentDocuments.jsx` (the page showing the list) has a mechanism to refresh data, or if the user needs to reload.

**Actually**, the user's message "i still see the pending review status" came *after* I claimed to fix it. This suggests the fix didn't work as expected or the data wasn't updated.
I will add a `console.log` or similar debug (or just review the code carefully) to ensure the `UPDATE` query is correct.
Wait, I see the query I added:
`UPDATE resident_documents SET ... WHERE resident_id = ? AND document_type IN ('4Ps Proof', ...) AND verification_status = 'pending'`

If the documents were *already* processed or if the type string doesn't match exactly (e.g. "PWD ID" vs "pwd_id"), the update would verify 0 rows.
Earlier in `secretaryRoutes.js` (lines 328-333), the code checks for types like `pwd`, `pwd_id`.
My update used `PWD ID`.
I should make the `IN` clause robust by including both the display names and the internal codes if they differ.
*   The frontend `ResidentProfile.jsx` uploads with `upload.fields([{ name: 'Is_PWD_File' ... }])`.
*   The controller `residentProfileController.js` saves them with types: `'4Ps Proof'`, `'PWD ID'`, `'Senior ID'`, `'Solo Parent ID'`, `'OSY Certification'`. (Lines 187-191).
So my update query *should* be correct if it matches those strings.

**Hypothesis**: Maybe the `resident_id` in `vulnerabilities` table (which comes from `req.params.id`) matches, but the `resident_documents` table might use a different ID format or the documents are associated differently?
No, `resident_documents` uses `resident_id`.

I will focus on the **Notification Modal** first as it's a new feature request, and then I will re-verify the status update logic.

**Revised Plan:**
1.  **Notification Modal**:
    *   Modify `client/src/components/NotificationBell.jsx` to include a `Dialog` for viewing notification details.
2.  **Verify Status Update**:
    *   I will review the `secretaryRoutes.js` code I just modified.
    *   I will ensure the `UPDATE` query covers all possible variations of document types, just in case.

Let's start with the Notification Modal.