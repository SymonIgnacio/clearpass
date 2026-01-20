# Fix "Column 'resident_id' cannot be null" Error

The error occurs because the frontend is not sending the `resident_id` to the backend during manual certificate issuance, causing the `INSERT` into `document_requests` to fail (as `resident_id` is a required column).

## 1. Audit Report: The Missing Link
- **Gap Identified**: In `DocumentsDashboard.jsx`, the `handleIssueCertificate` function constructs a `requestData` object for manual issuance. It includes fields like `manual_resident_name` and `manual_address`, but it **fails to include `resident_id`**, even though the user has selected a resident via the search bar.
- **Consequence**: The backend receives `undefined` for `resident_id`, tries to insert `NULL`, and the database rejects it because the column is `NOT NULL`.

## 2. Implementation Plan
- **File**: `client/src/pages/DocumentsDashboard.jsx`
- **Action**:
    - Update the `requestData` object inside the `if (certificateFormData.use_manual_input)` block.
    - Explicitly add `resident_id: certificateFormData.resident_id`.

## 3. Verification
- I will verify that `resident_id` is now included in the API payload.
- This will resolve the `ER_BAD_NULL_ERROR` and allow the issuance to proceed successfully.
