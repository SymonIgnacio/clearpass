## Problems
- Incident column shows blank because the DB enum stored an empty string when the submitted value didn’t match the allowed set.
- Action buttons fail due to CORS preflight rejecting PATCH.

## Changes
1) Server: allow PATCH via CORS
- Update CORS middleware to include methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Ensure preflight is handled globally.

2) Server: include description_text in officer list API
- Update listRequests SELECT to return description_text.
- This allows UI fallback when incident_type is empty.

3) Client: robust incident display
- In Requests.jsx and resident history, show incident_type if truthy; otherwise show a short snippet from description_text (e.g., first 40 chars).

4) Client: eye icon already added; keep as-is.

5) Optional hardening
- Add a lightweight keyword mapping on submit to set an allowed incident_type when resident leaves it blank; otherwise keep description-only.

## Verification
- Reload /officer/requests: Incident shows either type or description snippet; Complainant name present.
- Click Validate/Approve/Reject: no CORS error; actions succeed.
- Resident history still displays correctly.

## Notes
- No schema changes needed; we only broaden CORS and add description_text for fallback. Proceeding after approval.