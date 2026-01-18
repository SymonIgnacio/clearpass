I will fix the `validateDOMNesting` warnings by adjusting the `ListItemText` components in `ResidentDashboard.jsx`.

The issue is that `ListItemText` renders its `secondary` content inside a `<p>` tag by default. When we include block-level elements like `Box` (`<div>`), `Chip` (`<div>`), or other `Typography` (`<p>`) inside it, it creates invalid HTML nesting (e.g., `<div>` inside `<p>`).

**Fixes:**
1.  **Your Documents List:** Add `secondaryTypographyProps={{ component: 'div' }}` to `ListItemText` and ensure the inner `Box` is also a `div` (not `span`).
2.  **Recent Requests List:** Add `secondaryTypographyProps={{ component: 'div' }}` to `ListItemText`.
3.  **Announcements List:** Add `secondaryTypographyProps={{ component: 'div' }}` to `ListItemText`.

This will ensure the container is a `<div>`, allowing nested block elements without errors.