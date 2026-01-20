# Remove Auto-Generated Placeholders & Verify Manual Issuance

I will update the system to hide `ctc_no` and `or_no` from the manual input form since they are auto-generated, and I will verify the entire manual issuance process.

## 1. Hide Auto-Generated Fields in Frontend
- **File**: `client/src/pages/DocumentsDashboard.jsx`
- **Action**: Update the `standardVars` array in the `extractPlaceholders` function to include `'ctc_no'` and `'or_no'`.
- **Reason**: This will prevent these fields from appearing in the "Additional Template Information" section, as the system treats them as "standard" (handled automatically or internally).

## 2. Verify Manual Issuance Process (Test Plan)
I will perform a series of checks to ensure the manual issuance is completely working:
1.  **Select Template**: Choose "Low Income Housing" (or similar).
2.  **Verify Inputs**: Confirm that `resident_name`, `date`, `purpose`, etc., are present, but `ctc_no` and `or_no` are **hidden**.
3.  **Check Dynamic Fields**: Confirm that *other* required fields (e.g., `business_name` for Business Closure) **do** still appear.
4.  **Issue Certificate**: Submit the form.
5.  **Verify Output**:
    - Check the API response for success.
    - Confirm the `document_requests` table has the correct `request_data` (including dynamic fields).
    - Ensure the downloaded document has the variables replaced correctly (including the auto-generated ones if the backend provides defaults).

## 3. Backend Adjustment (If needed)
- **File**: `server/controllers/documentController.js`
- **Check**: Ensure `_mergeData` correctly provides defaults for `ctc_no` and `or_no` if they are not supplied in the manual request (e.g., generating them or setting them to "N/A" if appropriate for manual issuance). Currently, they map from `requestDetails`, so for manual issuance, we might need to ensure they have values if the template strictly requires them. *Self-correction: The user said they are auto-generated, so I will assume the backend handles this or they are not needed for manual input.*

I will proceed with the frontend change first.