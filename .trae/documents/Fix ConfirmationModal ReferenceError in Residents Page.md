I will fix the `ReferenceError` in `client/src/pages/Residents.jsx` by importing the missing `ConfirmationModal` component and implementing the necessary state and handlers to make it functional.

1. **Import Component**: Add `import ConfirmationModal from '../components/ConfirmationModal'` to `client/src/pages/Residents.jsx`.
2. **Add State**: Initialize `confirmationModalOpen` and `confirmationAction` state variables using `useState`.
3. **Implement Handler**: Create `handleConfirmationConfirm` function to execute the confirmed action.
4. **Refactor Archive**: Update `handleArchive` to use the `ConfirmationModal` instead of `window.prompt`, providing a better UI and fixing the integration.

