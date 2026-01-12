I will fix the `ReferenceError` by defining the missing state variables in `Residents.jsx`.

**Steps:**
1.  **Edit `client/src/pages/Residents.jsx`**:
    *   Add the missing state definitions for `confirmationModalOpen` and `confirmationAction` inside the `Residents` component.

**Code Change:**
```javascript
// ... existing state ...
const [bulkImportResult, setBulkImportResult] = useState(null)

// Add these lines:
const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
const [confirmationAction, setConfirmationAction] = useState(null)
// ...
```