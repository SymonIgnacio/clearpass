## Status
- Attempted full migration via npm script; it failed earlier on 20260121000000_remove_fee_columns.js (certificate_types.fee) so 20260121093000_create_blotter_request_tables.js did NOT apply.

## Plan To Run Migrations
1. Guard the failing migration
- Update 20260121000000_remove_fee_columns.js to drop columns only if they exist using `await knex.schema.hasColumn('certificate_types','fee')` before `alterTable`.
- Re-run `npm run db:migrate` to proceed beyond the failure.

2. Apply blotter request tables
- Ensure 20260121093000_create_blotter_request_tables.js runs after fixing the above.
- Verify tables exist: `DESCRIBE blotter_requests;` and `DESCRIBE blotter_request_audits;` using the ClearPass DB access.

3. Verify Foreign Keys and Indexes
- Check FKs to residents, users, and blotter tables resolve without errors.
- Confirm indexes on status, complainant_resident_id, validation_assigned_officer_id.

4. Smoke Test
- Insert a sample request via API (dev) and confirm audit insert works, then approve to create a blotter case.

## Rollback / Safety
- No destructive changes to existing blotter; only new tables created.
- If any FK issues occur, temporarily disable FK checks during migration window, then re-enable.

## Clarifications
- Proceed on dev DB `barangay_management` with root/no password?
- Keep the original certificate_types schema (fee, validity_days) if already present; otherwise migration will skip dropping.
- Run on staging/production after dev confirmation?