I will implement database storage for uploaded documents as requested.

### 1. Database Schema Update
- Create a migration to add a `file_content` column (LONGBLOB) and `mime_type` column to both `resident_documents` and `application_documents` tables.

### 2. Middleware Update
- Modify `server/middleware/upload.js` to use `multer.memoryStorage()` instead of `diskStorage`. This allows access to the file buffer in the controller.

### 3. Controller Update (Upload)
- Update `server/controllers/residentController.js` (`uploadVerificationDocs`):
    - Access `req.file.buffer`.
    - Insert the buffer into the `file_content` column.
    - Store the MIME type.
    - Retain `file_path` logic (maybe setting it to a dummy value or `db-stored`) to maintain compatibility with other parts of the system that might check for its existence, although the primary source will be the DB.

### 4. Controller/Route Update (Download/View)
- Update `server/routes/secretaryRoutes.js`:
    - Modify the `applications/:id/documents/:docId/download` endpoint.
    - Modify the `documents/:id/download` endpoint.
    - Instead of calling `sendStoredDocument` (which reads from disk), query the `file_content` and `mime_type` from the database.
    - Send the buffer directly using `res.send()`.

This ensures all new uploads are stored directly in the database and retrieved from there. Existing files on disk will remain but might become inaccessible via the new DB-only download route unless I implement a fallback (which I will do: check DB content first, if null, fall back to disk).