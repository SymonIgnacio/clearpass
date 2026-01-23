I will fix the bug where approved certificate requests are not appearing in the history or dashboard counts. The issue is that the current approval logic only updates the request status but fails to generate the official certificate record in the `certificates_log` table.

### **Implementation Plan**

**1. Update `server/controllers/certificateRequestController.js`**
I will modify the `updateRequestStatus` method to include the following steps when a request is **approved**:

*   **Fetch Request Details**: Retrieve the full request data, including the resident's snapshot (`resident_data`) and the `document_type`.
*   **Generate Control Number**: Create a unique control number (e.g., `CERT-{Timestamp}-{Random}`).
*   **Create Certificate Record**: Insert a new entry into the `certificates_log` table with:
    *   `control_no`: The generated control number.
    *   `resident_id`: The ID of the resident.
    *   `certificate_type`: The requested document type.
    *   `resident_name` & `address`: Extracted from the `resident_data` snapshot to ensure historical accuracy.
    *   `qr_validation_string`: A unique string for QR verification.
    *   `status`: Set to 'Released' or 'Paid'.
    *   `is_manual`: Set to `0` (false).
*   **Update Request Record**: Update the `document_requests` table with:
    *   `status`: 'approved'.
    *   `control_number`: The generated control number.
    *   `approved_at`: Current timestamp.
    *   `approved_by`: The ID of the staff member performing the approval.
*   **Notifications**: The existing notification and email logic will remain but will now include the generated control number.

**2. Verification**
*   **Manual Test**: I will simulate an approval via a script or temporarily creating a test request to ensure:
    *   A record appears in `certificates_log`.
    *   The `document_requests` record is updated with the control number.
    *   The "Certificate History" and dashboard counts reflect the new data.

This approach ensures that every approved request becomes an official, countable certificate record, resolving the missing data on the dashboard and history pages.