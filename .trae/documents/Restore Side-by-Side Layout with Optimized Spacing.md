I will optimize the chart layout to be side-by-side (`lg={6}`) while fixing the compression and "unbalanced" spacing issues.

### Analysis
*   **User Feedback:** The user feels the full-width (`lg={12}`) layout looks "unbalanced" (likely too much empty space) and mentions "space to the left". They also requested to "remove the [responsiveness/issue]".
*   **Root Cause:**
    *   `lg={12}` made the charts too wide for the amount of data, creating large gaps.
    *   `lg={6}` (side-by-side) previously caused compression because the `YAxis` width (140px) was too large for the available space.
    *   The "missing charts" issue was fixed by the explicit height, so we will keep that.

### Plan
1.  **Revert to Side-by-Side:** Change `lg={12}` back to `lg={6}` for both charts to restore the dashboard layout.
2.  **Optimize Spacing to Prevent Compression:**
    *   **Certificate Demand (Bar Chart):**
        *   Reduce `YAxis` width from `140` to `110`.
        *   Reduce margins (especially `right: 30` to `right: 10`).
        *   This will give the bars more room to breathe even in the narrower column.
    *   **Request Trend (Area Chart):**
        *   Keep the optimized margins (`left: -20`) which worked well to maximize space.
3.  **Refine Container:** Ensure the `Box` has `height={280}` (keeping the visibility fix) and remove any unnecessary flex properties that might interfere with Recharts.

This approach gives the user the preferred side-by-side layout without the "compressed" text or "unbalanced" empty space.