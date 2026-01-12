I have analyzed `src/pages/DocumentVerification.jsx` and identified two issues causing the error and potentially another runtime error:

1.  **Missing Imports**: `ToggleButtonGroup` and `ToggleButton` are used but not imported from `@mui/material`.
2.  **Missing State**: `filterStatus` and `setFilterStatus` are used to filter applications (Pending/Approved/Rejected) but are not defined in the component's state.

I will fix these by:

1.  **Adding Imports**: Update the `@mui/material` import statement to include `ToggleButton` and `ToggleButtonGroup`.
2.  **Adding State**: Initialize `filterStatus` with a default value of `'pending'`.

### Plan
1.  Edit `client/src/pages/DocumentVerification.jsx`:
    -   Add `ToggleButton` and `ToggleButtonGroup` to the named imports from `@mui/material`.
    -   Add `const [filterStatus, setFilterStatus] = useState('pending')` inside the `DocumentVerification` component.
