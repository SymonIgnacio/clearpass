I have identified the issue: The backend strictly validates file requirements for all selected beneficiary categories, even if they were previously approved. Since the frontend locks these fields and prevents re-uploading files for approved statuses, the validation fails when a user tries to add a new category (e.g., adding "Senior Citizen" while already being an approved "PWD").

To fix this, I will implement the following changes:

1.  **Backend (`server/controllers/residentProfileController.js`)**:
    *   Fetch the current vulnerability status of the resident before validation.
    *   Modify the validation logic to **skip file checks** for categories that are already marked as `true` in the database (implying they are already approved/verified).
    *   Update the database update logic to **preserve existing flags**. Instead of overwriting all flags with the request data, it will merge the new request data with the existing approved statuses. This ensures that approved statuses remain active even if the frontend sends incomplete data for locked fields.

2.  **Frontend (`client/src/pages/ResidentProfile.jsx`)**:
    *   No changes are strictly required on the frontend if the backend handles the merging correctly, but I will review the `handleSaveBeneficiaryStatus` function to ensure it sends the correct state for locked fields to avoid any ambiguity. *Correction: I will focus on the backend fix first as it's the root cause of the validation rejection.*

This approach ensures that users can incrementally add new beneficiary statuses without being forced to re-upload documents for already approved claims.
