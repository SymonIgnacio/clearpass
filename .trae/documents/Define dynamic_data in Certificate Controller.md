# Fix ReferenceError in Certificate Controller

The error `ReferenceError: dynamic_data is not defined` occurs because `dynamic_data` is used in the `create` function's logic but was never extracted from the request body.

I will fix this by adding `dynamic_data` to the destructuring assignment at the beginning of the function.

## 1. Audit Report: Variable Scope Issue
- **Issue**: `dynamic_data` is referenced in the `INSERT` statement for `document_requests` (around line 64) but is missing from the variable declaration at the top of the function.
- **Cause**: In previous turns, we updated the logic to *use* `dynamic_data` but missed adding it to the `const { ... } = req.body` block.

## 2. Implementation Plan
- **File**: `server/controllers/certificateController.js`
- **Action**:
    - Locate the `create` function.
    - Update the destructuring of `req.body` to include `dynamic_data`.

## 3. Verification
- I will verify that `dynamic_data` is now properly defined.
- This will allow the manual issuance process to complete successfully, as the backend will be able to access the auto-generated values sent from the frontend.
