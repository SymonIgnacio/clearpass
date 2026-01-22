## Scope
Implement the essential fixes to make the resident → request → validation → approve/reject flow fully functional as specified:
- Resident submits request first (not a blotter)
- Statuses: pending_review, for_validation, approved, rejected
- "For Validation" still allows approve/reject by admin/blotter officer

## Implementation Changes
1. Fix officer notification recipients on submission
- Update request submission to notify admin + blotter officer using numeric role IDs (1, 6) to guarantee delivery.

2. Add resident respond-info UI
- In My Blotter Requests, add an action to respond (message + image) when info was requested; wire to POST /api/blotter-requests/:id/respond-info.

3. Ensure approve/reject available during for_validation
- Confirm server allows PATCH /:id/status approve/reject regardless of current status; add a guard that only admin/blotter_officer can call it.

4. Improve error and feedback
- Map image-only upload error to 400 and show toasts for officer actions; keep changes minimal.

## Verification Checklist
- Resident submits → sees pending_review in history; officers get notification.
- Officer sets for_validation → can add notes/evidence and request info.
- Resident responds with message/image; officer sees audit.
- Officer approves (creates blotter) or rejects directly from for_validation.

## Notes
- CSRF alignment, FK constraints, and broader error standardization can be deferred; focus on the core process working as requested.