# Fix Duplicate User Notification & Data Sync

The logs reveal the exact problem:
1.  **User ID Mismatch**: The system detected User **10239** and sent the notification to them.
2.  **Your Session**: You are logged in as User **10236** (same email, but different ID).
3.  **Result**: You (10236) never got the notification, so your dashboard didn't auto-refresh, and you are looking at stale "Under Review" data.

## 1. Fix Notification Targeting (Backend)
- I will update `secretaryRoutes.js` to find **ALL** user IDs associated with the applicant's email (both 10236 and 10239).
- I will send the notification to **all of them** to ensure you receive it regardless of which "duplicate" account you are using.

## 2. Fix Profile Data Fetching (Backend)
- I noticed that my previous edit to `residentAuthRoutes.js` accidentally removed the `file_path` field from the query.
- I will add `file_path` back to the SELECT statement to ensure the profile object is complete and valid for the frontend.

## 3. Enable Auto-Refresh for Rejection (Frontend)
- I will update `ResidentDashboard.jsx` to listen for the `"Document Rejected"` notification title.
- This ensures that when you *do* get the notification, the page refreshes instantly to show the Red Banner.

## Plan Execution
1.  **Backend**: Update `secretaryRoutes.js` to loop through all matching users for notifications.
2.  **Backend**: Fix `residentAuthRoutes.js` to include `file_path`.
3.  **Frontend**: Update `ResidentDashboard.jsx` to trigger refresh on "Document Rejected".

This will solve both the missing notification and the stuck status.
