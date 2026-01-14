I will fix the login error by correcting the API endpoint and payload structure in `ResidentLogin.jsx`.

### **Issue Analysis**
The user is receiving a generic `Error: [object Object]` during login.
1.  **Wrong Endpoint:** `ResidentLogin.jsx` calls `/auth/resident/login`. However, the backend route is actually `/resident-auth/login` (mounted as `/api/resident-auth` in `index.js`).
2.  **Wrong Payload Key:** The `login` function sends `{ username: email }`, but the backend expects `{ email: email }`.

### **Plan**
1.  **Update `ResidentLogin.jsx`**:
    *   Change the endpoint from `/auth/resident/login` to `/resident-auth/login`.
    *   Change the payload key from `username` to `email`.
    *   Improve error handling to display the actual error message from the backend instead of a generic "Network error".

2.  **Verify Backend Route**:
    *   Confirm that `server/index.js` mounts `residentAuthRoutes` at `/api/resident-auth`.
    *   Confirm that `server/routes/residentAuthRoutes.js` has the `/login` handler expecting `email` and `password`.

### **Implementation Steps**
1.  Modify `client/src/pages/ResidentLogin.jsx`:
    ```javascript
    await login(
      { email: formData.email, password: formData.password }, // Changed username -> email
      { endpoint: '/resident-auth/login' } // Changed endpoint
    )
    ```
2.  Update the error handling block to show `error.message`.
