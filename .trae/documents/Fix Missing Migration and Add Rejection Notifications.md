# Fix Uploads, Notifications, and Dashboard

I have a complete plan to address all three of your issues.

## 1. Fix "Unknown Column" Error (Uploads)
- **Issue**: The database migration didn't run, so the `file_data` column is missing.
- **Action**: I will run the migration command to update your database structure.

## 2. In-App Notifications for Rejection
- **Issue**: You want the bell icon to show notifications when a document is rejected, not email.
- **Action**: I will update `server/routes/secretaryRoutes.js`.
    - Instead of sending email, I will use `global.createNotification(userId, ...)` to send a real-time in-app notification.
    - I will write logic to find the correct `user_id` from the document so the notification goes to the right person.

## 3. Fix "Recent Requests" (Dashboard)
- **Issue**: The dashboard says "No requests yet" because it only looks for *Certificate Requests*, not *Residency Applications*.
- **Action**: I will modify `server/controllers/certificateRequestController.js` (specifically `getMyRequests`).
    - I will add a step to also fetch **Residency Application** status from the `resident_applications` table.
    - I will merge this into the list so you can see "Residency Application - Pending/Rejected" right on your dashboard.

## Plan Execution
1.  **Database**: Run `npx knex migrate:latest`.
2.  **Backend (Notification)**: Update `secretaryRoutes.js` to trigger `createNotification` on verify/reject.
3.  **Backend (Dashboard)**: Update `certificateRequestController.js` to include residency applications in the request list.

This will solve the upload error, the notification preference, and the empty dashboard.
