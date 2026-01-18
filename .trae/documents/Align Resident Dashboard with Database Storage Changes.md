### **Answer: Where does the upload go?**

When you click the **"Upload Proof"** button in the Resident Dashboard:
1.  **Frontend:** The file is sent via `POST /api/residents/verification/upload`.
2.  **Backend:** The file content is stored **directly in the database** (in the `resident_documents` table, inside the `file_content` BLOB column) because of the changes we just made.
3.  **Status:** The user's status is updated to `Pending Verification`.

---

### **Task: Align Resident Side with Admin Changes**

You requested to "align the current changes in the admin/staff side to resident side requests."
This means ensuring that:
1.  **Residents see the "Residency Verification" tab logic correctly.** (Currently, `ResidentDashboard` uses `fetchMyDocuments` which hits `/resident-auth/my-documents`).
2.  **Residents can download their own files.** (The download link in `ResidentDashboard` might still be pointing to the old disk-based path or an outdated endpoint).
3.  **UI Consistency:** The "My Documents" list in the dashboard should reflect the same "Verified/Rejected/Pending" status colors and logic as the Admin side.

**Analysis of `ResidentDashboard.jsx`:**
*   It fetches documents via `/resident-auth/my-documents`.
*   It displays them in a list.
*   **Missing Feature:** It doesn't seem to have a "View/Download" button for the *resident* to see what they uploaded.
*   **Upload Logic:** It uses `uploadVerification` which hits `/residents/verification/upload`. We need to ensure this endpoint uses the new DB storage logic (which we verified it does in `residentController.js`).

### **Plan to Align Resident Side**

1.  **Update `residentAuthRoutes.js` (Backend):**
    *   Ensure `GET /my-documents` returns the `file_name`, `verification_status`, and `id`.
    *   Add a `GET /my-documents/:id/download` endpoint so residents can view their own files (served from DB BLOB), similar to the Admin's download endpoint.

2.  **Update `ResidentDashboard.jsx` (Frontend):**
    *   Add a "View" button to the "Your Documents" list.
    *   Use the new `openFileFromEndpoint` utility (copy logic from `DocumentVerification.jsx` or make it shared) to open the file from the new download endpoint.
    *   Ensure the status badges match the Admin side.

This ensures that if an Admin uploads a file or modifies a record, the Resident sees the exact same data and can retrieve the file content from the database.