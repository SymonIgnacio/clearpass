I have identified the issue causing the Forecast export to fail.

### **Root Cause**
The API endpoint for generating PDF reports (`/api/admin/reports/pdf/:type`) is currently restricted to **IT Admins (Role 1)** only.
The **Barangay Captain (Role 2)**, who uses the "Forecast" and "AI Analytics" dashboard, does not have permission to access this endpoint, resulting in a **403 Forbidden** error or simply a failed request.

### **Plan**
1.  **Update Backend Permissions**:
    *   Modify `server/routes/adminRoutes.js` to allow `ROLES.CAPTAIN` (and `ROLES.SECRETARY`) to access the PDF generation route.
    *   This will ensure that when the Captain clicks "Export", the server accepts the request.

2.  **Verify Controller Logic**:
    *   The previous implementation in `adminController.js` correctly handles the `ai` report type and fetches data using `knex`. No further changes are needed there unless testing reveals specific data issues.

3.  **Frontend Verification**:
    *   The frontend call in `RondaAnalytics.jsx` is correctly constructed as `/admin/reports/pdf/ai`. With the backend permission fix, this should work immediately.

I will now proceed to update the route permissions.