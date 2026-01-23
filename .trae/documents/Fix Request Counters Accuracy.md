I will fix the inaccurate request counters by ensuring all request types (Certificates, Blotter, Documents) are correctly fetched and counted, and that status matching is case-insensitive to handle "COMPLETED", "APPROVED", etc.

### Implementation Steps
1.  **Update `ResidentDashboard.jsx`**:
    *   **Certificates**: Switch API endpoint from `/certificates` to `/certificate-requests/my-requests` to match the Request History page.
    *   **Documents**: Add a new API call to `/residents/${user.resident_id}/documents` to fetch uploaded documents (e.g., PWD ID, Senior ID).
    *   **Aggregation**: Merge these new items into the `allRequests` list.
        *   Map documents to a "Document Upload" type.
    *   **Status Counting**:
        *   Update `pending` filter to include: `Pending`, `Under Review`, `pending`, `pending_review`, `Pending Upload`, `Pending Verification`.
        *   Update `completed` filter to include: `Released`, `Active`, `verified`, `Verified`, `approved`, `Approved`, `APPROVED`, `Resolved`, `Closed`, `COMPLETED`, `REJECTED`, `Rejected`.
    *   **Sort**: Ensure the combined list is sorted by `created_at` (newest first).

### Verification
*   I will verify that the "Total Requests" count now reflects the sum of certificates, blotter reports, and uploaded documents.
*   I will verify that "Completed" counts items like "COMPLETED" certificates and "Verified" documents.
