I will implement the certificate request workflow enhancements, focusing on status filtering, automatic PDF generation, and manual issuance tracking.

### **Requirements Analysis**
1.  **Certificate Request Management**:
    *   **Filtering**: Add "Pending", "Approved", and "Rejected" tabs to the admin interface.
    *   **Visibility**: Ensure the "Certificate Requests" list only shows requests matching the selected status.
    *   **Download**: For "Approved" requests, replace the Approve/Reject buttons with a "Download Certificate" button.
2.  **Manual Issuance Tracking**:
    *   When an admin manually issues a certificate, it must appear in the "Approved" requests list (or at least be trackable as an approved item).
    *   Currently, manual issuance goes to `certificates_log` (Certificate History). To make it appear in "Requests", I might need to insert a record into `document_requests` as well, or simply rely on the existing "Certificate History" tab which the user acknowledged ("i know that i already have a certificate history").
    *   *Correction*: The user said: "make sure when issueing a certificate on the admin/staff side it will go to the approved requests for tracking of that." This implies they want a unified view or a specific record in the requests table. I will insert a record into `document_requests` with status 'approved' when manually issuing.
3.  **PDF Generation**:
    *   **Automatic Download**: When issuing manually or approving a request, the system should automatically generate and download the PDF.
    *   **Existing Framework**: The system uses `pdfkit` on the backend (`documentController.js`).
    *   **Action**: I need to ensure the frontend triggers the download endpoint immediately after the success response from "Approve" or "Issue".

### **Implementation Plan**

#### **1. Frontend: `DocumentsDashboard.jsx`**
*   **Add Tabs**: Implement `Tabs` component for Pending/Approved/Rejected.
*   **Update Fetch**: Modify `fetchRequests` to pass the `status` filter to the backend.
*   **Action Columns**:
    *   *Pending*: Show View, Approve, Reject.
    *   *Approved*: Show View, Download (PDF).
    *   *Rejected*: Show View (with rejection reason).
*   **Auto-Download**:
    *   In `handleApproveRequest`, after successful API call, trigger `window.open` or a hidden link click to the PDF download endpoint.
    *   In `handleIssueCertificate` (Manual), do the same.

#### **2. Backend: `certificateRequestController.js`**
*   **Filtering**: `getAllRequests` already supports `status`. I will double-check it works as expected.
*   **Manual Issuance Sync**:
    *   Modify `certificateController.create` (Manual Issue) to *also* insert a record into `document_requests` with status 'approved'. This ensures it appears in the "Approved Requests" tracking as requested.

#### **3. Backend: `documentController.js` (PDF)**
*   Ensure the `downloadDocument` endpoint is accessible and works for both request-based and manual certificates.
*   I might need to expose a route like `GET /documents/download/:requestId` or `GET /certificates/:controlNo/pdf`.

### **Step-by-Step Execution**
1.  **Frontend**: Add Tabs and Filter Logic to `DocumentsDashboard.jsx`.
2.  **Backend**: Update `certificateController.js` to sync manual issuance to `document_requests`.
3.  **Frontend**: Implement "Download" button and Auto-Download logic.

Let's start with the Frontend Tabs.