# Verification & Fix Plan: Document Template Flow

I have confirmed a mismatch between the Resident Portal (which uses "Title Case" names like "Barangay Clearance") and the Document Template system (which uses "snake_case" keys like `barangay_clearance`). Additionally, some templates exist (Indigency) but are not available for residents to select.

I will fix this to ensure the "Verify" request passes.

## 1. Database Updates
- **Update `certificate_types`**:
    - Add a `code` column (e.g., `barangay_clearance`) to explicitly link to templates.
    - Insert missing types: "Indigency Certificate" and "Bonafide Certificate" so residents can actually request them.

## 2. Backend Logic Update (`documentController.js`)
- **Smart Template Lookup**: Update `_generateFromTemplate` logic to:
    1.  Try finding a template by exact match (e.g., "Barangay Clearance").
    2.  If failed, normalize the request type to snake_case (e.g., "barangay_clearance") and try again.
    - This ensures existing requests work without breaking changes to the frontend.

## 3. Verification
- I will create a script `scripts/verify_flow.js` that:
    1.  Creates a mock request with type "Barangay Clearance".
    2.  Attempts to generate a document, expecting it to find the `barangay_clearance` template.
    3.  Validates that the output contains the resident's name (proving the mapping worked).

This will fully enable the flow: **Upload Template -> Resident Selects Type -> System Generates Document**.
