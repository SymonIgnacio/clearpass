I will replace the simple incident type list in the resident blotter form with the categorized dropdown menu used in the admin interface.

### **Plan**
1.  **Modify `ResidentBlotterReport.jsx`**:
    -   Import `ListSubheader` from `@mui/material`.
    -   Add `INCIDENT_CATEGORIES` constant (copied from `Blotter.jsx` to ensure consistency).
    -   Add `customIncidentType` to the `formData` state.
    -   Implement `incidentOptions` using `useMemo` to flatten and categorize the options.
    -   Replace the existing `Autocomplete` component with the grouped version:
        -   Use `groupBy` prop to categorize options.
        -   Use `renderGroup` to style category headers.
        -   Handle "Others" selection logic to show/hide a custom text input.
    -   Update `handleSubmit` to send the correct incident type (either selected option or custom input).

This will provide residents with the same organized, professional filing experience as the admin staff.