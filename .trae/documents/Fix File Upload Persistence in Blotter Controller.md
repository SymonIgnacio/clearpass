I have refined the plan to strictly follow the **DRY (Don't Repeat Yourself)** principle and ensure robust file handling, addressing the concern about coding standards.

### 1. Create Helper Method for File Saving
**File:** `server/controllers/blotterRequestController.js`
- **Action:** Add a private method `_saveEvidenceFiles(files)` to the `BlotterRequestController` class.
- **Logic:**
    - Checks if files exist.
    - Ensures the `server/uploads` directory exists.
    - Iterates through the files, writes them to disk using `fs.writeFileSync` (since they are in memory buffers).
    - Returns an array of file metadata objects (filename, mimetype, size) ready for database insertion.
- **Benefit:** Centralizes file saving logic, preventing inconsistency and ensuring all uploads are actually persisted to disk.

### 2. Refactor Controller Methods to Use Helper
**File:** `server/controllers/blotterRequestController.js`
- **Action:** Update the following methods to use `this._saveEvidenceFiles(req.files)`:
    - `submitRequest`: Fixes the original 404 issue for new requests.
    - `addValidationNote`: Fixes missing evidence in validation notes.
    - `respondInfo`: Refactors existing working code to use the shared helper.
    - `submitAppeal`: Fixes potential missing evidence in appeals and ensures it uses `req.files` correctly.

### 3. Verification
- **Test:** After applying these changes, I will ask you to create a new blotter request with an attachment. You should be able to view the uploaded file immediately without any 404 errors.
