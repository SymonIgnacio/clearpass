I will enhance the **Resident Profile** and **Dashboard** to address the user's feedback about beneficiary status requests and persistent verification messages.

### **1. Resident Profile: "Request for Acknowledgement"**
The user wants to rename "Update Beneficiary Status" to "Request for Acknowledgement" and require proof for *all* claims, not just PWD.

**Changes in `client/src/pages/ResidentProfile.jsx`:**
*   **Rename Button**: Change "Update Beneficiary Status" to "Request for Acknowledgement".
*   **Add File Uploads**:
    *   Introduce a generic `VerificationUploadModal` or file input mechanism for *each* checked status (4Ps, Senior, Solo Parent, etc.).
    *   *Correction*: The user explicitly asked for "document/image upload in every status claim". I will add a file input field *next to or below* each checkbox when it is checked.
*   **Update State**: Add state to hold the selected files for each category (e.g., `beneficiaryFiles: { PWD: file, Senior: file, ... }`).
*   **API Update**:
    *   Modify `handleSaveBeneficiaryStatus` to use `FormData` instead of JSON, so it can send files.
    *   The backend endpoint `/resident-profile/beneficiary-status` currently expects JSON. I will need to update the controller to handle `multipart/form-data`.

**Changes in `server/controllers/residentProfileController.js`:**
*   **Handle File Uploads**: Update `updateBeneficiaryStatus` to process uploaded files and save them to a `beneficiary_documents` table or similar (or reuse `resident_documents` with a specific type).
*   **Status Handling**: Instead of instantly approving the status (updating `vulnerabilities` table directly), this should likely trigger a "Verification Request" that the admin sees.
    *   *Self-Correction*: The user said "this is why i have 'Beneficiary Validation' in my admin/staff side". This implies the Admin side *already* exists to validate these.
    *   If I change the resident side to just "Request", I need to ensure the backend marks these as "Pending Validation" rather than "Active".
    *   *Refinement*: I will check if `vulnerabilities` table has a `status` column or if I should add one. If not, I'll assume the existence of the Admin "Beneficiary Validation" page means there's a workflow I should align with.

### **2. Dashboard: Fix "Pending Verification" Persistence**
The user is verified but sees "Pending".
*   **Root Cause**: The `ResidentDashboard.jsx` checks `profile.Residency_Status`. If the backend update (Role 13 -> 12) worked, the user is now a Resident. But the `profile` object fetched might still say "Pending" if the `residents` table wasn't updated correctly or if the frontend is caching.
*   **Fix**:
    *   I will verify `ResidentDashboard.jsx` uses the *latest* data.
    *   I will ensure the `fetchDashboardData` function correctly interprets the "Active" status from the API.

### **Plan of Action:**
1.  **Modify `ResidentProfile.jsx`**:
    *   Rename button to "Request for Acknowledgement".
    *   Add file input fields for *every* beneficiary checkbox.
    *   Update submit logic to send `FormData`.
2.  **Modify `residentProfileController.js`**:
    *   Update `updateBeneficiaryStatus` to handle file uploads.
    *   Ensure it flags the status as "Pending Verification" (if applicable) so Admins can validate.
3.  **Review `ResidentDashboard.jsx`**:
    *   Ensure it correctly reflects the "Active" status to hide the banner.

**Note:** I will start by modifying the frontend to add the file inputs and rename the button as requested. Then I will handle the backend upload logic.