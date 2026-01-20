I will implement the requested "Smart Search" feature for manual certificate issuance by integrating the existing `SmartResidentSearch` component into `DocumentsDashboard.jsx`.

### Implementation Plan
1.  **Modify `DocumentsDashboard.jsx`**:
    -   Import `SmartResidentSearch` from `../components/SmartResidentSearch`.
    -   Replace the manual "Resident Name" `TextField` with `<SmartResidentSearch />`.
    -   Implement the `onSelect` handler for `SmartResidentSearch` to auto-fill the following fields in `certificateFormData`:
        -   `manual_resident_name`: Combined First + Last Name.
        -   `manual_address`: Full address (Sitio + Barangay).
        -   `resident_id`: The resident's ID (linking the manual issue to a record if available).
    -   Add a "Clear" button or logic to reset the form if the user wants to switch back to manual typing (optional, but good UX).

### Expected Outcome
-   When an admin types a name in the "Resident Name" field, they will see a dropdown of matching residents.
-   Clicking a resident will instantly populate the "Address" field and standardize the name format, reducing data entry errors.
-   The "Manual" workflow remains available for non-residents, but is significantly faster for registered residents.