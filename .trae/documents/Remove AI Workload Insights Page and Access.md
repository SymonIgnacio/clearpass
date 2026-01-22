I will remove the "AI Workload Insights" / "Clerk Forecast" page and its access points as requested.

### **1. Remove from Sidebar**
- **File**: `client/src/components/Sidebar.jsx`
- **Action**: Remove the "Clerk Forecasts" menu item from the `Analytics` section in the `menuStructure`.

### **2. Remove from Main Dashboard (Clerk Dashboard)**
- **File**: `client/src/pages/dashboards/ClerkDashboard.jsx`
- **Action**:
  - Remove the "View Workload Forecasts" button from the Quick Actions card.
  - Remove the `View Forecasts` case in `handleQuickAction` function.

### **3. Disable Route Access**
- **File**: `client/src/App.jsx`
- **Action**: Remove the route definition for `/clerk/ai-insights`. This ensures that even if someone has the direct link, they cannot access the page (it will fallback to 404 or redirect).

### **Verification**
- I will ensure that the backend logic (`aiAnalyticsController.js`) remains untouched, preserving the underlying data fetching capabilities as requested.
- I will verify that no role (Admin or Clerk) can access the page through the UI or URL.
