# Overlooked Bug: Lack of Certificate Status Audit Logging

I have identified a **traceability gap** (if not a hard bug) in the Certificate Request system.

## 1. The Issue: No History of Status Changes
- **Location**: `server/controllers/certificateRequestController.js` (`updateRequestStatus`)
- **The Gap**: When an admin approves or rejects a request, the system updates the `document_requests` table in place.
    - It sends a notification (good).
    - But it **does not log** the action in an audit trail (e.g., `audit_logs` table).
- **Why this matters**: If a certificate is mysteriously rejected or approved, there is no permanent record of *who* did it and *when* (other than the `updated_at` timestamp which is overwritten on the next change).

## 2. The Fix: Add Audit Logging
- I will modify `updateRequestStatus` to log the event to the `audit_logs` table (or similar) using the existing `logAuditToDatabase` utility if available, or a direct insert.
- **Bonus Fix**: The controller currently relies on `global.createNotification` which might be fragile (as seen in the admin controller bug earlier). I will ensure it is robustly implemented.

## Plan Execution
1.  **File**: `server/controllers/certificateRequestController.js`
2.  **Action**: Inject audit logging into the `updateRequestStatus` method.

This ensures accountability for all official document actions.
