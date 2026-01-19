# Fix Verification Upload Visibility

## 1. Fix Document Type Handling in Upload
- **File**: `server/controllers/residentController.js`
- **Issue**: The `uploadVerificationDocs` function ignores the `document_type` sent in the request body and instead derives it from the file field name (`file.fieldname`). The frontend sends the file as `document`, so the backend saves it with `document_type = 'document'`, effectively miscategorizing it.
- **Fix**: Update `uploadVerificationDocs` to prefer `req.body.document_type` if available.

## 2. Update Admin Document List Query
- **File**: `server/routes/secretaryRoutes.js`
- **Issue**: The `GET /resident-documents` route only queries the `resident_documents` table. Guest uploads (like the one Symon made) are stored in `application_documents`.
- **Fix**: Update the query to `UNION` results from both `resident_documents` and `application_documents` so that pending applicant uploads are also visible to the secretary/admin.

## 3. Verify Admin Frontend
- **Check**: Ensure `ResidencyVerification.jsx` displays the `resident_name` correctly for `application_documents` (it might need to join with `resident_applications` instead of `residents`).

## Summary
The root cause is twofold:
1.  **Wrong Table**: Guests upload to `application_documents`, but the Admin page only reads `resident_documents`.
2.  **Wrong Type**: The backend ignores the "Proof of Residency" label.

We will fix the backend to check both tables and correctly label the file.
