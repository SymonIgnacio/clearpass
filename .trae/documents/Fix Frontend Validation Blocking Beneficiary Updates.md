I have identified the issue. While I updated the backend validation, the **frontend validation** in `client/src/pages/ResidentProfile.jsx` is still enforcing file requirements for all checked boxes, regardless of whether they are locked (already approved).

To fix this, I will modify the `handleSaveBeneficiaryStatus` function in `ResidentProfile.jsx` to **skip file validation** for any field that is locked.

The logic will be updated as follows:
-   Before showing an error for missing files, check `!isLocked('FieldName')`.
-   This ensures that if a field like "PWD" is already approved (and thus locked), the form submission won't be blocked by the missing upload.

This will allow you to submit the form for your new "Senior Citizen" application without being asked to re-upload proofs for your existing "PWD" status.
