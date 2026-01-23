I have identified the issue causing the 500 Internal Server Error when updating the resident profile.

**Problem Analysis:**
1.  **Empty String Data Type Mismatch:** The frontend sends empty strings (`""`) for fields like `Income_Estimate` (which is a `DECIMAL` in the database) and `Civil_Status` (which is an `ENUM`).
    - MySQL fails when trying to insert an empty string into a `DECIMAL` column or an `ENUM` column (if not a valid enum value), causing the 500 error.
2.  **Missing Email Update in Residents Table:** The `updateProfile` method currently updates `Mobile_Number` but fails to update the `Email` column in the `residents` table, even though `getProfile` retrieves it. This leads to data inconsistency.

**Proposed Plan:**
1.  **Sanitize Input Data:** Modify `server/controllers/residentProfileController.js` to convert empty strings (`""`) to `null` for optional fields:
    - `Income_Estimate`
    - `Civil_Status`
    - `Occupation`
    - `Mobile_Number`
    - `email`
2.  **Update Database Query:**
    - Update the SQL query in `updateProfile` to include the `Email` column in the `residents` table update.
    - Ensure both `residents` and `users` tables are updated correctly with the sanitized data.

**Verification:**
- I will verifying the changes by ensuring the code handles empty inputs correctly and constructs the proper SQL query.
- Since I cannot run the server or database directly to reproduce, I will rely on code correctness and handling of edge cases.
