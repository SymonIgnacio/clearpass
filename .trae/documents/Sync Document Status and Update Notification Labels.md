I will fix the document status sync issue and update the notification styles.

### **1. Fix "My Documents" Status Sync**
*   **Problem**: When a beneficiary claim is rejected (via `secretaryRoutes.js`), the `vulnerabilities` table is updated to 'rejected', but the **associated document** in the `resident_documents` table remains 'pending'. This causes the "My Documents" page (which reads from `resident_documents`) to still show "Pending Review".
*   **Fix**: Update the `POST /beneficiaries/:id/validate` route in `server/routes/secretaryRoutes.js`.
    *   When rejecting a beneficiary claim, I must also find the relevant documents (PWD ID, Senior ID, etc.) in `resident_documents` and update their `verification_status` to 'rejected'.
    *   Specifically, I will execute an `UPDATE` query on `resident_documents` where `resident_id` matches and `document_type` is one of the beneficiary types.

### **2. Update Notification Styles**
*   **Problem**: The user wants the notification labels to be "Approved" and "Rejected" instead of "Success" and "Error".
*   **Fix**: Update the notification creation calls in `server/routes/secretaryRoutes.js`.
    *   Change the `type` parameter from `'error'`/`'success'` to custom types or simply change the *title/message* if the UI derives the badge from the type.
    *   Wait, the user said: *'also in the notification make sure its not saying "error" or "success" change it to "approved" and "rejected"'*.
    *   Looking at the screenshot, the "error" and "success" are likely the *visual badges* derived from the notification `type`. The notification system likely maps `error` -> Red Badge and `success` -> Green Badge.
    *   I cannot change the *underlying* type if the frontend component (`NotificationContext` or similar) relies on 'error'/'success' for color coding.
    *   However, if the user means the **text label** inside the badge, I need to check the frontend notification component.
    *   **Hypothesis**: The frontend component likely renders the `type` directly as the badge text.
    *   **Action**: I will check `client/src/components/NotificationCenter.jsx` (or similar) to see how the badge text is rendered. If it just capitalizes the type, I might need to send a custom type or map it on the frontend.
    *   **Simpler Backend Fix (if frontend supports it)**: I will verify if I can send 'rejected' and 'approved' as types, and if the frontend handles them with the correct colors. If not, I will update the frontend mapping.

### **Plan Details**
1.  **Backend (`secretaryRoutes.js`)**:
    *   In the rejection block: Add SQL to update `resident_documents` status to 'rejected'.
    *   In the approval block: Add SQL to update `resident_documents` status to 'verified' (or 'approved').
2.  **Frontend/Backend Notification**:
    *   Check `NotificationCenter` logic.
    *   If it maps `type` -> Badge Text, I will add mapping for `approved` (green) and `rejected` (red).
    *   Update backend to send `type: 'rejected'` instead of `error` and `type: 'approved'` instead of `success`.

This ensures the document status reflects the decision and the notifications match the user's preferred terminology.