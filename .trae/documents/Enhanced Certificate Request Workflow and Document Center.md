The requested changes have been implemented to enhance the document management system and certificate request workflow.

### 1. Document Center Enhancements
- **Removed "Create Template" Button:** The button has been removed as requested. Templates are now managed solely via file upload.
- **Certificate Types Integration:** Replaced the "Demo Mode" alerts with a fully functional backend API for creating, updating, and deleting Certificate Types.
- **Required Data Handling:** Updated the Certificate Types form to handle "Required Data" as a newline-separated list, which is stored as a JSON array in the database.

### 2. Certificate Request Workflow
- **Resident Side:**
  - Fixed a bug in `CertificateRequest.jsx` where the `purpose` field caused a crash due to missing state.
  - Ensured residents can upload Front and Back IDs when requesting certificates.
- **Staff Side (Admin, Secretary, Clerk):**
  - Added a new **"Certificate Requests"** tab in the Document Center.
  - Staff can now:
    - View all pending certificate requests.
    - Preview the attached Front and Back ID images.
    - Approve or Reject requests with remarks.

### 3. Backend Updates
- **New Routes:** Added `/api/certificate-requests/admin/all`, `/attachment/:type`, and `/status` endpoints for staff management.
- **Controller Logic:** Implemented the necessary logic in `CertificateRequestController` to fetch requests, stream ID attachments, and update statuses.
- **Database:** Verified that the necessary columns (`attachment_front_id`, `attachment_back_id`) exist in the `document_requests` table.

These changes ensure a smooth workflow from resident request (with ID) to staff verification and approval.