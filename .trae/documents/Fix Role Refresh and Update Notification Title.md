# Address Remaining Requirements: Request Tracking & Verification State

I have fixed the "Guest" status persistence and the notification title. Now I need to address the remaining points from your detailed request:

1.  **Request Tracking Accuracy**:
    -   Fix counters for Pending, Completed, and Total requests.
    -   Ensure "Recent Requests" updates immediately and is ordered correctly.
2.  **Verification State Checks**:
    -   Prevent upload button access if already verified.
    -   Show appropriate messaging.

## Plan
1.  **Frontend (Counters)**: Review `ResidentDashboard.jsx` stats calculation logic. It seems to filter `requests` but might be missing some statuses or types.
2.  **Frontend (Upload Prevention)**: Ensure the "Upload Proof" button is disabled or hidden when `profile.Residency_Status` is "Active" or `verification_status` is "verified".
3.  **Backend (Verification State)**: Ensure the backend rejects upload attempts if the user is already verified (in `residentController.js` or `residentAuthRoutes.js`).

## Plan Execution
1.  **Frontend**: Update `ResidentDashboard.jsx` to refine stats calculation and disable upload if verified.
2.  **Backend**: Add a check in the upload route to prevent re-uploading if already verified.

I will start by modifying `ResidentDashboard.jsx` to fix the counters and disable the button.
