I will fix the document template upload issue by addressing potential database schema gaps and improving the file handling logic.

**Analysis of the Issue:**
1.  **Database Schema Inconsistency:** The migration logic had a flaw where it might have failed to add `original_filename`, `file_type`, and `file_size` columns to existing tables. While the current `INSERT` query doesn't use them, their absence prevents us from storing critical file metadata.
2.  **File Download Bug:** Currently, the download endpoint uses `template_name` as the filename. If the user names the template "Indigency" (without extension), the downloaded file will lack an extension (e.g., `.docx`), making it difficult for users to open.
3.  **Missing Data:** The current upload logic discards the original filename and file size, which are needed for proper file management.

**Plan:**
1.  **Verify & Fix Database Schema:**
    *   Check if `document_templates` table has the required file columns.
    *   Create/Run a migration to ensure `original_filename`, `file_type`, `file_size`, `file_data`, and `file_encoding` all exist and are of the correct type (`LONGBLOB` for data).

2.  **Update Backend Logic (`templateRoutes.js`):**
    *   Update the `POST /upload` endpoint to insert `original_filename`, `file_size`, and `file_type`.
    *   Update the `GET /:id/download` endpoint to use `original_filename` (or ensure the correct extension is appended) so files are downloadable with the correct format.
    *   Improve error logging to catch and display specific database errors (like packet size limits).

3.  **Frontend Validation:**
    *   Ensure the frontend handles the response correctly (already looks good, but I will verify).

This approach fixes the immediate upload failure (by ensuring schema compatibility) and prevents future issues with downloading/opening the files.