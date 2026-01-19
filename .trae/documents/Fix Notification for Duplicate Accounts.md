# Diagnosis: Duplicate User & Notification Miss

I have confirmed the problem logic:
1.  **Duplicate Accounts**: You have multiple user accounts with the same email (`Symonignacio1@gmail.com`).
    -   User **10236** (Your current login).
    -   User **10239** (Another account).
2.  **Notification Miss**: When the Admin rejects the document, the system finds the email from the application, then looks up the user ID.
    -   Currently, it finds **10239** and sends the notification there.
    -   Since you are logged in as **10236**, you never get the alert.
3.  **Status Stuck**: Because you don't get the notification, your dashboard doesn't refresh.

## The Fix: "Blast" Notification
I will modify `secretaryRoutes.js` to be smarter about finding *all* users linked to that email.
-   Instead of finding just one user, I will find **ALL** users with the email `Symonignacio1@gmail.com` (case-insensitive).
-   I will loop through and send the notification to **every single one of them**.
-   This ensures that no matter which "duplicate" you are logged into, you will receive the alert.

## Plan Execution
1.  **Backend**: Update `secretaryRoutes.js` to fetch all matching user IDs and send notifications to the entire list.
2.  **Verify**: I will verify that `residentAuthRoutes.js` is correctly sending the `verification_status` so the banner updates properly when the page refreshes.

This is a robust fix that handles duplicate accounts gracefully.
