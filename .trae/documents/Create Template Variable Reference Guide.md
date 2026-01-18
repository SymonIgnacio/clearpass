I have updated the logic for `{prepared_by}`.

### **Refined Logic for `{prepared_by}`**
Instead of just a generic title, the `{prepared_by}` variable will now automatically populate with the **Name of the Staff/Officer** who clicked the "Approve" button in the system.

*   **Logic**: When a document is approved, the system captures the `user_id` of the approver.
*   **Mapping**: In `DocumentController.js`, I will fetch the full name (First + Last) of that user and assign it to `{prepared_by}`.

### **Final Plan**
1.  **Update `DocumentController.js`**:
    *   Modify `downloadDocument` query to join the `users` table and fetch the `approved_by` user's name.
    *   Map this name to the `{prepared_by}` variable.
2.  **Create `TEMPLATE_VARIABLES.md`**: Generate the complete guide including this new logic.

Shall I proceed with implementing this logic?