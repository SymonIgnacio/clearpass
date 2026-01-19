I will fix the UI locking issue and ensure correct beneficiary status display.

### **Requirements Analysis**
1.  **UI Locking**: The user wants the beneficiary checkboxes/section to be **locked out (disabled)** for groups they have *already requested* or claimed, even after refreshing the page.
2.  **Selective Locking**: "dont lock the groups that i didnt request". Only the requested groups should be disabled.
3.  **Spam Prevention**: The `submitLock` logic I added previously needs to be corrected to properly reset, ensuring the button isn't permanently dead for *valid* subsequent actions (like requesting a different group later).

### **Plan**

1.  **Backend Update (`residentProfileController.js`)**:
    *   Update the `getProfile` query (lines 66-74) to include the `validation_status` from the `vulnerabilities` table. This status ('pending', 'approved', 'rejected') is crucial for the frontend to know which groups are "under review" or "confirmed".

2.  **Frontend Update (`ResidentProfile.jsx`)**:
    *   **Fetch Logic**: Update `fetchProfile` to read the `validation_status` from the API response.
    *   **State Management**: Store `validation_status` in the component state.
    *   **Conditional Rendering**:
        *   Disable the checkboxes/file inputs for any group where `Is_[Group]` is true AND `validation_status` is 'pending' or 'approved'.
        *   Keep unrequested groups enabled.
    *   **Submit Lock Fix**: Correct the `handleSaveBeneficiaryStatus` function to properly reset `submitLock.current = false` in the `finally` block (fixing the previous incomplete edit).

This approach ensures that once a user requests a group (e.g., PWD), it shows as checked and disabled (locked) on reload because the backend reports it as 'pending', while other groups (e.g., Solo Parent) remain available for future requests.