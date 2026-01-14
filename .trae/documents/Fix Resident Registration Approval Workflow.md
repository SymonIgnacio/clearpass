I will fix the registration flow to ensure new accounts start as "Pending" and do not have "Resident" privileges until approved.

### **Issue**
Currently, the `/register` endpoint in `residentAuthRoutes.js` (and the `openRegister` in `residentController.js`) automatically assigns the user the **Resident** role (Role ID 12) and sets their status to **Active** immediately upon creation. This bypasses the intended verification workflow where a Secretary or Admin must approve them first.

### **Plan**
1.  **Define a "Guest" Role**:
    *   Verify if a "Guest" or "Applicant" role exists in `roles.js`. If not, I will add `ROLES.GUEST = 13` (or the next available ID).
    *   This role will have very limited access (only to the "Pending Verification" dashboard).

2.  **Update Registration Logic (`server/routes/residentAuthRoutes.js`)**:
    *   **Change Default Role**: Instead of assigning `ROLES.RESIDENT` (12), assign `ROLES.GUEST` (or 0/null if we want to rely purely on status).
    *   **Enforce Inactive User Account**: Set `is_active = 0` (false) for the new user account in the `users` table.
    *   **Enforce Pending Resident Status**: Ensure `Residency_Status` is explicitly set to 'Pending Verification'.

3.  **Update Login Logic (`server/routes/residentAuthRoutes.js`)**:
    *   Modify the `/login` endpoint to allow users with `Residency_Status = 'Pending Verification'` to log in, **BUT** restrict their access.
    *   If status is 'Pending', return a specific flag or limited user object so the frontend knows to show the "Pending Approval" screen instead of the full dashboard.

4.  **Frontend Handling (`client/src/pages/ResidentDashboard.jsx`)**:
    *   Update the dashboard to check the user's role/status.
    *   If the user is a "Guest" or has "Pending Verification" status, show a **"Registration Under Review"** state instead of the full resident portal.
    *   Disable features like "Request Certificate" or "File Blotter" for pending users.

5.  **Admin Approval Workflow**:
    *   Ensure the Admin/Secretary "Verification" page correctly promotes the user from "Guest" -> "Resident" and "Pending" -> "Active" upon approval.

### **Immediate Action Items**
*   Modify `residentAuthRoutes.js` to set `is_active = 0` (or keep it 1 but restrict role) and ensuring `Residency_Status` is 'Pending'.
*   (Self-Correction): Actually, blocking login (`is_active=0`) prevents them from uploading documents. Better approach: Keep `is_active=1` (so they can login) but downgrade role to **Guest/Applicant** so they can *only* see the verification status page.
