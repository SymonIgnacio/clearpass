The `net::ERR_ABORTED` error on the logout endpoint confirms that the browser is canceling the logout API request before it completes. This typically happens because the logout handlers in the UI (like `ResidentDashboard.jsx`) are triggering a page navigation (`navigate('/resident/login')`) immediately after calling `logout()`, without waiting for the asynchronous `logout` function to finish.

This creates a race condition: the navigation cancels the pending `api.post('/auth/logout')` request, so the server never receives the command to clear the HTTP-only cookie. As a result, the user remains authenticated on the server side, leading to the loop where they are automatically redirected back to the dashboard when trying to access the login page.

My plan addresses this by ensuring the logout process is fully awaited and centralized, preventing premature navigation.

### **Plan of Action**

#### **1. Fix Race Conditions in UI Components**
- **Refactor `ResidentDashboard.jsx`**:
  - **Change**: Modify `handleLogout` to `await logout()`.
  - **Reason**: The current implementation calls `logout()` (which is async) but doesn't wait for it, immediately calling `navigate()`. This aborts the API request.
  - **Wait**: By awaiting the `logout` function, we ensure the server request completes (or fails gracefully) before any navigation occurs.

#### **2. Centralize Navigation in AuthContext**
- **Review `AuthContext.jsx`**:
  - I already added `window.location.href = '/resident/login'` to the end of the `logout` function in the previous step.
  - **Adjustment**: I will ensure this hard navigation is the *only* navigation method used for logout. This guarantees a clean state reset every time.
  - **Cleanup**: I will remove the redundant `navigate('/resident/login')` calls in `ResidentDashboard.jsx` and other components, relying instead on the centralized redirect in `AuthContext`.

#### **3. Verify `Sidebar.jsx` and `Header.jsx`**
- **Action**: Check if these components also perform their own navigation after calling `logout`.
- **Fix**: If they do, remove the manual navigation and let `AuthContext` handle it. If they don't await `logout`, update them to do so to prevent the component from unmounting prematurely.

### **Verification Strategy**
1.  **Login as Resident** in one browser window.
2.  **Open Network Tab** in developer tools.
3.  **Click Logout**.
4.  **Verify Request**: Ensure the `POST /api/auth/logout` request status is `200 OK` (or at least completes) and is **not** cancelled/aborted.
5.  **Verify Cookie**: Check that the `authToken` cookie is actually removed.
6.  **Login as Admin**: Attempt to access `/officerlogin` and log in as a staff member. It should succeed without redirecting to the resident dashboard.
