I will fix the persistent overlapping text issue in the **Your Documents** section of the Resident Dashboard.

**Analysis:**
The text overflow (e.g., long filenames like `176869...jpg`) originates from the "Your Documents" card. Although there was some truncation logic (`maxWidth: 250`), it is not effectively constraining the text within the card's boundaries, causing it to bleed into adjacent sections like "Recent Requests".

**Proposed Changes:**
1.  **Enforce Strict Truncation in "Your Documents":**
    -   Update the `ListItemText` component in the "Your Documents" list to strictly manage overflow.
    -   Remove the hardcoded `maxWidth: 250` from the filename `Typography`.
    -   Set `minWidth: 0` on the `ListItemText` to allow it to shrink properly within the Flexbox container.
    -   Ensure the `Typography` uses `width: '100%'` and `display: 'block'` combined with `noWrap` to force truncation at the exact container width.

This will ensure that long filenames are properly cut off with an ellipsis (...) regardless of the screen size or column width, preventing them from overlapping other UI elements.