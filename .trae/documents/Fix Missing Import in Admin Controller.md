# Overlooked Bugs Found in Admin Controller

I have identified a critical bug in `server/controllers/adminController.js` that will cause the application to crash when verifying a resident.

## 1. Missing Import in `adminController.js`
- **The Issue**: In `verifyResident` (Line 331), the code attempts to create a new instance of `NotificationController`.
- **The Bug**: `NotificationController` is **not imported** at the top of the file. This will throw a `ReferenceError: NotificationController is not defined` when an admin tries to approve a resident application.
- **Fix**: Add `const NotificationController = require('./notificationController');` to the imports.

## 2. NotificationController Usage
- **The Issue**: The `verifyResident` function attempts to instantiate `NotificationController` passing `req.app.locals.db`.
- **Verification**: I need to verify if `NotificationController` constructor actually accepts `db` as an argument. Based on typical patterns it likely does, but the crash is guaranteed due to the missing import.

## Plan Execution
1.  **File**: `server/controllers/adminController.js`
2.  **Action**: Add the missing require statement at the top of the file.

This is a critical fix because it breaks the core workflow of "Approving a Resident" which is the very next step after the user uploads their verification.
