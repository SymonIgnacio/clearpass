## Change Summary
- Hide actions in officer Requests list when status is rejected (show only View).
- Add resident notifications:
  - On validation start: "Validating the request and under investigation"
  - On approve: notify with case number
  - On reject: notify with provided reason
- Add a rejection modal to capture a reason before rejecting.

## Implementation
1) UI: conditional actions & rejection modal
- In [Requests.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/Requests.jsx):
  - Render only the eye icon when `r.status === 'rejected'`.
  - Add local state `rejectOpen`, `rejectReason`, `activeId`.
  - On Reject click → open Dialog with TextField for reason; on confirm → call PATCH /status with `{ action: 'reject', reason }` then reload.
  - Keep View and Validate/Approve buttons for non-rejected statuses.

2) Server: resident notifications
- In [validateRequest](file:///c:/xampp/htdocs/clearpass/server/controllers/blotterRequestController.js#L165-L207): after setting for_validation, notify resident user account: title "Request Under Validation", message "Validating the request and under investigation".
- In [setStatus](file:///c:/xampp/htdocs/clearpass/server/controllers/blotterRequestController.js#L308-L339):
  - Approve: notify resident with case number.
  - Reject: notify resident with the provided reason.
- Reuse resident user lookup: `SELECT id FROM users WHERE resident_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1`.

3) Verification
- Reject modal appears, requires a reason; after rejection, officer list shows only View.
- Validation start triggers resident notification.
- Approve triggers resident notification and case appears in Blotter Records (Pending).
- Reject triggers resident notification with reason.

## Notes
- No schema changes needed; uses existing notification helpers.
- If you also want approved items to be view-only in the list, I can include that condition after this change.