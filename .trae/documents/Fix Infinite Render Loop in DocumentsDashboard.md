I have identified the cause of the "Maximum update depth exceeded" error. It is due to an infinite loop in a `useEffect` hook within `DocumentsDashboard.jsx`.

### The Problem
The `useEffect` at lines 178-200 updates the `extractedPlaceholders` state.
1.  When `selectedCertificateTemplate` is falsy (e.g., initially or when cleared), the `else` block runs:
    ```javascript
    } else {
      setExtractedPlaceholders([]); // Creates a NEW array reference []
      setDynamicFields({});
    }
    ```
2.  `extractedPlaceholders` is in the dependency array `[selectedCertificateTemplate, templates, extractedPlaceholders]`.
3.  Setting the state to a *new* empty array `[]` triggers a re-render.
4.  The `useEffect` runs again because `[] !== []` (referential equality check fails).
5.  It sets the state again, causing an infinite loop.

### The Fix
I will modify `DocumentsDashboard.jsx` to:
1.  **Remove `extractedPlaceholders` from the dependency array**. It is not needed as a dependency because we are only reacting to changes in `selectedCertificateTemplate` or `templates`.
2.  **Add a check** to ensure we only update the state if the value actually changes (using `JSON.stringify` comparison or length check), especially for the empty array case.

### Plan
1.  **Edit `DocumentsDashboard.jsx`**:
    *   Locate the `useEffect` at line 178.
    *   Refactor the logic to strictly compare the new placeholders with the current state before calling `setExtractedPlaceholders`.
    *   Specifically fix the `else` block to only set state if `extractedPlaceholders.length > 0`.

This will resolve the React error and unblock the admin interface. I will then verify the fix by checking if the loop condition is removed.