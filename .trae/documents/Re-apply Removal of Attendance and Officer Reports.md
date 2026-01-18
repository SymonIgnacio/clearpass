It seems the codebase state has reverted to a point where `OfficerAttendance.jsx` and `OfficerReports.jsx` are gone, but the backend controller `caseManagementController.js` still has the methods for them (like `getAttendance`, `markAttendance`, `exportAttendanceReport`, `generateReport`, `exportReport`). Also, `Sidebar.jsx` and `App.jsx` have reverted to include links and routes to these non-existent pages.

I need to clean this up again.

### **Plan**

1.  **Clean up `client/src/App.jsx`**:
    *   Remove lazy imports for `OfficerAttendance` and `OfficerReports`.
    *   Remove routes for `/officer/attendance` and `/officer/reports`.

2.  **Clean up `client/src/components/Sidebar.jsx`**:
    *   Remove "Attendance Log" and "Officer Reports" from the `caseManagement` menu.
    *   Ensure "Reports" is added/kept in the `analytics` menu with Role 6 access.

3.  **Clean up `server/controllers/caseManagementController.js`**:
    *   Remove methods: `getAttendance`, `markAttendance`, `exportAttendanceReport`, `generateReport`, `exportReport`.

4.  **Clean up `server/routes/caseManagementRoutes.js`**:
    *   Remove routes corresponding to the deleted controller methods.

This will bring the codebase back to the streamlined state we achieved earlier.
