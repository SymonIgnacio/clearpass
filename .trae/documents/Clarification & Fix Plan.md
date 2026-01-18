I will proceed with the following updates, including your request to see rejection reasons:

### 1. Fix Console Errors & UI (`ResidentDashboard.jsx`)
-   **Action:** Refactor component structure to resolve `validateDOMNesting` warnings.
-   **Action:** Ensure the **selected filename** is clearly displayed in the upload modal.

### 2. Document Visibility for You
-   **Action:** Add a **"Your Uploaded Documents"** section to your dashboard so you can verify what has been sent.

### 3. "Edit & Re-Submit" Application Flow
-   **Display Rejection Reason:** Update the dashboard to clearly show **why** the application was rejected (e.g., in a red Alert box) when the status is "Rejected".
-   **Backend:** Create a new endpoint `PUT /api/resident-auth/reapply` to allow updating details and resetting status to "Pending".
-   **Frontend:** Add an **"Edit Application"** button for rejected users to fix and resubmit their form.

### 4. Admin View Verification
-   **Action:** Verify that documents uploaded by you appear correctly in the Admin's "Registration Applications" view.

I will start by fixing the dashboard UI and implementing the rejection display.