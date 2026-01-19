I will modify the "Residency Verification" logic to exclude beneficiary documents, ensuring they are separated from general residency proofs.

### **Root Cause**
The `GET /resident-documents` endpoint currently fetches **all** documents from `resident_documents` (and `application_documents`) that match the requested status (e.g., 'pending'). It does not filter by `document_type`. Since beneficiary proofs (PWD ID, Senior ID, etc.) are stored in the same table, they appear in the same list.

### **Implementation Plan**
1.  **Modify `server/routes/secretaryRoutes.js`**:
    *   Update the SQL query in the `/resident-documents` route (lines 524-541).
    *   Add a `WHERE` clause to **exclude** known beneficiary document types (`4Ps Proof`, `PWD ID`, `Senior ID`, `Solo Parent ID`, `OSY Certification`).
    *   This ensures only actual residency proofs (like 'Barangay ID', 'Proof of Residency') appear in the "Residency Verification" list.

2.  **Verify/Create Beneficiary Verification Endpoint (Optional/Future)**:
    *   Since the user specifically asked to fix the *Residency Verification* view, hiding these documents is the primary fix.
    *   (Note: Ideally, there should be a separate "Beneficiary Verification" page that *includes* only these types, but I will focus on cleaning up the current view as requested).

This change will prevent beneficiary claims from cluttering the residency verification queue.