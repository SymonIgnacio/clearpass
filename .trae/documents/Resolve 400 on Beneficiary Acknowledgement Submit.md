## Goal
Ensure beneficiary documents never appear in Residency Verification and are only surfaced via Beneficiary Validation, for all beneficiary claim types.

## Server-Side Filtering (Single Change Point)
- Create a constant list of beneficiary document types used by uploads:
  - '4Ps Proof','PWD ID (Front)','PWD ID (Back)','Senior ID (Front)','Senior ID (Back)','Solo Parent ID (Front)','Solo Parent ID (Back)','OSY Certification'
- Update /api/secretary/resident-documents query to exclude all of the above explicitly:
  - Replace current NOT IN ('4Ps Proof','PWD ID','Senior ID','Solo Parent ID','OSY Certification') with NOT IN (the full constant list including Front/Back variants)
  - Apply the same exclusion to the union SELECT if needed (resident_documents only; application_documents typically aren’t beneficiary docs)

## Consistency Guard
- Reference the same constant from the beneficiary upload controller to keep naming aligned and prevent future drift.
- No UI changes; no behavior changes in Beneficiary Validation. Only Residency Verification list is filtered.

## Verification
- Manual: Submit claims for PWD and Senior with Front/Back. Confirm they do NOT appear in Residency Verification and DO appear in Beneficiary Validation.
- Automated: Add a server test that seeds resident_documents with beneficiary doc types and asserts the residency-documents endpoint excludes them.

## Notes
- No pattern/LIKE matching used to avoid false positives; explicit names ensure clean separation between the pages.
- All beneficiary claims handled identically by the filter.

## No Further Questions
- You confirmed no extra beneficiary labels. We will proceed with explicit-type filtering only.