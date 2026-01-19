# Overlooked Bug: Rejection Fails for Applicants

I have found the issue with document rejection.

## 1. The Issue: Wrong Table Targeted
- **Frontend**: The `ResidencyVerification` page displays a mixed list of documents from two tables:
    1.  `resident_documents` (Verified Residents) -> `source_type: 'resident'`
    2.  `application_documents` (Guest Applicants) -> `source_type: 'application'`
- **Backend**: The endpoint `POST /api/secretary/documents/:id/verify` **hardcodes** the update to `resident_documents`.
- **The Bug**: When you reject a document from a Guest Applicant (e.g., Symon), the ID belongs to `application_documents`. The backend tries to find it in `resident_documents`, finds nothing, updates 0 rows, but returns "Success".
- **Result**: The UI thinks it worked, refreshes the list, but the database wasn't changed, so the document reappears as "Pending".

## 2. The Fix: Dynamic Table Selection
- I will modify the backend route `POST /api/secretary/documents/:id/verify` to accept a `source_type` parameter (or infer it).
- I will modify the frontend `ResidencyVerification.jsx` to send the `source_type` when verifying/rejecting.

## Plan Execution
1.  **Frontend**: Update `client/src/pages/admin/ResidencyVerification.jsx` to pass `source_type` in the API call.
2.  **Backend**: Update `server/routes/secretaryRoutes.js` to switch between `resident_documents` and `application_documents` based on the `source_type`.

This will ensure the correct table is updated for Guest Applicants.
