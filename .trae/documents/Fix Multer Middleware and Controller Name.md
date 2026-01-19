# Fix Server Crash: Multer and Controller Export

The server crashed because of two issues in the `upload-verification` route:
1.  **Multer Misconfiguration**: `uploadMiddleware` was being exported as an *already configured* middleware (`.any()`), but the route tried to reconfigure it with `.fields()`. This caused `TypeError: upload.fields is not a function`.
2.  **Controller Name Mismatch**: The route tries to call `uploadVerificationDocument`, but the actual function in `residentController.js` is named `uploadVerificationDocs`.

## The Fix
1.  **Correct Import**: Instead of importing the messed-up middleware from the controller, I will import the raw `upload` middleware directly from `../middleware/upload.js`. This allows me to use `.fields()` correctly.
2.  **Correct Function Name**: I will update the route to call the correct controller function `uploadVerificationDocs`.

## Plan Execution
1.  **Backend**: Modify `server/routes/residentAuthRoutes.js` to fix the import and the function name.
2.  **Verify**: This will resolve the crash, allow the server to restart, and enable the file upload functionality to work properly.
