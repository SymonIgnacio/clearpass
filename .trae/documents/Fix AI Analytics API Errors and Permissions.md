I will fix the 404/403 API errors and the Sidebar UI bug.

### Backend Changes
1.  **Update `server/controllers/aiAnalyticsController.js`**:
    *   Implement `getDashboardSummary` (active cases, 30-day stats, response times).
    *   Implement `getChartData` (incident trends, types, location distribution, hourly patterns).
    *   Update `generateReport` to handle the specific report types requested by the Ronda dashboard.
2.  **Update `server/routes/aiAnalyticsRoutes.js`**:
    *   Mount the new routes: `/dashboard-summary`, `/charts/:type`, `/generate-report`.
    *   **Fix 403 Forbidden**: Update existing routes (`/clerk-insights`, etc.) to explicitly allow `ROLES.ADMIN` so admins can access them.

### Frontend Changes
1.  **Update `client/src/pages/RondaAnalytics.jsx`**:
    *   Change the API endpoint prefix from `analytics/` to `ai-analytics/`.
2.  **Update `client/src/components/Sidebar.jsx`**:
    *   Fix the **"double active" tab bug** where "Reports" and "AI Insights" are highlighted simultaneously.
    *   Replace `NavLink` with programmatic navigation (`useNavigate`) and apply styling based on the custom `isActive` logic that correctly handles query parameters (e.g., `?tab=ai`).

This ensures the AI services work, the database is queried correctly, and the UI navigation state is accurate.