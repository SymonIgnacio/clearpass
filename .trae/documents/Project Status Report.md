I have identified the root cause of the "Pending Verification" status and "0 requests" issue, as well as the backend error `Bind parameters must not contain undefined`.

### **Root Cause: Missing Email in Session**
The backend error (`residentAuthRoutes.js:392`) occurs because `req.user.email` is `undefined`. This happens because the JWT (session token) issued by the main login (`authController.js`) or the self-healing refresh logic **does not include the email address**.
*   **Result**: When the system tries to fetch your documents to show on the dashboard, it crashes because it can't find your email to look up the application.
*   **Frontend Impact**: Since the profile fetch crashes, the dashboard defaults to "Pending Verification" and shows 0 requests because it never successfully received your profile data.

### **The Fix Plan**
I will implement a multi-layer fix to ensure this never happens again:

1.  **Update Session Token (`authController.js`)**:
    *   Modify the `login` and `me` (refresh) endpoints to explicitly include `email` in the JWT payload.
    *   This ensures all future sessions have the required data.

2.  **Add Safety Fallback (`residentAuthRoutes.js`)**:
    *   Modify the `/profile` endpoint to check if `req.user.email` is missing.
    *   If missing, it will automatically fetch the email from the database using your User ID before proceeding.
    *   This immediately fixes the issue for your **current session** without requiring you to log out.

3.  **Frontend Verification**:
    *   Once the backend is fixed, the dashboard will successfully load your profile.
    *   It will see your "Verified" document.
    *   "Pending Requests" will drop to 0.
    *   "Completed" will go to 1.
    *   "Pending Verification" label will change to "Active".

I will proceed with these changes immediately.