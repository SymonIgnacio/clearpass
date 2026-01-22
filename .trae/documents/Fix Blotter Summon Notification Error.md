I will fix the `TypeError` in the blotter controller by correctly instantiating the `NotificationController` class and updating the method calls to match the required signature.

**Changes to `server/controllers/blotterController.js`**:

1.  **Update Import**: Rename the imported `notificationController` to `NotificationController` to reflect that it is a class.
2.  **Instantiate Controller**: Inside the `update` function, create a new instance: `const notificationController = new NotificationController(db);`.
3.  **Fix Method Calls**: The `createNotification` method expects separate arguments `(userId, title, message, type, priority, data)`, but the current code passes a single object. I will rewrite the calls to pass arguments correctly:
    *   `userId`: `u[0].id`
    *   `title`: `'Blotter Hearing Summon'`
    *   `message`: `message`
    *   `type`: `'warning'`
    *   `priority`: `'high'`
    *   `data`: `{ link: '/resident/blotter-report' }`

**Verification**:
I will verify that the syntax matches the `NotificationController` definition found in `server/controllers/notificationController.js`. Since I cannot run the server interactively to reproduce the trigger, I will rely on code correctness verification.

This will ensure that when a summon is issued (hearing schedule updated), the resident receives the notification as expected.