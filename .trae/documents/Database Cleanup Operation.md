I will proceed with the cleanup of `database/barangay_management (5).sql` as requested, skipping the restoration/import verification step.

# Revised Database Cleanup Plan

## 1. Execution Steps
1.  **Create Script**: Write `scripts/cleanup_database_dump.js` to process the SQL dump.
2.  **Process File**:
    -   Read `database/barangay_management (5).sql`.
    -   **Retain**: Schema (`CREATE TABLE`) and System Data (`users`, `roles`, `settings`, etc.).
    -   **Purge**: Resident & Operational Data (`residents`, `blotter`, `cases`, etc.).
    -   Wrap operations in `SET FOREIGN_KEY_CHECKS` to ensure consistency.
3.  **Generate Output**: Create `database/cleaned_barangay_management.sql`.

## 2. Verification
-   I will verify the output file size and structure to confirm that User data is present and Resident data is removed.

Ready to execute.