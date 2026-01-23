I have refined the plan based on your clarification. Since only **Admin** (Role 1) and **Blotter Officer** (Role 6) are allowed to perform these actions, and you are experiencing issues despite being logged in as an Admin, I suspect a role mapping issue in the route definition or a mismatch in how the role is being evaluated.

Here is the updated plan:

### 1. Server-Side Fix & Debugging
**File:** `server/routes/blotterRequestRoutes.js`
- **Action:** Update the `PATCH /:id/status` route to use **Numeric Role IDs** `[1, 6]` instead of string names `['admin', 'blotter_officer']`.
- **Reason:** This eliminates any potential ambiguity in the string-to-ID mapping process within the `checkRole` middleware.

**File:** `server/controllers/blotterRequestController.js`
- **Action:** Add detailed logging in the `setStatus` method.
- **Reason:** To debug the "400 Bad Request" error by inspecting `req.body` and `req.user.role` directly in the server logs. This will reveal if the payload is malformed or if the user's role is not what we expect.

### 2. Client-Side Fix (UI Logic)
**File:** `client/src/pages/RequestDetail.jsx`
- **Action:** 
    - Import `useAuth` to access the authenticated user's profile.
    - Update `canApprove` to return `true` **only** if `user.role` is `1` (Admin) or `6` (Blotter Officer).
- **Reason:** This ensures the UI accurately reflects the server-side permissions. If the buttons are disabled, it confirms the client application does not recognize the user as an Admin, pointing to a frontend state issue.

### 3. Verification
- **Test:** I will verify the changes by checking the route definition and the client-side logic. You can then try the action again; if it fails, the new server logs will pinpoint exactly why.
