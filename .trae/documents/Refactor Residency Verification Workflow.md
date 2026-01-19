I have analyzed the current system architecture and identified the gaps preventing the "approved requests remain in pending" issue and other status transition problems.

**Analysis of Current System:**

1.  **Residency Verification Flow:**
    *   **Route**: `POST /admin/verify-resident/:id` (adminRoutes.js line 68)
    *   **Controller**: `adminController.verifyResident` (adminController.js line 341)
    *   **Current Logic**:
        *   Updates `residents` table: `Residency_Status` -> 'Active'.
        *   Updates `users` table: `role` -> `ROLES.RESIDENT` (12).
        *   Sends a notification.
    *   **The Gap**: It **does not** update the status of the *verification document* or the *application record* that triggered this request. The dashboard looks for `application_documents` status or `Residency_Status`. While `Residency_Status` is updated, the underlying "request" (the document upload) might still be marked as "pending" in the `application_documents` table (if that table is used for the request list).
    *   **Furthermore**: The dashboard (ResidentDashboard.jsx) constructs the "Verification Request" item based on `currentProfile?.verification_document` (which comes from `resident_documents` or `application_documents`). If `verifyResident` doesn't update the `verification_status` column in these tables, the dashboard will continue to show "Under Review" or similar, even if the user is now a Resident.

2.  **Certificate/Blotter Requests:**
    *   **Certificate**: `PUT /:request_id/status` -> `updateRequestStatus`. This seems generally correct but needs verification that it updates the dashboard view properly.
    *   **Blotter**: Handled via `blotterComplaintController`.

**Proposed Solution:**

I will refactor the **Residency Verification Workflow** (`adminController.verifyResident`) to ensure a complete state transition.

1.  **Update `verifyResident` in `adminController.js`**:
    *   In addition to updating `residents` and `users` tables, it must also:
        *   Update `resident_documents` (or `application_documents`) associated with this verification to `verification_status = 'Approved'`.
        *   This ensures the dashboard, which pulls from these tables, sees the "Approved" status instead of "Pending".
2.  **Unified Request Handling**:
    *   Ensure that when a Guest becomes a Resident, their historical requests (if any) are correctly linked. Since you mentioned "Strict Binary Switch" and keeping history, the `resident_id` linkage is key.

**Implementation Plan:**

1.  **Refactor `adminController.js`**:
    *   Modify `verifyResident` to execute a transaction that:
        1.  Updates `residents.Residency_Status` to 'Active'.
        2.  Updates `users.role` to `RESIDENT`.
        3.  Updates `resident_documents.verification_status` to 'Approved' (where status was pending).
        4.  Updates `application_documents.verification_status` to 'Approved' (if applicable).
        5.  Logs the action to `audit_logs`.
2.  **Verify Dashboard Logic**:
    *   Ensure `ResidentDashboard.jsx` correctly interprets "Approved" status to move the item from "Pending" to "Completed" (or at least remove it from Pending).

**Verification:**
*   **Test Case**: Verify a pending resident.
*   **Expected Result**:
    *   User role changes to Resident.
    *   Dashboard "Pending Requests" count drops by 1.
    *   "Residency Verification" item shows as "Verified" or moves to history.
    *   Notification is received.

This plan directly addresses the "approved requests remain in pending state" issue by synchronizing the document status with the user role status.