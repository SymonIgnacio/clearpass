I have identified the two issues you reported and have a plan to fix them.

### **Issue 1: Can't see the uploaded file name in the UI**
*   **Problem**: In `ResidentDashboard.jsx`, the file input is hidden, and while there is code to display the file name, it might be visually obscured or not updating correctly in the React state.
*   **Fix**: I will update the UI in `ResidentDashboard.jsx` to explicitly show the selected file name in a visible `Typography` or `Chip` component immediately after selection. I will also ensure the file name persists in the state.

### **Issue 2: Re-uploaded applications not showing in "Registration Applications"**
*   **Problem**: When a resident re-uploads a document after rejection, the system is likely uploading the file to a *separate* table (`resident_documents` or similar) but **not** updating the status of the main application record in `resident_applications` from `rejected` back to `pending`.
*   **Root Cause**: The `uploadVerification` function likely just uploads a file. It needs to also trigger a status update on the application itself so it reappears in the staff's "Pending" list.
*   **Fix**:
    1.  **Frontend**: Modify `handleUploadVerification` in `ResidentDashboard.jsx` to not just upload the file but also call an endpoint to update the application status to `pending`.
    2.  **Backend**: Ensure the file upload endpoint or a new companion endpoint updates the `resident_applications` table status to `pending` when a new proof of residency is uploaded for a rejected user.

### **Plan of Action**
1.  **Frontend UI Fix**: Modify `ResidentDashboard.jsx` to display the `verificationFile.name` clearly.
2.  **Frontend Logic Fix**: Update `handleUploadVerification` to ensure it triggers the application status update.
3.  **Backend Logic Fix**: Verify/Update `residentAuthRoutes.js` (or the upload controller) to ensure that uploading a new "Proof of Residency" automatically moves a `rejected` application back to `pending`.
