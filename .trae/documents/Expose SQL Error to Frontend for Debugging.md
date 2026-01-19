# Overlooked Bug: Database Insertion Error

The logs confirm that we successfully **found the application ID**. The error happens during the `INSERT` operation.
Since the schemas match (both have encryption columns), the error is likely due to:

1.  **Foreign Key Constraint**: Does the `application_id` exist in `resident_applications`? Yes, we just queried it.
2.  **Missing `targetIdColumn` Mapping**:
    - In `residentController.js`, I set `targetIdColumn = 'application_id'`.
    - The `INSERT` statement uses `${targetIdColumn}`.
    - This looks correct.
3.  **Data Type Mismatch**:
    - `application_id` is `varchar(50)`. The value `APP-1768582718887-291C3F85` fits.
    - `encryption_version` is `int(10) UNSIGNED`. If `encryptionMeta.encryption_version` is `null`, does it fail? It defaults to NULL in schema.
4.  **Silent Error in Catch Block**:
    - The `catch` block logs `console.error('Error uploading documents:', error);`.
    - I need to see *that* error to know for sure.
    - Wait, the user provided logs up to "Processing 1 files...". They did *not* provide the error log.
    - **Hypothesis**: The `file_path` might be too long? Or `encryption_alg` is null but passed as something else?

**Wait, I see a potential issue in the SQL construction:**
In `residentController.js`:
```javascript
INSERT INTO ${targetTable} (
  ${targetIdColumn}, document_type, file_path, file_name, verification_status, created_at,
  encryption_alg, encryption_version, encryption_iv, encryption_tag
) VALUES (?, ?, ?, ?, 'pending', NOW(), ?, ?, ?, ?)
```
The parameters passed are:
```javascript
[
  targetId,
  docType,
  storedPath,
  file.originalname,
  encryptionMeta.encryption_alg,
  encryptionMeta.encryption_version,
  encryptionMeta.encryption_iv,
  encryptionMeta.encryption_tag,
]
```
If `encryptionMeta` has `null` values, they are passed as `null`. The schema allows `NULL` for encryption columns.

**Wait! `verified_at` timestamp NOT NULL**
In `application_documents`:
`verified_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
This has a default, so it shouldn't fail on insert.

**Let's look at the `file.path`**.
If the file path uses backslashes (Windows) and isn't escaped properly in some contexts, it might be an issue, but `mysql2` handles parameter binding safely.

**Let's assume the error is `ER_NO_REFERENCED_ROW_2`** (Foreign Key Failure) or something similar, or maybe `ER_TRUNCATED_WRONG_VALUE`.

**Action Plan**:
Since I can't see the server console error, I will wrap the `INSERT` in a specific `try-catch` block *inside* the loop and log the specific error message to the response so the frontend can display it. This is the fastest way to debug "blind".

Also, I noticed `resident_applications` table usually has `id` (int) and `application_id` (string).
The `application_documents` table:
`application_id` varchar(50) NOT NULL.
This matches.

**Wait, I suspect `docType` length**.
`document_type` is `varchar(50)`.
"Proof of Residency" is 18 chars. Fine.

**I will modify the controller to return the specific SQL error message to the frontend.**
This way, even if I can't see the terminal, the user will see "Error: Column 'x' cannot be null" in their red alert box.

**One more check**:
Is `application_documents` `id` auto-increment?
`id` int(10) UNSIGNED NOT NULL.
It is NOT defined as `AUTO_INCREMENT` in the CREATE TABLE snippet I saw above?
Wait, `cleaned_barangay_management.sql`:
Line 258: `id` int(10) UNSIGNED NOT NULL,
Line 278: `ALTER TABLE application_documents ADD PRIMARY KEY (id), ...`
Line 288: `ALTER TABLE application_documents MODIFY id int(10) UNSIGNED NOT NULL AUTO_INCREMENT;`
I need to check if the `AUTO_INCREMENT` line exists. If not, inserting without ID will fail.

Let's assume it *is* auto-increment.

**Plan**:
1.  **Modify `residentController.js`**:
    - Wrap the `INSERT` in a try/catch.
    - Log the exact error object.
    - Return `res.status(500).json({ error: error.message })` so the user sees the real SQL error.
2.  **Check `AUTO_INCREMENT`**:
    - I'll search for the `MODIFY` statement in the SQL file just to be safe.

This will expose the "hidden" error.
