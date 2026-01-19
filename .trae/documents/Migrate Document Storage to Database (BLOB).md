# Switch to Database (BLOB) Storage

You want to store the actual file content inside the database (`LONGBLOB`) instead of saving it to a local folder. This is possible but requires significant changes.

## 1. Database Schema Changes
- **Current**: `file_path` (VARCHAR) -> Stores the path `uploads/doc.jpg`.
- **New**: `file_data` (LONGBLOB) -> Will store the binary data of the file (up to 4GB).
- I need to modify both `application_documents` and `resident_documents` tables to add this column and make `file_path` optional (or remove it).

## 2. Middleware Changes (`server/middleware/upload.js`)
- **Current**: `multer.diskStorage` -> Saves to disk immediately.
- **New**: `multer.memoryStorage` -> Keeps the file in RAM (`req.file.buffer`) so we can insert it into the DB.

## 3. Controller Changes (`server/controllers/residentController.js`)
- **Current**: Reads `req.file.path`.
- **New**: Will read `req.file.buffer`.
- **Logic**: Instead of saving the path, it will `INSERT` the buffer directly into the `file_data` column.
- **Encryption**: If encryption is enabled, I will encrypt the buffer in memory before inserting it.

## 4. Download Logic Changes
- **Current**: Streams file from disk.
- **New**: Will query the `file_data` BLOB from DB and send it as a response stream.

## Plan Execution
1.  **Migration**: Create a new migration to add `file_data` (LONGBLOB) to `application_documents` and `resident_documents`.
2.  **Middleware**: Modify `upload.js` to use `memoryStorage`.
3.  **Controller**: Update `uploadVerificationDocs` to save the buffer to DB.
4.  **Download**: Update `downloadDocument` to serve from DB.

**Warning**: Storing large files in MySQL can increase database size significantly and might impact backup/restore times. But it simplifies backup management (everything in one place).

I will proceed with this migration.
