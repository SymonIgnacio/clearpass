I have identified the root cause of the "Unknown column 'fee'" error and prepared a plan to remove all fee-related logic from the system as requested.

### Root Cause
The error `Error: Unknown column 'fee' in 'field list'` occurs in `CertificateRequestController.js` because the SQL query explicitly selects the `fee` column from `certificate_types`, but this column does not exist in your database schema.

### Plan: Complete Removal of Fees

1.  **Backend Fix (Immediate Priority)**
    *   **File:** `server/controllers/certificateRequestController.js`
    *   **Action:** Remove `fee` from the SQL query in `getAvailableTemplates` (Lines 28-30) and remove all logic that merges fee data into the response. This will fix the crashing error.
    *   **Files:** `server/controllers/certificateTypeController.js`, `server/routes/certificateTypeRoutes.js`
    *   **Action:** Remove fee fields from CRUD operations (create/update certificate types).

2.  **Database Cleanup**
    *   **Action:** Create a migration script to formally drop `fee`, `fee_amount`, and `fee_paid` columns from `certificate_types` and `certificates_log` tables to ensure schema consistency.
    *   **Action:** Remove fee-related data from `ai_chatbot_faq` to prevent the AI from mentioning prices.

3.  **Frontend Removal**
    *   **Files:** `client/src/pages/DocumentsDashboard.jsx`, `client/src/pages/CertificateRequest.jsx`, `client/src/pages/ResidentCertificates.jsx`
    *   **Action:** Remove all UI elements that display fees (e.g., "₱50.00", "Fee: Free", Payment Status columns).
    *   **Action:** Remove fee-related state variables and props.

4.  **AI Service Update**
    *   **File:** `ai_service/chatbot_data.py`
    *   **Action:** Remove the `fee_inquiry` intent and sanitize responses to ensure the chatbot no longer discusses costs.

I will start by fixing the backend controller to resolve the immediate crash, then proceed with the database migration and frontend cleanup.