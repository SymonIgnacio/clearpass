I have identified the issue. The "Issued At" and "Prepared By" options are missing from the `SYSTEM_FIELDS` list in `TemplateUploadWizard.jsx`. This causes the wizard to treat these placeholders as manual user inputs instead of offering the "System (Auto-fill)" option.

### Plan

1.  **Update `SYSTEM_FIELDS` in `TemplateUploadWizard.jsx`**
    *   Add `{ value: 'issued_at', label: 'Issued At (Location)' }` to the list.
    *   Add `{ value: 'prepared_by', label: 'Prepared By (Staff Name)' }` to the list.
    *   Add `{ value: 'ctc_no', label: 'CTC Number (Auto)' }` and `{ value: 'or_no', label: 'OR Number (Auto)' }` explicitly to ensuring they map correctly if not already fully covered.

2.  **Verify Auto-Detection Logic**
    *   Ensure that when the wizard detects `{issued_at}` or `{prepared_by}` in a template, it automatically maps them to these new system fields.

This will fix the dropdown menu in the "Configure Fields" step, allowing you to select these fields as auto-filled values.