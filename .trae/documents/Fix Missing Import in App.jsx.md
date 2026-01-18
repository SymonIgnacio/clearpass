I found the cause of the `ReferenceError`. Although the route for `ResidentDocuments` was added to `App.jsx`, the **import statement** for the component was missing.

### **Fix Plan**
1.  **Update `client/src/App.jsx`**:
    *   Add the missing lazy import: `const ResidentDocuments = lazy(() => import('./pages/ResidentDocuments'))`.
    *   I will place it alongside other resident-related imports (e.g., near `ComplaintHistory` or `ResidentProfile`).

This will resolve the error and allow the page to load correctly.
