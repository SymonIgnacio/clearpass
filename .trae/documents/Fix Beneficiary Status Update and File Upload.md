I will fix the beneficiary status update error and implement database storage for uploaded files as requested.

### **Implementation Plan**

1.  **Enable File Upload Handling (`residentProfileRoutes.js`)**:
    *   Import the existing `server/middleware/upload.js` (which uses **Memory Storage**).
    *   Apply the middleware to the `PUT /beneficiary-status` route using `upload.fields(...)`. This ensures `req.body` is parsed correctly (fixing the "undefined" error) and files are available in `req.files`.

2.  **Update Controller Logic (`residentProfileController.js`)**:
    *   **Fix Parameter Error**: Modify the `UPDATE vulnerabilities` query to explicitly handle `Disability_Type` when it is undefined (defaulting to `null`).
    *   **Implement Database Storage**: Update the `uploadDocument` helper function to:
        *   Access the file buffer from `file.buffer` (instead of `file.path`).
        *   Insert the file content into the `file_data` BLOB column of the `resident_documents` table.
        *   Store the file's MIME type in the `mime_type` column.
        *   Use a placeholder (or the original filename) for the required `file_path` column since the file is stored in the DB.

This approach resolves the 500 error by correctly parsing the request body and satisfies the requirement to store files directly in the database.