I will fix the data integrity issues and UI layout problems in the Admin Reports.

### Backend Fixes (Data Integrity)
**File:** `server/controllers/adminController.js`

1.  **Residents Report (`getResidentsReport`)**:
    *   **Fix `total_households`**: Currently hardcoded to 0. I will add a query to count records in the `households` table.
    *   **Fix `sitioDistribution`**: Change the `INNER JOIN` to `LEFT JOIN` to ensure residents without a household or sitio are still counted (labeled as "Unassigned" if needed) or at least don't break the query logic, though `LEFT JOIN` from residents to households is safer.
    *   **Refine `age_demographics`**: Ensure NULL birthdates are handled gracefully.

2.  **Certificates Report (`getCertificatesReport`)**:
    *   **Implement `top_issuers`**: Currently an empty array. I will fetch this data by querying the `audit_logs` table for "Certificate Issued" events, grouped by `user_id`, and joined with the `users` table to get staff names.

### Frontend Fixes (UI/UX)
**File:** `client/src/pages/AdminReports.jsx`

1.  **General Layout**:
    *   Apply `height: '100%'` and `display: 'flex', flexDirection: 'column'` to all Cards within Grid items to ensure uniform height and prevent "scattered" looks.

2.  **Residents Tab**:
    *   Align the bottom row cards ("Age Demographics", "Verification Status", "Sitio Distribution") to have equal heights.

3.  **Certificates Tab**:
    *   Ensure "Monthly Issuance Trends" and "Top Certificate Issuers" are side-by-side with equal height.
    *   Reposition the "Export PDF" button/card to be consistent with the grid, or integrate it into the section header to save space.

4.  **Security Tab**:
    *   Match the height of "Top Failed Login Sources" (md=8) and "THEMIS ClearPass Security" (md=4).

### Verification
*   I will verify the SQL queries by checking the JSON response from the API.
*   I will visually verify the code changes in the React component to ensure classes and props are correctly applied for layout consistency.
