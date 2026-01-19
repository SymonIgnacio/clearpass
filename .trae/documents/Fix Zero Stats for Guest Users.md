I have resolved the issue where the dashboard was still showing "0" pending requests.

**Root Cause:**
My previous fix only checked for `Residency_Status === 'Pending Verification'`. However, as your screenshot confirms, your status is currently displayed as **"Guest"**. The backend returns "Guest" for users who have not yet submitted a resident application, so the placeholder request was not being injected.

**Fixes Applied:**
1.  **Expanded Placeholder Logic**: I updated `ResidentDashboard.jsx` to inject the "Verification Request" placeholder if the status is **'Guest'** OR **'Pending Verification'**.
2.  **Updated Stats Calculation**: I updated the counting logic to ensure that the placeholder status (`'Pending Upload'`) is correctly counted towards the "Pending Requests" total.

**Outcome:**
The dashboard should now display **1 Pending Request** (representing your need to upload proof of residency) and list "Residency Verification" in the recent requests table. This aligns with the "Verification Required" banner you are seeing.