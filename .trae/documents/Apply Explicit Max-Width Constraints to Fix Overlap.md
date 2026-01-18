I will fix the layout overlap issues by enforcing explicit `maxWidth` constraints on the text elements. The previous Flexbox-only approach (`minWidth: 0`) is proving insufficient for the deeply nested grid layout on responsive screens.

**Changes:**
1.  **Your Documents**: Apply a responsive `maxWidth` to the filename text.
    -   Use `maxWidth: { xs: '200px', sm: '300px', md: '180px' }`. This accounts for the narrower column width in `md` (desktop) view compared to `sm` (tablet) or `xs` (mobile).
2.  **Recent Requests & Announcements**: Add similar `maxWidth` constraints to the request types and announcement titles to prevent them from expanding their containers unexpectedly.

This "hard" constraint ensures the browser *must* truncate the text with an ellipsis when it exceeds the specified pixel width, guaranteeing that the content stays within its card boundaries.