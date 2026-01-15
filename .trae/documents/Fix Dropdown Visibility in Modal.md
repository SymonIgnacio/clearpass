I will fix the dropdown visibility issue by adjusting the Autocomplete component configuration to work correctly within a Modal context.

**Steps:**

1. **Update** **`SmartResidentSearch.jsx`**:

   * Add `disablePortal` prop to the `Autocomplete` component. This ensures the dropdown renders within the Dialog's layer stack, preventing it from being hidden behind the modal or clipped.

   * Ensure `filterOptions` is correctly set to pass through server results without client-side re-filtering.

2. **Verification**:

   * The user can then retry typing "Anna". The dropdown list should appear visibly on top of the form.

