I have identified a critical bug in the `SmartComplainantInput` component that causes it to fail when selecting a resident, and potentially crash if data is malformed.

**The Issue:**
1.  **Missing Property:** The component fetches residents but fails to tag them with `isResident: true`.
2.  **Logic Failure:** When you select a resident, the `handleChange` function checks `if (newValue.isResident)`. Since this property is missing, it falls into the `else` block and calls `onChange(null)`, immediately clearing your selection or causing invalid state in the parent.
3.  **Potential Crash:** The `renderTags` function is defined but unnecessary for single-select mode, which can cause internal errors in some Material UI versions.

**The Fix:**
1.  **Update `SmartComplainantInput.jsx`**:
    *   Add `isResident: true` to the mapped resident objects.
    *   Remove the unnecessary `renderTags` function.
    *   Add defensive checks to prevent crashes if resident data is incomplete.
2.  **Verify**: This will ensure that clicking a resident correctly populates the form instead of triggering an error or clearing the field.

I will apply these fixes immediately.
