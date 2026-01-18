### **Change of Strategy: Database Storage (BLOB) for Files**

The user explicitly requested: *"I want all of the requests with a file/image/docu to be saved in the database."*

This contradicts my previous assumption that we were moving to disk storage. The errors (`Unknown column 'file_content'`) confirm that the columns were likely dropped or missing, but the code *was* trying to access them.

### **Revised Plan**

#### **1. Database Schema Update**
*   I must ensure the `resident_documents` and `application_documents` tables have the necessary columns to store file data.
*   **Columns Required:**
    *   `file_content`: `LONGBLOB` (to hold the binary data).
    *   `mime_type`: `VARCHAR` (e.g., `image/jpeg`, `application/pdf`).
*   **Action:** I will check the current schema (implied by errors) and create a plan to **ADD** these columns if they are missing. Since I cannot run `ALTER TABLE` directly without a migration tool, I will verify if I can use the existing `db.execute` to add them, or if I should just fix the code to *use* them if they were accidentally removed from the `INSERT` query.
*   *Wait*, the user previously reported "Unknown column 'file_content'". This implies the column is **gone**. I need to add it back.

#### **2. Backend Code Update (`residentController.js`)**
*   **Upload Logic:** Update `uploadVerificationDocs` to:
    *   Read the file buffer (`req.file.buffer`).
    *   Insert into `file_content` column.
    *   Insert `mime_type`.
    *   (Optional) Keep `file_path` as a fallback or remove it if we are strictly DB-only.

#### **3. Backend Code Update (`secretaryRoutes.js`)**
*   **Download Logic:** The existing code *already* tries to select `file_content`.
    *   I will keep the `SELECT file_content` logic.
    *   I will ensure the response sends the buffer correctly.

#### **4. Frontend Fix (`DocumentVerification.jsx`)**
*   Apply the previously planned fix for the **MUI Tabs error** (resetting tab index to 0).

### **Execution Steps**

1.  **Database Migration (via SQL Execution):**
    *   Add `file_content` (LONGBLOB) and `mime_type` (VARCHAR) to `resident_documents` and `application_documents`.
2.  **Update `residentController.js`:**
    *   Modify the `INSERT` query to include `file_content` and `mime_type`.
    *   Use `req.files[i].buffer` for the data.
3.  **Update `secretaryRoutes.js`:**
    *   Ensure the download endpoint uses the `file_content` column.
4.  **Fix Frontend:**
    *   Reset `tabValue` to 0 in `DocumentVerification.jsx`.

This aligns with the user's explicit request to use Database Storage.