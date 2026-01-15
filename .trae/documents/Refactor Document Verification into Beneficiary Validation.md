I will restructure the document verification workflow to align with the beneficiary validation process as requested.

### **Plan of Action**

1.  **Modify `DocumentVerification.jsx` (Frontend)**
    *   **Remove** the "Resident Documents" tab completely.
    *   **Remove** all associated logic (`fetchResidentDocuments`, `handleDocumentVerification`, and related state variables).
    *   The page will now focus solely on **Registration Applications** (new sign-ups).

2.  **Enhance `BeneficiaryValidation.jsx` (Frontend)**
    *   **Add Document Viewing Capability:**
        *   Insert a "View Proof" action (icon button) for each resident in the validation list.
        *   Implement a modal/dialog that fetches and displays the resident's uploaded documents (using the existing `/api/residents/:id/documents` endpoint).
        *   This allows the Secretary to verify the actual 4Ps/PWD ID *before* approving the beneficiary status.
    *   **Workflow:**
        1.  Secretary sees a resident with "Pending" beneficiary status.
        2.  Secretary clicks "View Proof" to check the ID.
        3.  Secretary clicks "Approve" to validate the membership (updating the system status).

3.  **Backend Verification**
    *   No new backend routes are needed as `/api/residents/:id/documents` is already available and accessible to the Secretary role.

### **Outcome**
*   **"Resident Document Verification"** (the generic file checker) will be **gone**.
*   **Beneficiary Validation** will now be the single source of truth for validating 4Ps/PWD claims, backed by actual document proof.
