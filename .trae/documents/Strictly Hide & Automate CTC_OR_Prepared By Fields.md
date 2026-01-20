# Automate CTC/OR/Prepared By Fields & Create End-to-End Test

I will completely automate the generation of `ctc_no`, `or_no`, and `prepared_by` so they never appear as manual inputs, even for templates like "Business Closure" or "Building Permit". I will then verify the fix with a simulated test.

## 1. Frontend: Ensure Fields are ALWAYS Hidden & Auto-filled
- **File**: `client/src/pages/DocumentsDashboard.jsx`
- **Action**:
    - **Update Filter Logic**: The previous fix added these fields to `standardVars` for *regex-based* templates, but seeded templates (using `required_fields` from the DB) might bypass this filter if the filtering logic isn't applied to the `required_fields` path. I will update `extractPlaceholders` to **strictly filter** the output of `required_fields` against the `standardVars` list as well. This guarantees they are hidden regardless of the template source.
    - **Inject Defaults**: Ensure `handleIssueCertificate` injects the auto-generated values (`CTC-YYYY-XXXX`, `OR-YYYY-XXXX`, `Clerk/User`) into the `dynamic_data` payload.

## 2. Test Plan: End-to-End Verification
I will perform the user's requested test scenario:
1.  **User**: Search for `Symonignacio1@gmail.com` (or search "Symon").
2.  **Template**: Select "Business Closure" (which explicitly has these fields).
3.  **Check UI**: Confirm `CTC No`, `OR No`, and `Prepared By` are **NOT** visible in the "Additional Template Information" section.
4.  **Issue**: Click "Create Certificate".
5.  **Verify**: Check that the generated certificate contains the auto-generated numbers and "Clerk" (or user name) in the correct spots.

I will proceed with the frontend code update first.