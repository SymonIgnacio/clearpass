I will address the three reported issues as follows:

1.  **Fix Upload Error (Backend)**
    *   **Issue:** The system attempts to save the file content into a database column (`file_content`) that does not exist, causing the crash.
    *   **Fix:** Modify `server/controllers/residentController.js` to save the uploaded file to the server's disk (`/uploads/documents/`) instead of the database. The database will store the file path. This is a more robust and standard approach for handling file uploads.

2.  **Fix Empty Sidebar (Frontend)**
    *   **Issue:** The sidebar menu items are currently restricted to fully verified residents (Role 12), hiding them from "Guest" users (Role 13) who are pending verification.
    *   **Fix:** Update `client/src/components/Sidebar.jsx` to allow "Guest" users to see essential menu items like **Dashboard**, **My Profile**, and **Announcements**.

3.  **Add "Reapply" Button (Frontend)**
    *   **Issue:** Users in a "Rejected" state lack a clear way to re-submit their application from the dashboard.
    *   **Fix:** Update `client/src/pages/ResidentDashboard.jsx` to add a prominent **"Edit Application & Re-apply"** button in the "Quick Actions" section when the user's status is "Rejected". This will open the existing edit form to allow corrections and re-submission.

**Note:** The previous fix I applied ensures that *uploading* a document automatically resets the status to "Pending". This new "Reapply" button handles the case where the user needs to edit their data (e.g., name, address) without necessarily uploading a new file immediately, or just wants a clear button to press.