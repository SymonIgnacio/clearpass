# Dashboard Improvement Plan (With Community Programs)

## 1. Clean Profile Card (Resident Dashboard)
*   **Remove**: The "Profile Completion" progress bar (Lines 394-404).
*   **Add Notice**: Insert a styled `Alert` or `Box` saying "Complete Profile" in its place.
*   **Update Button**:
    *   **Condition**: `disabled={isGuest || isPending}`.
    *   **Logic**: The button "Update Profile" will be unclickable until the user is a full Resident (Role 12) with Active status.

## 2. Add "Community Programs" to Resident Portal
Since the admin side already has a robust `CommunityEvents` page, we will expose this to residents.

*   **Route Update**:
    *   Modify `client/src/App.jsx`: Update the `/events` route to include Roles 12 (Resident) and 13 (Guest).
*   **Dashboard Integration**:
    *   Add a new section "Upcoming Community Programs" to `ResidentDashboard.jsx`.
    *   This will fetch data from `/api/programs` and display the top 3 upcoming events in a card view.
    *   Add a "View All Programs" button linking to `/events`.

## 3. UI Polish
*   **Announcements**: Actually render the announcements list (currently hidden in state) in a sidebar widget.
*   **Layout**: Reorganize the dashboard to have a main column (Requests + Programs) and a side column (Profile + Announcements).

## Execution Steps
1.  **Modify `ResidentDashboard.jsx`**: Apply profile card cleanup and add Programs widget.
2.  **Modify `App.jsx`**: Unlock `/events` route for residents.
3.  **Modify `Sidebar.jsx`**: Add "Community Programs" link for residents.
