I will address the issue where approved/rejected applications disappear and repopulate the test data.

### **1. Fix Backend (`server/routes/secretaryRoutes.js`)**
The current backend endpoint `/applications` strictly filters for `status = 'pending'`, which is why approved or rejected applications are never returned to the frontend.
- **Action**: Update the `GET /applications` route to accept a `status` query parameter (e.g., `?status=approved`) so it can return applications based on the requested tab.

### **2. Fix Frontend (`client/src/pages/DocumentVerification.jsx`)**
The frontend currently fetches applications once on load without specifying a status, and the tab switching only filters locally (or doesn't filter at all if the data isn't there).
- **Action**: Update `fetchApplications` to pass the current `filterStatus` to the API.
- **Action**: Add `filterStatus` to the `useEffect` dependency array so the data automatically refreshes when you switch tabs.

### **3. Repopulate Data (`server/scripts/repopulate_db.js`)**
You requested to repopulate data to test the feature.
- **Action**: I will run the existing `repopulate_db.js` script, which is already configured to generate a mix of pending, approved, and rejected applications. This will provide a clean slate with comprehensive test data.

### **Verification Plan**
1.  Apply code fixes.
2.  Run the repopulation script.
3.  You can then verify in the UI that:
    *   "Pending" tab shows pending apps.
    *   "Approved" tab shows approved apps.
    *   "Rejected" tab shows rejected apps.
    *   Approving a pending app moves it correctly to the Approved tab.
