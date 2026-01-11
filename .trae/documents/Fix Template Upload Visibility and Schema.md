I will resolve the missing "Upload Template" functionality by fixing the frontend permission check and ensuring the database schema supports file uploads.

### **Planned Changes**

1.  **Fix Frontend Visibility (DocumentsDashboard.jsx)**
    *   Update the `canManage` check to robustly handle role types (string vs number) by casting `user.role` to a number.
    *   This ensures the "Upload File" button becomes visible for the IT Admin (Role ID 1).

2.  **Fix Database Schema (New Migration)**
    *   Create a new migration file `server/migrations/20250113000000_add_file_columns_to_templates.js`.
    *   Add the missing columns required by the backend code (`file_data` LONGBLOB, `file_encoding` VARCHAR, `certificate_type_id` INT) to the `document_templates` table.
    *   Run `npm run db:migrate` to apply the changes.

### **Verification**
*   **Frontend**: Confirm the "Upload File" button appears in the "Document Templates" tab for the Admin.
*   **Backend**: Verify that uploading a template file succeeds and the data is stored in the database without errors.