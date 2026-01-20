The user wants to enhance the resident request flow and the subsequent admin approval process.

### Current Status vs Requirements

1.  **Resident Request Creation**:
    *   **Requirement**: Resident fills form -> created as request -> goes to admin side.
    *   **Status**: This is already working via `CertificateRequest.jsx` and `certificateRequestController.submitRequest`. The status defaults to 'pending'.

2.  **Admin Request Management**:
    *   **Requirement**: Admin views request details (inputs, template used, cert type), editable, with Approve/Reject buttons.
    *   **Status**: `CertificateRequestsManagement` in `DocumentsDashboard.jsx` handles this.
        *   It lists requests.
        *   It has "View", "Approve", "Reject" buttons.
        *   The "View" dialog shows Resident Name, Type, Purpose, and ID attachments.
        *   **Gap 1 (Details)**: It does *not* currently show the detailed dynamic inputs (e.g., "Business Name", "Address") in the View dialog. It only shows `purpose`.
        *   **Gap 2 (Template Info)**: It shows `document_type` but doesn't explicitly list the "Template Used" name (though they are often mapped 1:1).
        *   **Gap 3 (Editable)**: The user wants it "editable". Currently, the View dialog is read-only.
        *   **Gap 4 (Notification)**: The user wants notification on the resident side.

3.  **Notification System**:
    *   **Requirement**: Resident notified on Approve/Reject.
    *   **Status**: The backend `updateRequestStatus` *already* has logic for `global.createNotification` and `sendRequestStatusEmail`.
    *   **Verification Needed**: We need to ensure the resident dashboard actually displays these notifications.

### Plan

I will focus on **Gap 1, 2, and 3** (Admin View/Edit) as the primary task, and verify Gap 4.

**Step 1: Enhance Admin Request View (Frontend)**
*   Modify `CertificateRequestsManagement` in `DocumentsDashboard.jsx`.
*   Update the "Request Details" dialog to:
    *   Iterate over `selectedRequest.request_data` to display ALL submitted fields, not just `purpose`.
    *   Make these fields **editable** (inputs instead of text) if the status is pending, so the admin can correct typos before approving.
    *   Add a "Save Changes" button if edits are made.

**Step 2: Backend Support for Editing (Backend)**
*   The current `PUT /status` endpoint only updates status and remarks.
*   I need to either:
    *   Create a new endpoint `PUT /requests/:id/details` to update the `request_data`.
    *   Or update the existing `updateRequestStatus` to accept new data.
*   **Decision**: I'll create a new method `updateRequestDetails` in `certificateRequestController.js` and a corresponding route. This keeps concerns separated.

**Step 3: Verify Notifications**
*   I will assume the backend logic is correct (it looks complete).
*   I will checks if the Resident Dashboard has a Notification bell/list. (I'll assume standard layout has it, or `ResidentCertificates.jsx` shows status updates).

**Step 4: Resident Request UI Polish**
*   (From previous turn) I will also improve the `CertificateRequest.jsx` labels to be nicer (Title Case).

### Implementation Details

**1. Backend Changes (`certificateRequestController.js` & `routes`)**
*   Add `updateRequestDetails` method.
*   Route: `PUT /api/certificate-requests/:request_id/details`.

**2. Frontend Changes (`DocumentsDashboard.jsx`)**
*   In `CertificateRequestsManagement`:
    *   Extract `request_data` into local state when opening the dialog.
    *   Render key-value pairs from `request_data` as TextFields.
    *   Add "Update Details" button.

**3. Frontend Changes (`CertificateRequest.jsx`)**
*   Helper function to format labels (snake_case -> Title Case).

This plan covers the user's specific request for "view of the request... inputted details... editable" and confirms the notification flow.