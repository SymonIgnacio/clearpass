I will optimize the manual certificate issuance form by automating the "Certificate Type" field and fixing the compressed resident search placeholder.

### Changes to `DocumentsDashboard.jsx`

1.  **Automate "Certificate Type" Selection**:
    -   Update the Template `Select` component's `onChange` handler.
    -   When a template is selected, find the corresponding template object.
    -   Automatically set `certificateFormData.manual_certificate_type` to the template's `template_name` (or `document_type` if preferred).
    -   Remove the manual "Certificate Type" `TextField` from the UI since it is now redundant.

2.  **Fix Compressed Placeholder**:
    -   Update the `SmartResidentSearch` component usage.
    -   Change the `label` prop from `"Resident Name (Search)"` to `"Search Resident"` to fit better within the grid layout.

### Expected Outcome
-   Selecting a template (e.g., "Barangay Clearance") will automatically set the certificate type in the background.
-   The form will be cleaner with one less manual input field.
-   The resident search field will display a clear, un-truncated label.