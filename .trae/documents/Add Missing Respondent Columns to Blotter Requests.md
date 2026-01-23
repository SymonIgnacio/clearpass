I will fix the "Unknown column 'respondent_alias'" error by creating a database migration to add the missing columns to the `blotter_requests` table.

### **Plan**

1.  **Create Migration File**:
    *   Create a new migration file named `YYYYMMDDHHMMSS_add_respondent_fields_to_blotter_requests.js`.
    *   Add `respondent_alias` (VARCHAR 255, nullable).
    *   Add `respondent_address` (TEXT, nullable).
    *   Add `respondent_contact` (VARCHAR 50, nullable).
2.  **Run Migration**:
    *   Execute `npm run db:migrate` to apply the changes to the database.
3.  **Verify**:
    *   The `submitRequest` endpoint in `blotterRequestController.js` will now work as the columns will exist in the database.

### **Why this works**
The error occurs because the controller is trying to insert data into columns that don't exist in the table. Adding these columns aligns the database schema with the application logic.

**Note:** I will use the current timestamp for the migration filename.