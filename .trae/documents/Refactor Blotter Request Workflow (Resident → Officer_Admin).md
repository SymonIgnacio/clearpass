## Overview
- Implement a resident → officer blotter request workflow with validation (investigation) before becoming a blotter case.
- Statuses: pending_review, for_validation, approved, rejected.
- Manual blotter creation by officers/admin remains immediate and unchanged.

## Current State (Reference)
- Resident complaint currently creates blotter rows directly [blotterComplaintController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/blotterComplaintController.js#L96-L138).

## Data Model (Requests)
- Table: blotter_requests
  - Core fields as previously specified (complainant/respondent, incident details, attachments_json, status, notes, approved_blotter_case_number).
  - Validation fields: validation_assigned_officer_id, validation_started_at, validation_due_at, validation_notes_json, validation_evidence_json.
- Table: blotter_request_audits
  - id, request_id (FK), actor_user_id (FK users), actor_role, action ENUM('submitted','assigned_validation','added_note','requested_info','resident_response','approved','rejected'), message_text|null, attachments_json|null, created_at.
  - Indexes: request_id, created_at.

## Business Flow & SLA
- Submission → pending_review; audit('submitted'); notify officers.
- Move to for_validation:
  - Only blotter_officer or admin (IT admin) can assign/start validation.
  - Set validation_due_at = start + SLA (default 5 working days); audit('assigned_validation').
  - During validation:
    - Add findings/notes and image evidence (jpeg/png/webp only, size limit) → audit('added_note').
    - Optionally request info from resident → audit('requested_info'). Resident responds with images/messages → audit('resident_response').
  - Reminder service: daily reminders to assigned officer until validation_due_at; escalate past due.
- Outcome:
  - Approve → create blotter case via existing controller; link case_number and audit('approved').
  - Reject → set rejected with reason; audit('rejected').

## API
- Resident:
  - POST /api/blotter-requests
  - GET /api/blotter-requests/my
  - POST /api/blotter-requests/:id/respond-info
- Officer/Admin (only blotter_officer and admin):
  - GET /api/blotter-requests, GET /api/blotter-requests/:id
  - PATCH /api/blotter-requests/:id/validate { assign_officer_id, due_at?, note? }
  - POST /api/blotter-requests/:id/validation/add-note { note, images[] }
  - POST /api/blotter-requests/:id/validation/request-info { message, required_fields? }
  - PATCH /api/blotter-requests/:id/status { action: 'approve'|'reject', reason? }
- Audits:
  - GET /api/blotter-requests/:id/audits (timeline view)

## Client Updates
- Resident filing/history to use new endpoints; show status badges and audit timeline; respond-info UI with image uploads.
- Officer/Admin requests list and request detail validation workspace; only blotter_officer and admin see validation actions.
- Existing Blotter page unchanged.

## Server Implementation
- New routes/controllers/services for requests and audits; mount at /api/blotter-requests.
- Role guards: verifyToken; checkRole(['blotter_officer','admin']) on validation/approval endpoints.
- File handling: image-only whitelist, size caps, virus scan hook if available.
- Input validation & sanitization on all entry points.

## Migration
- Create blotter_requests and blotter_request_audits with indexes.
- No modifications to blotter table for manual creation.

## Notifications & Reminders
- Notify officers on submission and info requests; notify residents on actions and outcomes.
- Daily reminder job for validation SLA; escalation after due date.

## Testing
- Unit/integration/UI tests covering submission, validation actions, SLA reminders, approvals/rejections, audits, role guards.

## Rollout
- Run migrations; deploy server/client; enable reminder job; verify end-to-end flows in dev and staging.

## Final Checks
- Evidence limited to pictures only; audit logs required for all validation actions; validation restricted to blotter_officer and IT admin.