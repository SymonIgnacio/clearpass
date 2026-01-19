# Overlooked Bugs: Notification Logic & Dashboard Status

I have identified why the notifications aren't showing and why the status is stuck.

## 1. Dashboard "Under Review" Logic Flaw
- **Current Logic**:
  ```javascript
  const hasUploadedVerification = !!profile?.verification_document;
  // Banner shows: {hasUploadedVerification ? "Verification Under Review" : "Verification Required"}
  ```
- **The Bug**: It *only* checks if a document exists. It does **not** check if that document is `pending`, `verified`, or `rejected`.
- **Result**: Even if you reject the document, it still exists in the database (with status `rejected`), so `hasUploadedVerification` remains `true`, and the dashboard falsely says "Under Review".
- **The Fix**: I need to fetch the *status* of the document and update the banner logic:
  - If `status === 'rejected'`, show "Verification Rejected - Please Upload Again".
  - If `status === 'pending'`, show "Under Review".
  - If `status === 'verified'`, hide the banner (or show "Verified").

## 2. Notification "Missing"
- **Potential Cause**: The logic in `secretaryRoutes.js` relies on matching the user's email from `resident_applications` to the `users` table.
- **Verification**:
  - If the user registered with `Symonignacio1@gmail.com` but the application has `symonignacio1@gmail.com` (case difference) or vice versa, the exact string match might fail if collation isn't case-insensitive.
  - Or, if the `userIdToNotify` logic is correct, perhaps the frontend isn't refreshing notifications immediately.
- **The Fix**: I will add logging to `secretaryRoutes.js` to see if `userIdToNotify` is actually found. I will also double-check the email matching logic.
- **Refinement**: I'll ensure `createNotification` is awaited properly.

## Plan Execution
1.  **Dashboard**: Update `ResidentDashboard.jsx` (and `residentController.js` if needed) to return the `verification_status` of the document, not just its existence.
2.  **Logic Update**: Change the dashboard banner to handle the `rejected` state explicitly.
3.  **Backend**: Verify `userIdToNotify` logic in `secretaryRoutes.js` and add fallback/logging.

This will ensure you see "Rejected" on the dashboard and fix the notification flow.
