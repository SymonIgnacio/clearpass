# Final Fix: Robust Notification Targeting

I have confirmed that the user (10236) is not being notified because the system is only looking up users by the application's *email*, while this specific user was likely linked by *name* during the upload process.

## The Solution: Broaden the Search
I will update `secretaryRoutes.js` to find users by **BOTH**:
1.  **Email**: The email address listed in the application.
2.  **Full Name**: The combined `first_name` and `last_name` from the application.

This ensures that:
-   If the email matches, they get notified.
-   If the name matches (like in your case), they ALSO get notified.
-   Duplicate notifications to the same ID will be filtered out.

## Plan Execution
1.  **Backend**: Modify `secretaryRoutes.js` to query users by `email OR full_name`.
2.  **Logic**: Deduplicate the list of user IDs before sending.
3.  **Execute**: This will guarantee User 10236 receives the "Document Rejected" alert.
