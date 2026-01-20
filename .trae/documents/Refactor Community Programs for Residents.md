# Refactor Community Programs for Residents

The user wants to remove the shared "Community Programs" page (table view) and replace it with a **Resident-Only Card View**.

## 1. Remove Shared "Community Programs" Page
*   **Sidebar**: Remove the link to `/events` from the Resident Sidebar.
*   **Dashboard**: Remove the hardcoded widget if requested, BUT the user said *"i just want it see the community programs in the dashboard. make sure that `div` this is expandable"*. This implies keeping the widget but making it better/expandable.
*   **Clarification**: The user wants the "View All" button to go to a **new page** that uses **Cards** instead of a Table.

## 2. Create New Page: `ResidentPrograms.jsx`
*   **Path**: `/resident/programs`
*   **Layout**: A grid of Cards (not a table).
*   **Content**: Title, Date, Location, Description, Status.
*   **Features**: Search bar, Filter by Status.

## 3. Update Dashboard Widget
*   **Expandable**: The user asked for the dashboard widget to be "expandable". I will add a "Show More" toggle or ensure the list can grow.
*   **Redirect**: The "View All" button will now point to `/resident/programs` instead of `/events`.

## 4. Execution Steps
1.  **Create `ResidentPrograms.jsx`**: Build the new card-based page.
2.  **Update `App.jsx`**: Add the route `/resident/programs`.
3.  **Update `Sidebar.jsx`**: Change the link to point to the new page.
4.  **Update `ResidentDashboard.jsx`**:
    *   Change "View All" link.
    *   Make the list "expandable" (show 3 by default, expand to show more inline, or just keep the redirect as the primary expansion method).
