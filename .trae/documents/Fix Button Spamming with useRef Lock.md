I will fix the button spamming issue by implementing a synchronous lock using `useRef`.

### **Root Cause**
The `saving` state, managed by `useState`, updates asynchronously. If a user clicks the button rapidly, the function can be re-entered multiple times before the re-render disables the button, causing multiple API requests.

### **Solution**
1.  **Modify `client/src/pages/ResidentProfile.jsx`**:
    *   Import `useRef` from 'react'.
    *   Create a `submitLock` ref initialized to `false`.
    *   In `handleSaveBeneficiaryStatus`, check `submitLock.current`. If true, return immediately.
    *   Set `submitLock.current = true` before starting the request.
    *   Reset `submitLock.current = false` in the `finally` block.

This ensures that the submission logic is synchronously locked the moment the first click is processed, preventing any subsequent clicks from triggering duplicate requests.

*(Note: I have verified that the previous backend fix for the "Unknown column" error was correctly applied in `residentProfileController.js`, so that issue should also be resolved.)*