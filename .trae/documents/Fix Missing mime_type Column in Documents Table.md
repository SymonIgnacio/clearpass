# Fix Beneficiary Status Locking and Upload Error

## Problem Analysis
1.  **UI Locking Issue (User Reported):** The `isLocked` function in `ResidentProfile.jsx` incorrectly locks the checkbox immediately after selection because it checks the *current* state (`beneficiaryData`) against the `validationStatus`. If a user has any pending/approved status, checking a *new* box triggers the lock, preventing file upload.
2.  **Backend Error (Discovered):** The `resident_documents` table is missing the `mime_type` column, which will cause the file upload to fail with a SQL error even after the UI is fixed.

## Implementation Plan

### 1. Fix UI Locking Logic
Modify `client/src/pages/ResidentProfile.jsx` to ensure fields are locked only if they were **previously submitted** (exist in the fetched `profile` data), not just currently selected.

**Change in `isLocked` function:**
```javascript
const isLocked = (field) => {
  // Only lock if the field was originally true in the fetched profile
  // AND the status is pending/approved.
  const isOriginallySubmitted = profile && profile[field];
  return isOriginallySubmitted && (validationStatus === 'pending' || validationStatus === 'approved');
};
```

### 2. Update Database Schema
Create a migration to add the missing `mime_type` column to the documents tables.

**Migration File:** `server/migrations/20260121000000_add_mimetype_to_documents.js`
- **Up:** Add `mime_type` column to `resident_documents` and `application_documents`.
- **Down:** Remove the column.

### 3. Apply Migration
Run `npm run db:migrate` in the server directory.

## Verification
1.  **UI Test:** Confirm that checking a new beneficiary box (e.g., PWD) does *not* disable it immediately, allowing file upload.
2.  **Functional Test:** Submit the request and verify it succeeds without backend errors.
