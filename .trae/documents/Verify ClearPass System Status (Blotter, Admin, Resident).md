I have identified a likely cause for the error when filing a complaint: **Missing Database Fields in the Resident Complaint Controller**.

The `blotterComplaintController.js` (Resident side) is using an **outdated `INSERT` statement** that fails to save the `complainant_resident_id`. The main `blotterController.js` (Admin side) was updated to include this, but the resident-facing one was missed. This likely causes a database error (due to missing foreign keys or constraints) or data linkage issues.

**Plan to Fix:**

1.  **Diagnose & Reproduce**:
    *   Create a reproduction script `reproduce_complaint_error.js` to attempt filing a complaint as a resident.
    *   Run it to confirm the exact error (expecting a database constraint or column mismatch error).

2.  **Apply Fix**:
    *   Update `server/controllers/blotterComplaintController.js` to:
        *   Include `complainant_resident_id` in the `INSERT INTO blotter` statement.
        *   Ensure `respondent_resident_id` is also handled if applicable.

3.  **Verify**:
    *   Run the reproduction script again to confirm the complaint is filed successfully.
    *   Run `npm run dev:all` to ensure the system starts up correctly with the changes.

This fix ensures resident complaints are correctly linked to their profiles, matching the system's recent architecture updates.
