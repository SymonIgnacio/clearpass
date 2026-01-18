I will resolve the confusion by clearly separating the two validation workflows as requested.

### **Analysis of the Confusion**
1.  **Residency Application (Phase 1):**
    *   **Goal:** Verify a new user lives in the barangay.
    *   **Handled By:** `DocumentVerification.jsx` -> "Registration Applications" tab.
    *   **Issue:** The "Resident Documents" tab I added recently (to fix the anomaly user) is currently showing *all* uploaded documents, including 4Ps/PWD IDs. This creates overlap with the Beneficiary Validation page.
2.  **Beneficiary Validation (Phase 2):**
    *   **Goal:** Verify a *Resident's* claim to a specific status (4Ps, PWD, etc.).
    *   **Handled By:** `BeneficiaryValidation.jsx`.
    *   **Issue:** Admins see 4Ps documents in the "Resident Documents" tab of the other page, confusing them on where to click "Approve".

### **Implementation Plan**

#### **1. Update Backend: Filter `secretary/resident-documents`**
*   Modify `server/routes/secretaryRoutes.js`.
*   Update the `GET /resident-documents` endpoint to **exclude** beneficiary-related document types (`4ps`, `pwd`, `solo_parent`, `osy`, `senior`).
*   This ensures `DocumentVerification.jsx` (Resident Documents tab) *only* shows "Residency Proofs" (e.g., utility bills, cedula, barangay IDs).

#### **2. Update Frontend: `DocumentVerification.jsx`**
*   Rename the "Resident Documents" tab to "Residency Proofs" or "General Documents" to be more specific.
*   Add a tooltip or note saying "Beneficiary documents (4Ps, PWD) are handled in the Beneficiary Validation page."

#### **3. Verify `BeneficiaryValidation.jsx`**
*   Ensure the "View Proof" button correctly fetches the relevant document. (It currently fetches *all* documents for that resident; I might need to filter client-side or ensure the backend `secretary/beneficiaries` endpoint returns the specific document ID if possible, or just rely on the user finding the right file in the list).
    *   *Refinement:* The `BeneficiaryValidation` page opens a modal with *all* documents. This is acceptable, as long as the *action* (Approve Status) is done there.

### **Summary of Changes**
*   **`secretaryRoutes.js`**: Filter `GET /resident-documents` query to `WHERE document_type NOT IN ('4ps', 'pwd', 'solo_parent', 'osy')`.
*   **`DocumentVerification.jsx`**: Rename tab to "Residency Verification (Existing Residents)".

This aligns with your workflow:
*   **Document Verification Page** -> strictly for "Do you live here?" (Residency).
*   **Beneficiary Validation Page** -> strictly for "Are you 4Ps/PWD?" (Vulnerability).