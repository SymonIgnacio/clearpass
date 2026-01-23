I have identified a critical bug in the backend controller that causes data corruption when saving investigation progress, which subsequently breaks the approval workflow.

### The Issue
In `server/controllers/blotterRequestController.js`, the `updateInvestigation` method constructs the SQL query and parameters incorrectly.
- **Current Logic**: It appends fields to the `UPDATE` clause (order: A, B, C) but prepends values to the parameters array (order: C, B, A).
- **Consequence**: When you save the investigation, the `investigation_checklist` and `investigation_findings` values get swapped in the database.
- **Symptoms**:
  - "Save Progress" appears to work but corrupts the data.
  - The "Approve Request" button remains disabled because the checklist data is invalid (it contains the findings text instead of the JSON checklist), causing the `canApprove()` check to fail.

### The Fix
I will refactor the `updateInvestigation` method in `server/controllers/blotterRequestController.js` to ensure that the SQL parameters are added in the exact same order as their corresponding fields in the SQL query.

### Steps
1.  Modify `server/controllers/blotterRequestController.js`.
2.  Rewrite the parameter construction logic in `updateInvestigation` to use a consistent order (pushing values instead of unshifting) and append the `id` at the end.
3.  Verify that no other methods share this flawed pattern.

This fix will restore the functionality of the "Save Progress" button and correctly enable the "Approve Request" button once the investigation is complete.