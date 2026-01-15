# Fix ClearPass Issues

I will resolve the reported issues by refactoring the complaint filing process, fixing the data serialization bug, and correcting the status update logic.

## 1. Simplify Complaint Filing (Frontend)
- **Refactor `Blotter.jsx`**:
    - Remove the 3-step Wizard/Stepper.
    - Convert the "File a Complaint" modal into a single-page form.
    - Remove the informational "Summons" and "Resolution" steps.
    - Change the submission flow to submit directly from the intake form.

## 2. Fix "N/A" Name & JSON in PDF (Data Handling)
The "N/A" names and raw JSON in PDFs are caused by **double-stringification** of data (Frontend stringifies -> Backend stringifies again).

- **Frontend (`Blotter.jsx`)**:
    - Update `handleWizardSubmit` to send `Complainant_Details` and `Respondent_Details` as **Objects**, not JSON strings.
    - Improve the list rendering logic to robustly handle both single and double-stringified data (to fix display for existing records).
- **Backend (`blotterController.js`)**:
    - Ensure `create` and `update` methods correctly handle the input data types.
- **Backend (`reportController.js`)**:
    - Update `generateBlotterPDF` to recursively parse `Complainant_Details` and `Respondent_Details` to handle existing double-encoded records and display the correct names in the PDF.

## 3. Fix Status "-" Issue
- **Backend (`blotterController.js`)**:
    - In the `update` method, ensure the SQL column name matches the database schema exactly (`Status` instead of `status`).
    - Verify that the status update from "Issue Summons" is correctly applied.

## 4. Verification
- Verify that filing a new complaint saves the name correctly (no "N/A").
- Verify that "Issue Summons" updates the status to "Scheduled for Mediation" (not "-").
- Verify that the PDF export shows clean names (e.g., "Christian...") instead of JSON strings.
