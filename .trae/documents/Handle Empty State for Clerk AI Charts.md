I will generate comprehensive test data for **Certificate Requests** to populate the Clerk Dashboard (Workload Insights) and test the entire workflow.

### **Plan of Action**

1.  **Enhance `generate_comprehensive_data.js`**:
    *   **Add Certificate Request Generation**: I will add a new step (Step 5) to the script.
    *   **Logic**:
        *   It will select random residents (`resident_id`).
        *   It will pick random document types (e.g., "Barangay Clearance", "Indigency").
        *   It will generate timestamps within the **last 30 days** to ensure they appear in the current analytics window.
        *   It will assign random statuses (`pending`, `approved`, `rejected`) to simulate a real workload.
        *   It will populate dummy BLOB data for the `attachment_front_id` and `attachment_back_id` columns (required by the schema).
    *   **Volume**: I will generate **50+ requests** to ensure the charts look populated and trends are visible.

2.  **Verify Schema Compatibility**:
    *   I've checked the `CertificateRequestController.js` and confirmed the table is `document_requests`.
    *   Columns to populate: `request_id`, `resident_id`, `document_type`, `status`, `created_at`, `updated_at`, `request_data` (JSON), `attachment_front_id` (BLOB), `attachment_back_id` (BLOB).

3.  **Frontend Update (ClerkAIInsights.jsx)**:
    *   I will stick to the previous plan of adding a **"No Data" empty state** to the chart. This is good practice even if we have data now, as it handles edge cases gracefully.

### **Why this solves it**:
*   The empty chart was caused by an empty `document_requests` table.
*   By running this enhanced script, we will fill that table with realistic data.
*   The backend query (`created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`) will then find these records.
*   The frontend chart will render bars showing which certificates are in demand.
