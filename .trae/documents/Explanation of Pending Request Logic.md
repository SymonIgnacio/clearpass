# Remove Mock Verification Request

## 1. Clean up ResidentDashboard.jsx
- [ ] **Remove Logic**: Delete the code block that injects the "Residency Verification" mock object into the `requests` array.
- [ ] **Verify**: Ensure the "Recent Requests" list is empty (shows "No requests yet") for Guest users, and the Pending count returns to 0.
