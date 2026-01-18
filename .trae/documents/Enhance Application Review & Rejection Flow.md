I will implement the requested enhancements for both the Verification Workflow and the Reporting System.

### **Part 1: Verification Workflow Improvements**
**File:** `client/src/pages/DocumentVerification.jsx` & `client/src/components/RejectionModal.jsx`

1.  **Immediate Document Preview:**
    *   I will modify the "Review Application" dialog to use a **Split-View Layout**.
    *   **Left Side:** Applicant Details (Name, Address, etc.).
    *   **Right Side:** Automatic preview of the first uploaded document (Image or PDF).
    *   This eliminates the need to click "View" to see the proof.

2.  **Standardized Rejection with Dropdown:**
    *   I will update the `RejectionModal` to include a **Reason Dropdown**.
    *   **Options:** "Invalid ID", "Blurred Document", "Incomplete Information", "Information Mismatch", "Document Expired", "Other".
    *   Selecting "Other" will reveal a text input for custom notes.
    *   I will ensure the "Reject" button in the main table opens this modal instead of rejecting immediately.

### **Part 2: New Registration Reports**
**File:** `client/src/pages/AdminReports.jsx` & `server/controllers/adminController.js`

1.  **New Report Tab: "Registrations"**
    *   I will add a new "Registrations" tab to the Admin Reports Dashboard.

2.  **Report Features:**
    *   **Statistics Cards:** Total Applications, Approval Rate, Rejection Rate.
    *   **Rejection Analysis:** A breakdown of the most common rejection reasons (e.g., "30% Invalid ID").
    *   **Detailed Table:** A searchable, filterable table of all Approved and Rejected applications.

3.  **Backend Implementation:**
    *   I will create new API endpoints (`/admin/reports/registrations`) to aggregate this data from the `resident_applications` and `resident_documents` tables.

### **Execution Order**
1.  **Frontend (Verification):** Update `RejectionModal` and `DocumentVerification.jsx` to support previews and standardized rejection.
2.  **Backend (Reports):** Implement the new report endpoints in `adminController.js`.
3.  **Frontend (Reports):** Add the new "Registrations" tab and visualization in `AdminReports.jsx`.
