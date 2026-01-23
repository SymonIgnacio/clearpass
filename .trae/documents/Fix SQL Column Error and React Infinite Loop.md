I will fix the SQL error in the program controller and resolve the React infinite loop and prop warnings in the Resident Blotter Report page.

### Server-Side Fixes

1. **Fix** **`programController.js`**:

   * Update the SQL query in `getAll` and `getById` functions.

   * Replace `COUNT(pp.participant_id)` with `COUNT(pp.id)` to match the actual database schema (table `program_participants` uses `id` as PK).

### Client-Side Fixes

1. **Fix Infinite Loop in** **`ResidentBlotterReport.jsx`**:

   * Modify the `useEffect` hook that fetches initial data.

   * Remove `saveDraft` and `loadDraft` from the dependency array to prevent the cycle: `formData` update -> `saveDraft` recreation -> `useEffect` trigger -> `formData` update.
2. **Fix Prop Type Warnings in** **`ResidentBlotterReport.jsx`**:

   * Locate UI components (like `TextField` or `FormControl`) receiving string values for the `disabled` prop.

   * Convert them to boolean values (e.g., `disabled={true}` instead of `disabled="true"`).

### Verification

<br />

* Verify the `/api/programs` endpoint returns data without SQL errors.

* Verify the Resident Blotter Report page loads without crashing or console warnings.

* Check that the infinite loop (429 Too Many Requests) is resolved.

