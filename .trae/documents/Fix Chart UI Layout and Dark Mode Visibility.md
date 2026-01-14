I will fix the UI issues in `ClerkAIInsights.jsx` by addressing the dark mode visibility problems and optimizing the layout for side-by-side display.

### 1. Investigation Findings
*   **Dark Mode Visibility:** The charts (Recharts) are not currently using the Material UI theme colors. In dark mode, the default black text of the axes becomes invisible against the dark background.
*   **Layout & Spacing:** The screenshot shows the charts side-by-side (likely a desired state), but the current code has them stacked (`lg={12}`). The side-by-side layout appeared cramped because of insufficient margins and styling for the horizontal bar chart labels.

### 2. Proposed Changes
I will modify `client/src/pages/ClerkAIInsights.jsx` to:
1.  **Enable Side-by-Side Layout:** Change the Grid size for both charts from `lg={12}` to `lg={6}` to create a dense, dashboard-style view that matches the screenshot's intent.
2.  **Fix Dark Mode Colors:**
    *   Define dynamic axis and grid colors using `theme.palette.text.secondary` and `theme.palette.divider`.
    *   Apply these colors to `<XAxis>`, `<YAxis>`, and `<CartesianGrid>` components so they are visible in both light and dark modes.
3.  **Improve Chart Readability:**
    *   Adjust `BarChart` margins and `YAxis` width to ensure labels like "Barangay Clearance" fit comfortably.
    *   Style the `<Tooltip>` to match the theme (using the existing `CustomTooltip` or applying styles to the default one).
