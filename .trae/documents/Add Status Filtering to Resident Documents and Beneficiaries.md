I will add filtering to both Resident Documents and Beneficiary Validation.

### **1. Backend Changes (`server/routes/secretaryRoutes.js`)**

*   **Endpoint 1: `GET /resident-documents`**
    *   Add `status` query parameter.
    *   Update SQL query to filter by `verification_status` based on the param (default to 'pending' if not provided).
*   **Endpoint 2: `GET /beneficiaries`**
    *   Add `status` query parameter.
    *   Update SQL query to filter by `validation_status` (default to 'pending' if not provided).

### **2. Frontend Changes**

*   **`client/src/pages/DocumentVerification.jsx`** (Resident Documents Tab)
    *   Add state `docFilterStatus` (default 'pending').
    *   Add a `ToggleButtonGroup` (Pending, Verified, Rejected) in the "Resident Documents" tab (similar to the one added for applications).
    *   Update `fetchResidentDocuments` to use the `docFilterStatus` in the API call.
    *   Add `docFilterStatus` to the `useEffect` dependency array.

*   **`client/src/pages/BeneficiaryValidation.jsx`**
    *   Add state `filterStatus` (default 'pending').
    *   Add a `ToggleButtonGroup` (Pending, Approved, Rejected) at the top of the page.
    *   Update `fetchPendingBeneficiaries` (rename to `fetchBeneficiaries`) to use the `filterStatus` in the API call.
    *   Add `filterStatus` to the `useEffect` dependency array.

### **Verification Plan**
1.  Apply changes.
2.  Navigate to **Document Verification -> Resident Documents** tab. Verify filtering works.
3.  Navigate to **Beneficiary Validation** page. Verify filtering works.
