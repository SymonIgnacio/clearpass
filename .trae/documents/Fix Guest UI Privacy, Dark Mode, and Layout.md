# UI & Logic Fixes for Guest/Resident Portal

## 1. Fix Certificate Privacy (Guest Access)
- **File:** `client/src/pages/ResidentCertificates.jsx`
- **Action:** 
    - Modify `useEffect` to prevent fetching certificates if the user is a Guest (Role 13).
    - If `isGuest` is true, explicitly set `certificates` to an empty array `[]` to ensure the table remains empty.

## 2. Fix Dark Mode Backgrounds
- **File:** `client/src/pages/ResidentDashboard.jsx`
    - **Action:** Change `bgcolor: 'grey.50'` to `bgcolor: 'background.default'` to respect the theme's dark mode settings.
- **File:** `client/src/components/AppShell.jsx`
    - **Action:** Ensure `Box` background uses `background.default` consistently (already appears correct, but verifying nested `Box` usage in Dashboard).

## 3. Improve "Recent Requests" for Verification Tracking
- **File:** `client/src/pages/ResidentDashboard.jsx`
- **Action:**
    - Update the `requests` logic to include a "mock" request entry for the residency verification itself if the status is "Pending Verification".
    - This allows the user to see "Residency Verification - Pending" in the Recent Requests list alongside certificate requests.

## 4. Remove Announcements Section
- **File:** `client/src/pages/ResidentDashboard.jsx`
- **Action:** 
    - Delete the `Grid item` containing the Announcements card.
    - Adjust the grid layout (change "Recent Requests" from `md={6}` to `md={12}` or keep it side-by-side with something else if needed, but likely expanding it to full width is better or keeping the layout balanced).
    - *Plan:* Expand "Recent Requests" to full width (`md={12}`) since it will be the only item in that row.
