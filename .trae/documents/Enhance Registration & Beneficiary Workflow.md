I have a clear understanding of your requirements now.

### **Phase 1: Database Updates**
1.  **Create `identity_verifications` Table**:
    *   This will store "Proof of Residency" documents separately.
    *   Columns: `id`, `resident_id`, `file_path`, `document_type` (e.g., 'government_id', 'utility_bill'), `status` ('pending', 'verified', 'rejected'), `verified_by`, `verification_notes`.
    *   *Why*: Keeps identity proof separate from beneficiary proof (`resident_documents` or `beneficiary_documents`).

### **Phase 2: Backend Logic**
1.  **Update `residentAuthRoutes.js`**:
    *   Ensure registration sets `Residency_Status` to `'Pending Verification'`.
    *   Add endpoints for uploading identity docs (`/resident-auth/verify-identity`).
2.  **Middleware Update**:
    *   Create a middleware `requireVerifiedResident` to block unverified users from accessing document request endpoints (`/documents/request`).
3.  **Secretary Routes**:
    *   Add endpoints to fetch and approve/reject items from `identity_verifications`.

### **Phase 3: Frontend Implementation**
1.  **Dashboard Update (`DocumentsDashboard.jsx` & `ResidentDashboard.jsx`)**:
    *   Add a **"Verification Status"** banner.
    *   If `Unverified`: Show "Upload Proof of Residency" button. Disable/Lock document request buttons.
    *   If `Verified`: Show standard dashboard.
2.  **New Component (`BeneficiaryEligibility.jsx`)**:
    *   Create a new permanent tab/page "Eligibility".
    *   Show cards for each vulnerability (4Ps, PWD, etc.).
    *   Clicking a card opens a modal to upload proof to the existing `resident_documents` table (managed as beneficiary proof).

### **Execution Plan**
1.  **Database**: Create the new `identity_verifications` table.
2.  **Backend**: Implement the verification upload & approval endpoints.
3.  **Frontend**: Update the Dashboard to handle the "Locked" state and add the Upload interface.
4.  **Frontend**: Build the "Beneficiary Eligibility" page with the cards interface.

I will start with the Database and Backend changes first to establish the foundation.

**Shall I proceed with creating the migration for the new table?**