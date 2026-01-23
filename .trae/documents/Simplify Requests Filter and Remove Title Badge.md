I have identified the necessary changes to address your requests.

### 1. Simplify Status Filtering
**File:** `client/src/pages/Requests.jsx`
- **Action:** Update the `<Select>` component for the Status filter (lines 469–481) to only show the requested options:
    - **Approved**
    - **Rejected**
    - **Under Validation** (`for_validation`)
    - **Pending Review** (`pending_review`)
- **Reason:** You explicitly requested to limit the filter options to these four statuses, removing "All", "Awaiting Response", and "Ready for Decision" from the dropdown.

### 2. Remove Badge Count from Title
**File:** `client/src/pages/Requests.jsx`
- **Action:** Remove the `<Badge>` component wrapping the "Blotter Requests" title (lines 426–428).
- **Reason:** You requested to remove the "1" (or any count) in the page title, so I will display just the text "Blotter Requests" directly.

### 3. Verification
- **Test:** After applying the changes, I will ask you to check the Status dropdown to ensure only the 4 allowed options are present and verify that the blue badge count next to the title is gone.
