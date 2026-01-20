# Fix Dynamic Placeholder Display for Seeded Templates

The current issue is that the system only looks for placeholders in the `template_content` (used for text-based templates), but seeded templates (like "Business Closure" or "Low Income Housing") are binary `.docx` files whose placeholders are stored in the `required_fields` database column.

I will update `client/src/pages/DocumentsDashboard.jsx` to prioritize `required_fields` when generating the dynamic form.

## Implementation Steps

1.  **Update `extractPlaceholders` function**:
    - First, check if `template.required_fields` exists.
    - If present, parse it (if it's a string) and extract the `key` from each field definition.
    - If `required_fields` is missing or empty, fall back to the existing regex logic that scans `template.template_content`.

2.  **Update `useEffect` for `selectedCertificateTemplate`**:
    - Ensure it uses the updated `extractPlaceholders` logic to populate `extractedPlaceholders`.
    - Initialize `dynamicFields` state based on these keys.

## Verification
- I will verify that selecting "Low Income Housing" or "Business Closure" now displays the correct input fields (e.g., `business_name`, `closure_date`) derived from the database's `required_fields` column.
