I have confirmed the cause of the issue. When an admin verifies a document, the system updates the document's status in the `resident_documents` table but **does not update the resident's account status** in the `residents` table. As a result, the resident remains in a "Guest" or "Pending Verification" state even after their proof is verified.

### **Plan: Update Resident Status on Document Verification**

I will modify the backend logic so that when a document (specifically a proof of residency) is verified, the system automatically upgrades the resident's status.

#### **1. Update `secretaryRoutes.js` (Backend)**
*   **Target File**: `server/routes/secretaryRoutes.js`
*   **Action**: Modify the `POST /documents/:id/verify` route (lines 575–599).
*   **Logic Change**:
    1.  After updating the `resident_documents` table to set `verification_status = 'verified'`, verify if the document belongs to a resident (check `resident_id`).
    2.  If verified, update the `residents` table:
        *   Set `Residency_Status` to `'Active'`.
    3.  Update the `users` table:
        *   Set `role` to `12` (Resident Role) instead of `13` (Guest).
        *   Set `is_active` to `true`.

#### **2. Update `ResidentDashboard.jsx` (Frontend)**
*   **Target File**: `client/src/pages/ResidentDashboard.jsx`
*   **Action**: Ensure the dashboard reflects the new status immediately.
*   **Logic Change**: The dashboard already checks `user.role` and `profile.Residency_Status`. Once the backend updates these, the next time the user refreshes or logs in, they will see the full resident dashboard instead of the guest view.

### **Verification Plan**
1.  **Guest**: Log in and check status (should be "Guest" / "Verification Required").
2.  **Admin**: Go to "Residency Verification" and verify the guest's uploaded document.
3.  **Guest**: Refresh the dashboard.
    *   **Expectation**: The "Verification Required" banner disappears. The user role (if token refreshed or re-logged) or dashboard view should switch to the full Resident view.

I will proceed with updating `secretaryRoutes.js` to implement the status promotion logic.
