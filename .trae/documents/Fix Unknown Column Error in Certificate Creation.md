# Remove "fee_amount" from Certificate Creation Logic

The user has clarified that all fee-related logic has been completely removed from the system. The current error is occurring because the backend code in `certificateController.js` still tries to insert a value into the `fee_amount` column, which no longer exists in the database.

I will remove this legacy reference to ensure the certificate issuance works correctly.

## 1. Audit Report: Legacy Code Detected
- **Issue**: `certificateController.js` contains a legacy SQL column reference `fee_amount` in the `INSERT` statement.
- **Confirmation**: User confirmed that fees are "completely removed from the system," so this code is outdated and incorrect.

## 2. Implementation Plan
- **File**: `server/controllers/certificateController.js`
- **Action**:
    - Update the `create` function's SQL query.
    - Remove `fee_amount` from the `INSERT INTO certificates_log (...)` column list.
    - Remove the corresponding `0` (hardcoded value) from the `VALUES (...)` list.

## 3. Verification
- I will verify that the SQL statement no longer references `fee_amount`.
- This will resolve the `ER_BAD_FIELD_ERROR` and allow the manual issuance to proceed.
