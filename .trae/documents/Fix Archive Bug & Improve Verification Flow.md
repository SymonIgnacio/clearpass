# Plan: Fix Archive Error, Reset Data, and Improve Verification Flow

## 1. Fix Archive 404 Error
- [ ] **Update Route**: Modify `server/routes/residentRoutes.js` to explicitly add the `PUT /:id/archive` route, mapping it to the existing `residentController.archive` method. This resolves the 404 error the frontend is encountering.

## 2. Reset Test Data (Symon Ignacio)
- [ ] **Create Reset Script**: Create a script `server/scripts/reset_symon.js` to:
    - Find the user "SYMON IGNACIO".
    - Delete their record from the `residents` table.
    - Reset their user account in the `users` table to `Role 13` (Guest) and `resident_id = NULL`.
- [ ] **Execute Script**: Run the script to restore the test environment.

## 3. Improve Verification Process
- [ ] **Backend Notification**: Modify `server/controllers/adminController.js` to:
    - Initialize `NotificationController`.
    - Inside `verifyResident`, trigger a system notification to the user when their residency is verified.
- [ ] **Frontend Real-time Update**: Update `client/src/pages/ResidentDashboard.jsx` to:
    - Listen for incoming notifications (via `NotificationContext`).
    - Automatically refresh the dashboard data (profile status, stats) when a verification notification is received, ensuring the UI updates instantly without a page reload.
