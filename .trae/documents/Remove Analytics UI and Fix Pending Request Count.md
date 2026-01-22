I will perform the following actions to address your requests:

1.  **Remove Document Analytics UI**:
    -   In `client/src/pages/DocumentsDashboard.jsx`, I will remove the "Document Analytics" tab and its corresponding content section (charts and graphs).
    -   I will preserve the "Stats Overview" cards at the top of the dashboard as they provide essential summary data (Total Certificates, Active Templates) rather than deep analytics.

2.  **Fix Pending Requests Count in Reports**:
    -   In `server/controllers/adminController.js`, I will modify the `getCertificatesReport` function.
    -   Currently, it attempts to count pending certificates from the `certificates_log` table (which mainly stores issued certificates).
    -   I will update it to query the `document_requests` table for items with `status = 'pending'`, ensuring the report accurately reflects the pending requests (like the 2 you mentioned).

**Files to be modified:**
-   `client/src/pages/DocumentsDashboard.jsx`
-   `server/controllers/adminController.js`