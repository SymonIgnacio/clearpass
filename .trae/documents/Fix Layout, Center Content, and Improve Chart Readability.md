I will update `ClerkAIInsights.jsx` to address the layout, centering, and readability issues:

1. **Fix "Still Long" & "Not Centered" (Metric Cards):**

   * Refactor the metric cards (Pending Requests, Avg Processing Time, Completion Rate) to center their content.

   * Remove the "space-between" layout that pushes content to the edges.

   * Align text and icons to the center for a more compact and focused look.

2. **Fix "Text Not Readable" (Certificate Demand Chart):**

   * Switch the **Certificate Demand Analysis** chart to a **Horizontal Bar Chart** layout.

   * This moves the long labels (e.g., "Certificate of Residency") to the Y-axis where they can be displayed horizontally and fully readable without rotation or overlapping.

3. **Optimize Chart Heights:**

   * Reduce the height of both charts to `300px` to save vertical space.

   * Adjust margins to ensure labels fit perfectly in the new layout.

4. **Refine Grid Layout:**

   * Ensure the metric cards use the full width on smaller screens but sit comfortably side-by-side on larger screens.

