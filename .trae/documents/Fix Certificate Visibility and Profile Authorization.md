I have gathered all the necessary information to address your requests. Here is the comprehensive plan:

### **Phase 1: Fix Infinite Loading & Guest Logic**
1.  **Fix Loading Loop in `ResidentDashboard.jsx`**:
    *   Initialize `loading` based on `AuthContext.loading`.
    *   Remove the strict `user.type === 'resident'` check in `useEffect` (Line 66) because guests (pending residents) might not have this type set yet, or it might be different.
    *   Ensure `fetchDashboardData` handles both Resident (Role 12) and Guest (Role 13) correctly.
2.  **Fix ID Mapping**:
    *   In `fetchDashboardData`, change the certificate request to use `resident_id: user.resident_id` instead of `user.id`.
    *   Add a safe check: if `user.resident_id` is null (Guest), skip fetching certificates or fetch from an empty list, instead of sending a bad request.

### **Phase 2: Solidify Upload UI & Verification**
3.  **Refactor Verification Modal**:
    *   Extract the Verification Modal into a separate reusable component: `VerificationUploadModal.jsx`.
    *   This component will be used by both the "Guest View" and the "Resident View" (if they have pending requirements).
4.  **Fix Missing Function**:
    *   The code calls `fetchUploadedDocs()` which is undefined. I will implement this function (or remove the call if `fetchDashboardData` is sufficient) to update the UI after upload.
    *   I will verify `uploadVerification` utility exists (my previous read failed, so I'll check `api.js` where it might be exported).

### **Phase 3: Dashboard for Guests**
5.  **Enable Guest Dashboard**:
    *   The current code has a hard return for Role 13 (Line 250).
    *   **Change**: Instead of a blocking "Account Under Review" page, I will render the full dashboard structure but with "Locked" states for cards.
    *   **Implementation**:
        *   Show "Profile Summary" (Editable).
        *   Show "Quick Actions" but disable buttons (except Upload).
        *   Add a prominent "Verification Required" banner at the top.
        *   Keep the "Upload Proof" button accessible.

### **Verification Plan**
1.  **Guest Login**: Log in as a Guest.
    *   Expect: Dashboard loads (no infinite spinner).
    *   Expect: "Verification Required" banner.
    *   Expect: "Upload" button works.
    *   Expect: Other actions disabled.
2.  **Upload**: Upload a file.
    *   Expect: Success message, modal closes, dashboard refreshes.

I will start by fixing the `ResidentDashboard.jsx` logic and creating the modal component.
