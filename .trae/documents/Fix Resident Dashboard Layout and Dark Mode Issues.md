I will fix the layout issues in `ResidentDashboard.jsx` by implementing the following changes:

1.  **Fix Dark Mode Background**:
    -   Update the main container's background color from the hardcoded `grey.50` (which is always light) to `background.default`. This ensures the background automatically adapts to the user's selected theme (light or dark).

2.  **Prevent Content Overflow**:
    -   In the **Recent Requests** section: Apply `noWrap` styling to the request title (certificate type) and description. This will truncate long text with an ellipsis (...) instead of letting it spill over into adjacent elements.
    -   In the **Announcements** section: Apply similar `noWrap` protection to announcement titles to ensure consistent layout behavior.
    -   Add `title` attributes to these truncated elements so users can still see the full text by hovering over them.

These changes directly address the overlapping elements and the incorrect background color in dark mode.