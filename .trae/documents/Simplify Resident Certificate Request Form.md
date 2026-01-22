I have identified how the certificate templates and request forms are processed. To fulfill your request of hiding "CTC No", "OR No", and "Prepared By" from the resident's view while ensuring resident personal information is auto-filled, I will perform the following actions:

### 1. Filter "System-Only" Fields in the Resident UI
The resident sees these fields because they are listed in the `required_fields` of the template. I will modify the frontend to explicitly exclude these system-generated fields from being rendered in the `CertificateRequest` form.

*   **File:** `client/src/pages/CertificateRequest.jsx`
*   **Action:** In the rendering loop for `required_fields`, add a filter to skip fields with keys: `ctc_no`, `ctc_number`, `or_no`, `or_number`, `prepared_by`, `issued_on`, `issued_at`.

### 2. Auto-Fill Resident Personal Information
The system already has the resident's profile data. I will modify the `CertificateRequest` component to pre-fill known fields (like Name, Address, Age, Civil Status) using the logged-in user's profile data.

*   **File:** `client/src/pages/CertificateRequest.jsx`
*   **Action:**
    *   Fetch the current resident's profile data on component mount.
    *   When a template is selected, map the profile data to the `dynamicData` state for matching keys (e.g., `resident_name` -> `First Name + Last Name`, `address` -> `Street Address`, `age` -> Calculated from Birthdate).
    *   Set these fields as read-only or pre-filled so the resident doesn't need to type them again.

### 3. Backend Verification (No Changes Needed)
The backend `documentController.js` already handles the merging of these fields (`_mergeData` method).
*   **CTC/OR/Prepared By:** These are typically generated during the *issuance* phase by the staff, not during the *request* phase. The resident doesn't need to provide them.
*   **Resident Data:** The backend already pulls the latest resident record from the database when generating the document, ensuring the final output is accurate even if the frontend form is simplified.

This plan ensures a cleaner experience for the resident (no confusing admin fields) and automated data entry for their personal details.