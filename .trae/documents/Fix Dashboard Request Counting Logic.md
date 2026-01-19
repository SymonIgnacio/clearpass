I have refactored the dashboard logic to correctly reflect the "Approved" state in the request counts.

**Root Cause:**
The stats calculation in `ResidentDashboard.jsx` was previously static. Even if a user's status changed to "Active" (Resident), the placeholder request "Residency Verification" was hardcoded with a status of "Pending Verification", so the filter logic continued to count it as "Pending".

**Fix Applied:**
I updated the filter logic in `ResidentDashboard.jsx` to be dynamic based on the user's *current* profile status (`Residency_Status`):

1.  **Pending Count**: Now checks: `r.status === 'Pending Verification' && currentProfile?.Residency_Status !== 'Active'`.
    *   This means if you represent an active resident, this item is **no longer counted as pending**.

2.  **Completed Count**: Now checks: `r.status === 'Pending Verification' && currentProfile?.Residency_Status === 'Active'`.
    *   This means if you are an active resident, this item is **now counted as completed**.

**Outcome:**
*   When your application is approved (and you become "Active"), the "Pending Requests" count will drop to 0.
*   The "Completed Requests" count will increase to 1.
*   The "Total Requests" count will remain accurate.

This ensures the numbers on your dashboard match the "Residency Application Approved" notification you received.