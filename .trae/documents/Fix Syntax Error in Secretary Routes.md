I have fixed the `SyntaxError` in `secretaryRoutes.js` where the `app` variable was being redeclared. This was causing the server to crash, leading to the connection refused errors you saw in the frontend.

### **Fix Details**
- **File**: `server/routes/secretaryRoutes.js`
- **Change**: Renamed the destructured variable from `approveApplication` to `approvedApp` to avoid conflict with the existing `app` constant.

The server should now restart automatically (nodemon). Once it's up:
1.  **Dashboard Check**: The dashboard should load correctly without connection errors.
2.  **Verification Check**: Your account status should be reflected accurately (Resident, Active, 0 Pending) as confirmed in the previous step.

No further action is needed unless you see new errors.