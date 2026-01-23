I will update the `ResidentDashboard.jsx` component to accurately reflect all types of resident requests, including Blotter Reports and Beneficiary Claims, in the dashboard counters and recent requests list.

### Implementation Steps
1.  **Modify `ResidentDashboard.jsx`**:
    *   Update `fetchDashboardData` function to:
        *   Fetch blotter requests using `apiRequest('/blotter-requests/my')`.
        *   Extract beneficiary claim status from the resident profile (checking `validation_status` from the `vulnerabilities` data).
    *   **Data Normalization & Aggregation**:
        *   Create a unified `allRequests` array merging:
            *   **Certificate Requests** (existing)
            *   **Blotter Requests** (new): Map `incident_type` to "Blotter Report" type.
            *   **Beneficiary Claims** (new): Add a virtual request item if `profile.validation_status` is 'pending' or recently updated.
            *   **Residency Verification** (existing): Keep the existing logic for verification documents.
    *   **Sort**: Ensure the combined list is sorted by `created_at` (newest first).
    *   **Update Counters**: Calculate "Pending" and "Total" counts based on this comprehensive list.

### Verification
*   I will verify that "Pending Requests" count increases when a simulated blotter request or beneficiary claim is present.
*   I will check that the "Recent Requests" list shows items from different categories (Certificate, Blotter, Beneficiary).
