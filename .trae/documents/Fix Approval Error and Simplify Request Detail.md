## Issues
- 500 on approve: blotter Incident_Type is ENUM; request has empty incident_type, causing insert failure.
- UI: remove “Add Note”, “Request Info”, and note placeholder as requested.

## Changes
1) Server: make incident_type safe on approve
- In approveRequest, use a valid fallback when incident_type is empty (default to 'Unjust Vexation').
- Keep existing request description as Narrative.

2) Client: simplify RequestDetail
- Remove the note TextField, Add Note button, and Request Info button.
- Keep Approve and Reject actions only.

## Verification
- Approve a request with blank incident_type → blotter row inserts successfully with fallback type.
- Detail page shows only Approve/Reject; no placeholders or extra actions.

## Notes
- This is a minimal fix focused on reliability and your requested UI simplification.
- If you prefer a different default incident type or keyword mapping from description, I can adjust after this change.