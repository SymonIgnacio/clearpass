I have found the exact cause of both the MUI error and the "empty page" issue.

### **Root Causes**
1.  **MUI Error (`Tabs` value mismatch):**
    *   The `Tabs` component has `value={0}` (default state), but the only `<Tab>` child has `value={1}`. This mismatch causes the crash.
    *   *Note:* My previous attempt to fix this didn't persist, possibly due to a file write race condition. I will force the edit again.
2.  **Empty Page (No Documents):**
    *   The `useEffect` logic is still checking `if (tabValue === 0) { fetchApplications() }`.
    *   Since the tab is now 0 (or will be), it's fetching the *old* "Applications" list (which is likely empty or ignored) instead of `fetchResidentDocuments()`.
    *   Consequently, `residentDocuments` state never gets populated, resulting in "No documents found".

### **Implementation Plan**
1.  **Fix `<Tab>` Value:** Change `<Tab value={1} />` to `<Tab value={0} />` in `DocumentVerification.jsx`.
2.  **Fix Data Fetching Logic:** Update the `useEffect` to call `fetchResidentDocuments()` regardless of the tab, or specifically when `tabValue === 0`.
3.  **Clean Up:** Remove the dead `fetchApplications` logic and unused `applications` state to prevent future confusion.

This will resolve the error and correctly load the documents.