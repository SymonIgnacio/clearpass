I have identified the root cause of the issue. The `DocumentsDashboard` component expects a `user` prop, but `App.jsx` renders it without passing one. As a result, the `user` object is `undefined`, causing all permission checks (e.g., `canIssue`, `canManage`) to fail, leaving you with only the default "Certificate History" tab.

To fix this, I will update the component to retrieve the user directly from the authentication context, consistent with other pages in the application.

### **Planned Changes**

1.  **Modify `client/src/pages/DocumentsDashboard.jsx`**:
    *   Import the `useAuth` hook from `../contexts/AuthContext`.
    *   Replace the `user` prop with `const { user } = useAuth();` inside the component.
    *   This ensures the dashboard correctly accesses your logged-in "IT Admin" role.

### **Verification**
*   After this change, the component will correctly identify your role.
*   The "Document Templates", "Certificate Types", and "Document Analytics" tabs—along with the "Upload File" button—will become visible.