## What They Are (Answer)
- **Verify Documents** is for *registration + document approval*.
  - Frontend page: [DocumentVerification.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/DocumentVerification.jsx)
  - It manages 2 things:
    - **Resident registration applications**: `GET /api/secretary/applications` and per-application documents `GET /api/secretary/applications/:id/documents` (plus download + approve/reject). See [secretaryRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/secretaryRoutes.js#L197-L236).
    - **Uploaded resident documents**: `GET /api/secretary/resident-documents` and `POST /api/secretary/documents/:documentId/verify`.
  - In short: this is the secretary/admin “KYC-style” step—review uploaded IDs/proofs and either approve/reject. Approving an application even generates credentials and migrates the applicant to main tables (see [secretaryRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/secretaryRoutes.js#L314-L405)).

- **Validate Beneficiaries** is for *benefit eligibility / vulnerability validation* (PWD, Senior, Solo Parent, 4Ps, etc.).
  - Frontend page: [BeneficiaryValidation.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/BeneficiaryValidation.jsx#L31-L77)
  - Backend endpoints:
    - `GET /api/secretary/beneficiaries` returns residents with vulnerability flags whose `validation_status` is pending.
    - `POST /api/secretary/beneficiaries/:id/validate` marks them approved/rejected (and if rejected, it resets the vulnerability flags). See [secretaryRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/secretaryRoutes.js#L65-L140).
  - In short: this is about confirming claims for barangay programs/assistance—not about account registration.

## Why Both Exist
- They solve two different governance problems:
  - **Verify Documents** = “Is this person’s registration + submitted proof documents legit?”
  - **Validate Beneficiaries** = “Is this resident actually eligible for special assistance categories?”

## Notes About Access
- Verify Documents is allowed to roles `[1,3,4]` (Admin/Secretary/Clerk) in [App.jsx](file:///c:/xampp/htdocs/clearpass/client/src/App.jsx#L505-L515) and has an extra server-side gate `requireVerificationMfa` on the secretary routes.
- Validate Beneficiaries is `[1,3]` (Admin/Secretary) only.

## Plan (Optional cleanup for clarity)
1. Rename the sidebar labels to reduce confusion (more explicit wording).
2. Add a short one-line subtitle at the top of each page explaining purpose (registration docs vs benefit eligibility).
3. Verify routes/roles are consistent with the intended workflow (especially Clerk access).

If you confirm, I’ll implement the label/subtitle changes (no behavior change).