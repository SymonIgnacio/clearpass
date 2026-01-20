# Database & Backend Alignment Plan

I have completed the deep scan of `barangay_management (12).sql` and compared it with your backend codebase. 

## 1. Database vs. Code Alignment Findings

| Component | Database State (SQL Dump) | Backend Code State | Status |
| :--- | :--- | :--- | :--- |
| **Role IDs** | Resident = `12`, Guest = `13` | `server/config/roles.js` uses `12` & `13` | ✅ **Aligned** |
| **Blotter** | Has `complainant_resident_id` | `blotterController.js` uses this field | ✅ **Aligned** |
| **Block List** | `blotter` table status | `documentController.js` checks `blotter` for active cases | ✅ **Aligned** |
| **Certificates** | `certificates_log` (Manual) & `document_requests` (Online) | **DISCONNECTED** | ⚠️ **Misaligned** |

### 🚨 Critical "Split Brain" Issue Identified
The system currently has two separate tracks for certificates:
1.  **Online Requests**: Stored in `document_requests`. When approved, they generate a PDF but **do not** create a record in the official `certificates_log`.
2.  **Manual Issuance**: Stored in `certificates_log` (and optionally syncs to `document_requests`).

**Consequence**: The "Certificate Log" (official report) will be incomplete, missing all online-requested certificates.

## 2. Remediation Plan

I propose the following targeted fixes to unify the system:

### Phase 1: Unify Certificate Logging
**Goal**: Make `certificates_log` the Single Source of Truth for *all* issued certificates.
1.  **Modify `documentController.js`**:
    - In `approveDocumentRequest` (or `downloadDocument`), inject a record into `certificates_log` upon successful issuance.
    - Ensure `control_number` format is consistent (`CERT-...` vs `DOC-...`).

### Phase 2: Frontend Route Verification
**Goal**: Ensure Frontend uses the correct API endpoints.
1.  **Profile vs. Auth**:
    - Verify `client/src/context/AuthContext.jsx` uses `/api/auth/me` (User Account).
    - Verify `client/src/pages/resident/Profile.jsx` uses `/api/residents/me` (Resident Data).
2.  **Admin Dashboard**:
    - Ensure the Admin Dashboard displays *both* "Pending Requests" (from `document_requests`) and "Issued Certificates" (from `certificates_log`).

### Phase 3: Validation
1.  **Audit Scripts**: Re-run `audit_rbac_scan.cjs` and `audit_phase2_core.cjs` to ensure security is intact.
2.  **Logic Test**: Simulate a "Resident Request -> Admin Approval" flow and verify it appears in the `certificates_log` table.

## 3. Execution Order
1.  **Apply Fix**: Update `documentController.js` to sync with `certificates_log`.
2.  **Verify**: Check Frontend API usage.
3.  **Audit**: Run the system audit scripts.

No database schema changes are required as the code was actually more aligned than initially suspected, except for the logical disconnect in certificate logging.
