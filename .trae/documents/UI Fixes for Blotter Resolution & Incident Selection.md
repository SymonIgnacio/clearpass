# UI Fixes & Incident Selection Improvement

I will address the UI issues in the Resolution Dialog and improve the incident type selection in the Complaint form.

## 1. Resolution Dialog UI Fixes
- **Refactor `Blotter.jsx`**:
    - Fix the layout of the Resolution Dialog to prevent overlapping fields (as seen in the screenshot with the date picker).
    - Ensure `InputLabel` in `FormControl` works correctly with `Select` components by setting the correct `id` and `labelId` props.
    - Remove the redundant "Outcome" select dropdown since the action buttons ("Settled" vs "Failed") already determine the outcome.
    - Improve spacing and alignment using `Grid` and proper MUI spacing props.

## 2. Improve Incident/Law Selection
- **Refactor `Blotter.jsx`**:
    - Replace the simple `Select` for "Incident Type" with a **grouped** selection menu.
    - Use `ListSubheader` to display categories (e.g., "Offenses Against Persons", "Property") clearly.
    - This will make it much easier for users to find the correct law/offense from the list.

## 3. Verification
- Verify the Resolution Dialog looks clean, with no overlapping text or misaligned inputs.
- Verify that the "Incident Type" dropdown shows grouped options with clear headers.
