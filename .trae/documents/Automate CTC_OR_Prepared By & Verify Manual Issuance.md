# Automate CTC/OR/Prepared By & Verify Manual Issuance

I will implement the auto-generation logic for `ctc_no` and `or_no` and set a default for `prepared_by` to handle manual issuance correctly without requiring user input.

## 1. Frontend: Hide & Auto-Fill Placeholders
- **File**: `client/src/pages/DocumentsDashboard.jsx`
- **Action**:
    - Update `standardVars` in `extractPlaceholders` to include `'ctc_no'`, `'or_no'`, and `'prepared_by'`. This ensures they don't appear as manual inputs.
    - Update `handleIssueCertificate` to inject default values into `dynamic_data` before sending the request:
        - `ctc_no`: Generate a random string (e.g., `CTC-YYYY-XXXX`).
        - `or_no`: Generate a random string (e.g., `OR-YYYY-XXXX`).
        - `prepared_by`: Use "Clerk" (as requested for dev mode) or the current user's name if available.

## 2. Test Plan: Verify Manual Issuance
I will perform the following test to confirm the fix:
1.  **User**: Select resident `Symonignacio1@gmail.com` (or search "Symon").
2.  **Template**: Select "Building Permit" (or any template using these vars).
3.  **Check UI**: Confirm `CTC No`, `OR No`, and `Prepared By` fields are **gone**.
4.  **Issue**: Click "Create Certificate".
5.  **Verify**:
    - Check the downloaded document (or API response) to ensure `ctc_no`, `or_no`, and `prepared_by` are populated with the auto-generated values.

## 3. Backend (Optional Safety Net)
- The backend `documentController.js` already has fallback defaults, but sending explicit values from the frontend ensures consistency with the "auto-generated" requirement.

I will proceed with the frontend changes first.