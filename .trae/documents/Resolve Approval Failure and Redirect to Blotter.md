## Issues
- Approve still 500: case number allocation depends on blotter_case_sequences; if missing, allocation throws and approval fails.
- After approve, you want the case to appear in Blotter Records with status Pending and navigate there.

## Changes
1) Robust case-number allocation
- Update allocateBlotterCaseNumber to gracefully handle missing sequences table: on error, compute next sequence via MAX(RIGHT(Case_Number,4)) for the month and return a valid BLOT-YYYY-MM-#### without using blotter_case_sequences.
- Keep transaction safety; if fallback path is used, skip sequence table writes.

2) Server error clarity (minimal)
- In setStatus approve path, include the error message when returning 500 so UI logs show the cause if it ever fails again.

3) Frontend UX
- After successful approve, navigate to /blotter and display a success toast, so users immediately see the new Pending case in Blotter Records.

## Verification
- Approve a request with blank incident_type (already handled) and with sequences table missing; approve succeeds and creates a blotter case.
- User is redirected to Blotter Records; the new case appears with status Pending.
- If any future allocator error occurs, it surfaces in the console to aid debugging.

## Notes
- No schema changes required; this focuses on resilience and UX. If you prefer creating the sequences table automatically, I can add a CREATE TABLE IF NOT EXISTS step instead of pure fallback.