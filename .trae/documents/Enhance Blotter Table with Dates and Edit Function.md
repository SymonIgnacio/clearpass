I will modify the Blotter page to show two date columns and add an edit functionality.

### **1. Modify Frontend (`client/src/pages/Blotter.jsx`)**
-   **Table Columns**:
    -   Rename "Date" to "Incident Date".
    -   Add a new column "Date Filed" displaying the `created_at` timestamp.
-   **Edit Functionality**:
    -   Add an `isEditing` state variable.
    -   Create a `handleEdit` function that:
        -   Parses the existing case data (handling the JSON strings for details).
        -   Populates the `wizardData` state.
        -   Sets `isEditing` to true and opens the dialog.
    -   Create a `handleUpdateCase` function to send a `PUT` request to the existing update endpoint.
    -   Update the "File a Complaint" dialog to support both "Create" and "Edit" modes (dynamic title and submit button).
    -   Add an "Edit" button to the Actions column in the table.

### **2. Verification**
-   I will verify that the table shows both "Date Filed" and "Incident Date".
-   I will verify that clicking "Edit" opens the dialog with pre-filled data and saving changes updates the record.
