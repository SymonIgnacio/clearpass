I have confirmed that while the routes were removed, the import statements for `OfficerAttendance` and `OfficerReports` are still present in `client/src/App.jsx` (lines 46-47), causing the build error.

**Plan:**
1.  **Remove Imports:** I will remove the following lines from `client/src/App.jsx`:
    ```javascript
    const OfficerAttendance = lazy(() => import('./pages/OfficerAttendance'))
    const OfficerReports = lazy(() => import('./pages/OfficerReports'))
    ```

This will eliminate the references to the missing files and resolve the Vite build error.
