I have refined the plan based on your feedback. I will focus on enforcing the ID requirement for certificate requests and implementing the missing Certificate Types backend.

### **Revised Implementation Plan**

#### **1. Enforce ID Requirement (Frontend & Logic)**
*   **Update `CertificateRequest.jsx` (Resident Side):**
    *   Add a mandatory **File Upload** section to the request form.
    *   Require two files: **Front ID** and **Back ID**.
    *   Display the instruction: *"Valid ID (Government or School ID) is required for this request."*
*   **Update `Certificate Types` Data:**
    *   Hardcode/Default the `required_data` field for all new and existing types to include: `"Valid ID (Front & Back)"`.

#### **2. Backend for Certificate Types (CRUD)**
*   **Create `certificateTypeController.js`:**
    *   Implement `createCertificateType`: Save new types to the database.
    *   Implement `updateCertificateType`: Edit existing types.
    *   Implement `deleteCertificateType`: Remove types (soft delete or check for dependencies).
*   **Update Routes:** Register these endpoints in `server/routes/certificateTypeRoutes.js` and `server/index.js`.
*   **Remove "Demo Mode":** Update `DocumentsDashboard.jsx` to call these real API endpoints instead of showing the "Demo Mode" snackbar.

#### **3. Backend for Certificate Requests with Attachments**
*   **Update `document_requests` Table:**
    *   Create a migration to add columns for `attachment_front_id` and `attachment_back_id` (store file paths/blobs).
*   **Update `certificateRequestController.js`:**
    *   Modify the `submitRequest` endpoint to handle `multipart/form-data`.
    *   Save the uploaded ID files alongside the request.

#### **4. Staff Verification (Secretary/Clerk)**
*   **Update `DocumentsDashboard.jsx` (Staff View):**
    *   In the "Certificate History" or "Requests" tab (where staff review pending certs), add a button to **"View Attached IDs"**.
    *   Ensure the "Approve" action is available to both **Secretary** and **Clerk** roles (as requested).

### **Summary of User-Facing Changes**
1.  **Residents:** Will now be forced to upload Front/Back IDs when requesting *any* certificate.
2.  **Admins:** Will no longer see "Demo Mode" when creating Certificate Types.
3.  **Staff:** Will be able to see the specific IDs uploaded for each request before approving it.
4.  **UI:** The "Create Template" button (which was confusing) will be removed.