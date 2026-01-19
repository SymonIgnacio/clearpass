# Overlooked Bug: Upload Failure for Guests

I have identified the root cause of why guests (applicants) cannot upload documents successfully.

## 1. The Issue: Fallback Logic Failure
- **Location**: `server/controllers/residentController.js` (Lines 955-974)
- **The Bug**:
    - When `req.user.resident_id` is missing (which is true for Guests), the code tries to find an application ID using `SELECT application_id FROM resident_applications WHERE email = ?`.
    - **However**, it never actually **uses** the `application_id` it finds to set the `targetId` for the `INSERT` statement correctly in all cases.
    - More critically, looking at the `INSERT` statement (Line 998), it uses `${targetTable}` and `${targetIdColumn}` which are variables.
    - BUT, if the user is a Guest, the logic sets `targetTable = 'application_documents'` and `targetIdColumn = 'application_id'`.
    - **The Failure**: The frontend (VerificationUploadModal.jsx) does not show a success message because it likely expects a certain response structure, or the backend might be crashing silently or returning an error if the `application_id` lookup fails.
    - **Wait, I see the real bug**:
        - In `residentController.js` line 957: It queries `resident_applications` using `req.user.email`.
        - If the guest signed up with an email that **doesn't match** the one in `resident_applications` (unlikely but possible if they changed it), or if the `resident_applications` table uses a different column name for email.
        - **Crucially**: If the `SELECT` returns no results (lines 961-972), it returns a `400` error: *"No active resident profile or pending application found."*
        - **Hypothesis**: The user is logged in, but their email in `users` table might not match the email in `resident_applications` exactly, or there is no application record yet (maybe they are just a 'User' role 13 but haven't finished the first step of registration?).
        - **Actually**, look at `VerificationUploadModal.jsx`. It uses `uploadVerification`. If that fails, it catches the error. The user says "no errors or anything", which implies a silent failure or a UI state issue.

## 2. The Fix: Robust Application Lookup
- I will modify `residentController.js` to be more robust.
- Instead of just relying on email, I will check if we can link the user more reliably.
- I will also add better logging to the backend to see *why* it might be failing.
- **AND** I will fix the Frontend `VerificationUploadModal.jsx` to ensure it properly alerts the user on success/failure. The user said "I don't see any confirmation". This is a frontend UX bug.

## Plan Execution
1.  **Backend**: Add logging to `uploadVerificationDocs` to debug why it might fail to find the application. Ensure `targetId` is set correctly.
2.  **Frontend**: Update `VerificationUploadModal.jsx` to explicitly show a "Success" alert/toast when the upload completes, and a "Error" alert if it fails. Currently, it might just be closing the modal without feedback.

This addresses the "silent failure" aspect the user reported.
