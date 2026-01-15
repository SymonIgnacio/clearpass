I have analyzed the differences between the working `SmartComplainantInput.jsx` and the problematic `SmartResidentSearch.jsx`. I will now align the implementation of `SmartResidentSearch` with the robust logic found in `SmartComplainantInput` while maintaining its specific role of selecting *only* existing residents.

Here is the plan to fix the search functionality:

## 1. Refactor `SmartResidentSearch.jsx`
I will update the component to mirror the structure and logic of `SmartComplainantInput.jsx`, which includes:
-   **Simplified State Management**: Removing complex `useMemo` and `useCallback` chains for value mapping that might be causing synchronization issues.
-   **Direct Option Mapping**: Mapping resident data directly to the format expected by `Autocomplete` within the fetch function, similar to the working component.
-   **Robust `renderOption`**: Using the same `Box` and `Typography` structure for consistent styling.
-   **Input Handling**: Adopting the `handleInputChange` logic from the working component to ensure typing updates state reliably.
-   **Value Handling**: Simplifying how the selected value is passed back to the parent component.

## 2. Key Differences to Maintain
-   **Strict Selection**: unlike `SmartComplainantInput`, `SmartResidentSearch` will *not* allow "freeSolo" manual entry. It must force selection from the list.
-   **Portal Handling**: I will keep `disablePortal={true}` to ensure it renders correctly inside the Modal/Dialog.

## 3. Verify Fix
After refactoring, I will ask you to try typing "Anna" again. The expected behavior is:
1.  Typing "Anna" triggers the loading spinner.
2.  The dropdown appears with a list of matching residents.
3.  Selecting a resident updates the input field with their full name.
