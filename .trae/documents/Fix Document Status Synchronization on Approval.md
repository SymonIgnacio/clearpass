I have identified the issue: **mismatched document type names** between the file upload logic and the approval logic.

1.  **The Mismatch**:
    *   **Uploads**: `residentProfileController.js` saves documents with specific names like `PWD ID (Front)`, `PWD ID (Back)`, `Senior ID (Front)`, etc.
    *   **Approval**: `secretaryRoutes.js` tries to update documents using a hardcoded list: `'4Ps Proof', 'PWD ID', 'Senior ID', 'Solo Parent ID', 'OSY Certification'`.
    *   Because the names don't match exactly (e.g., `PWD ID` vs `PWD ID (Front)`), the database query fails to find and update the documents, leaving them as "Pending Review" even after the beneficiary status is approved.

2.  **The Fix**:
    *   I will modify `server/routes/secretaryRoutes.js` to use the correct, comprehensive list of document types defined in `server/config/documentTypes.js`.
    *   This will ensure that when an admin/secretary approves a beneficiary request, *all* related proof documents (including Front/Back variations) are correctly marked as "Verified".

This will resolve the issue where "My Documents" continues to show "Pending Review" after approval.
