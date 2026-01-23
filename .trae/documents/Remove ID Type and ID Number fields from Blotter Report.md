I will remove the "ID Type" and "ID Number" fields from the Resident Blotter Report form as requested.

**Planned Changes:**

1.  **Modify `client/src/pages/ResidentBlotterReport.jsx`**:
    *   Remove the `ID_TYPES` constant definition.
    *   Remove `complainant_id_type` and `complainant_id_number` from the `formData` initial state.
    *   Delete the UI components (Grid items) for the "ID Type" dropdown and "ID Number" text field.
    *   Remove the logic in `handleSubmit` that appends these fields to the form data payload.

This will remove the two fields shown in your screenshot from the interface.