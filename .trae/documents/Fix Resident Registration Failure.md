I will address the registration failure by fixing a critical database schema issue and improving input validation.

### Root Cause Analysis
1.  **Critical Schema Mismatch (`Household_ID`)**:
    *   **The Issue**: The `residents` table defines `Household_ID` as `NOT NULL`, but the registration form (for new users) does not collect this field. The server defaults it to `null`, which causes the database insertion to fail.
    *   **Why it fails**: `INSERT INTO residents (..., Household_ID) VALUES (..., NULL)` throws a `Column 'Household_ID' cannot be null` error.
    *   **Why 400?**: While this typically causes a 500 error, it is the most significant blocking issue. The 400 Bad Request might be masking this or caused by a separate validation failure.

2.  **Missing Validation**:
    *   The server validation check misses `gender` and `civil_status`. If these are missing from the request (e.g., direct API call or browser issue), the `NOT NULL` constraint in the database will also cause a failure.

### Implementation Plan

1.  **Database Migration**:
    *   Create a new migration file `server/migrations/20260128000000_make_household_id_nullable.js` to change the `Household_ID` column in the `residents` table to be `nullable`. This allows new residents to register without being immediately assigned to a household.

2.  **Server-Side Logic Update (`residentAuthRoutes.js`)**:
    *   Update the `/register` endpoint validation to include `gender` and `civil_status`.
    *   Set a default value for `civil_status` (e.g., 'Single') if it's missing, to prevent `NULL` insertion errors.
    *   Improve error logging to capture the exact cause of any future 400/500 errors.

3.  **Verification**:
    *   Run the migration.
    *   Attempt registration again (simulated or by user) to verify the fix.
