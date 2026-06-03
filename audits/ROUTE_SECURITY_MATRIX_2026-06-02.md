# ClearPass Route Security Matrix

Created: 2026-06-02
Source checklist: `audits/FULL_AUDIT_PHASE_CHECKLIST_2026-06-01.md`

This matrix tracks role, ownership, MFA, and audit expectations for sensitive routes. It should be expanded whenever new routes with path IDs or privileged writes are added.

| Route or family | Method | Required role(s) | Ownership rule | MFA expectation | Audit expectation | Current status |
|---|---:|---|---|---|---|---|
| `/api/debug/users` | GET | None | N/A | N/A | N/A | Removed. Regression verifies route unavailable and no password hashes exposed. |
| `/api/documents/requests/:request_id/download` | GET | Resident owner, admin, secretary, clerk | Resident can only download own request; allowed staff can download resident documents | Not required for download | Document download should remain auditable when download audit hooks are present | Implemented owner/staff authorization and regression tests. |
| `/api/certificate-requests/:request_id/attachment/:type` | GET | Admin, secretary, clerk | Staff-only; resident self-access should be explicitly reviewed before enabling | Not required for read-only staff download | Attachment access should be auditable | Needs ownership/read policy review for resident-facing access. |
| `/api/residents/:id/documents/:docId/download` | GET | Admin, captain, secretary, clerk, resident | Resident access must match own resident ID and requested document | Not required for read-only download | Document download should be auditable | Existing tests cover resident document download paths; keep in IDOR sweep. |
| `/api/residents/:id` | GET | Admin, captain, secretary, clerk | Staff read; resident self-read should use `/api/residents/me` | Not required | Optional read audit | Needs route-by-route IDOR verification. |
| `/api/residents/:id` | PUT | Admin, secretary, clerk | Staff write only; captain read-only middleware enforced | Required for resident verification and sensitive profile changes | Required | MFA enforced on verification workflows; broader profile-change MFA remains a future policy decision. |
| `/api/residents/:id` | DELETE | Admin, secretary | Staff archive only | Required | Required | Staff-only authorization present; add MFA if resident deletion is kept as a high-risk operation. |
| `/api/residents/verification/upload` | POST | Authenticated resident | Authenticated user's resident ID only | Not required | Upload event recommended | Content magic-byte validation implemented and tested. |
| `/api/certificate-requests/submit` | POST | Resident, admin | Resident submits own request; admin-assisted submissions need explicit resident binding | Not required | Request creation audit recommended | Upload content validation implemented and tested. |
| `/api/documents/requests/:id` | PUT | Admin, secretary, clerk | Staff status update only | Required for approval/rejection | Required | MFA enforced and covered by pending-MFA regression. |
| `/api/auth/mfa/request` | POST | Authenticated MFA-required roles | User can request only own MFA challenge | N/A | MFA request audit required | Staff/resident MFA flow tests present. |
| `/api/auth/mfa/verify` | POST | Authenticated pending-MFA user | User can verify only own challenge | N/A | MFA verify/fail audit required | Staff/resident MFA flow tests present. |
| `/api/ai/patrol` | POST | Admin, captain, blotter officer | N/A | Not required | AI analysis audit required when AI service runs | RBAC regression covers allowed/blocked roles. |
| `/api/ai/priority` | POST | Admin, secretary, clerk, captain | Staff-only calculation | Not required | AI priority audit required when AI service runs | RBAC tests still needed. |
| `/api/ai/health` | GET | Admin | N/A | Not required | Optional operational audit | RBAC tests still needed. |
| `/api/system-admin/backup` | POST | Admin | N/A | Required | Required | MFA enforced and covered by pending-MFA regression. |
| `/api/system-admin/settings` | PUT | Admin, secretary | N/A | Required | Required | MFA enforced and covered by pending-MFA regression. |
| `/api/system-admin/upload-seal` | POST | Admin, secretary | N/A | Required for production settings changes | Required | Content magic-byte validation implemented and tested. |
| `/api/admin/users` | GET/POST/PUT | Admin | N/A | Required for user/role management writes | Required | MFA enforced for user/staff/role management writes. |
| `/api/admin/reports/security` | GET | Admin | N/A | Required for export/download variants | Required for export | MFA enforced and covered by pending-MFA regression. |

## Parameterized Route Audit

Completed: 2026-06-02

This sweep covered route definitions with `:id`, `:resident_id`, `:request_id`, `:docId`, and `:caseNumber` under `server/routes` and the legacy `server/routes.js` fallback.

| Route or family | Method | Primary risk | Current status |
|---|---:|---|---|
| Legacy `/admin/users/:id` | PUT/DELETE | Privileged user mutation | Admin-only and MFA enforced in legacy fallback. |
| Legacy `/admin/roles/:id` | PUT/DELETE | Privileged role mutation | Admin-only and MFA enforced in legacy fallback. |
| Legacy `/admin/staff/:id` | PUT/DELETE | Privileged staff mutation | Admin-only and MFA enforced in legacy fallback. |
| Legacy `/admin/verify-resident/:id` | PUT | High-risk resident verification | Admin/secretary/clerk and MFA enforced in legacy fallback. |
| `/api/admin/staff/:id` | PUT/DELETE | Privileged staff mutation | Admin-only and MFA enforced. |
| `/api/admin/roles/:id` | PUT/DELETE | Privileged role mutation | Admin-only and MFA enforced. |
| `/api/admin/verify-resident/:id` | PUT | High-risk resident verification | Admin/secretary/clerk and MFA enforced. |
| `/api/admin/reports/pdf/:type` | GET | Report type path selection | Staff report authorization applies; keep input validation review in Phase 5. |
| `/api/announcements/:id` | PUT/DELETE | Announcement mutation | Staff authorization applies; no resident ownership risk. |
| `/api/blotter/:caseNumber` | PUT/DELETE | Case mutation by path key | Staff authorization applies; officer-specific ownership should remain explicit where needed. |
| `/api/case-management/case/:case_id` | GET | Case lookup by path key | Staff case-management authorization applies. |
| `/api/case-management/case/:case_id/status` | PUT | Case status mutation | Staff case-management authorization applies; audit logging recommended. |
| `/api/case-management/case/:case_id/note` | POST | Case note mutation | Staff case-management authorization applies; audit logging recommended. |
| `/api/case-management/case/:case_id/qr` | GET | Case QR retrieval | Staff case-management authorization applies. |
| `/api/case-management/attendance/:hearing_id` | POST | Attendance mutation | Staff case-management authorization applies; audit logging recommended. |
| `/api/case-management/attendance-report/:hearing_id` | GET | Hearing report access | Staff case-management authorization applies. |
| `/api/certificate-requests/:request_id/cancel` | PUT | Cross-resident cancellation | Uses token resident ID in update scope; negative regression added. |
| `/api/certificate-requests/:request_id/attachment/:type` | GET | Attachment access | Staff-only route; resident-facing access requires separate ownership design before enabling. |
| `/api/certificate-requests/:request_id/status` | PUT | Staff status mutation | Staff-only and MFA enforced. |
| `/api/certificates/:id` | DELETE | Certificate deletion | Admin/secretary/clerk authorization applies; audit logging recommended. |
| `/api/documents/requests/:request_id/download` | GET | Cross-resident document download | Owner/staff authorization enforced; IDOR regression exists. |
| `/api/documents/requests/:id` | PUT | Staff approval/rejection | Staff-only and MFA enforced. |
| `/api/notifications/:id/read` | PUT | Cross-user notification mutation | Route should scope update by authenticated user; add focused regression in Phase 7. |
| `/api/officer/cases/:caseNumber/resolve` | PUT | Officer case mutation | Officer authorization applies; assignment scoping should remain explicit where needed. |
| `/api/officer/cases/:caseNumber/status` | PUT | Officer case mutation | Officer authorization applies; assignment scoping should remain explicit where needed. |
| `/api/programs/:id` | GET/PUT | Program lookup/mutation | Staff authorization applies for mutation; public/read policy should stay intentional. |
| `/api/residents/:id` | GET/PUT | Resident profile lookup/mutation | Staff-only path; resident self-access uses `/me`. |
| `/api/residents/:id/status` | PUT | Resident status mutation | Staff authorization applies; audit logging recommended. |
| `/api/residents/:id/generate-qr` | POST | Resident QR generation | Staff authorization applies. |
| `/api/residents/household/:id/members` | GET | Household member lookup | Staff authorization applies; no resident self-access through arbitrary ID. |
| `/api/residents/:id/documents` | GET | Cross-resident document listing | Resident ownership enforced and negative regression added. |
| `/api/residents/:id/documents/:docId/download` | GET | Cross-resident document download | Resident ownership and document resident scope enforced; negative regression added. |
| `/api/residents/:id/blotter-history` | GET | Cross-resident blotter history | Resident ownership enforced and negative regression added. |
| `/api/system-admin/assets/:type/latest` | GET | Asset type path selection | Read-only asset lookup; keep allowed type validation. |

## Remaining Matrix Work

- Add focused ownership regression for `/api/notifications/:id/read` in Phase 7.
- Add audit-log coverage for privileged case, certificate, and resident-status mutations in Phase 7.
- Keep this file in sync with route changes and checklist phase updates.
