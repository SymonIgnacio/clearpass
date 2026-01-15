I have analyzed the codebase and identified the layout configuration causing the overlap issues, along with the specific fixes needed for `DocumentsDashboard.jsx`.

### **1. Fix Global Header Overlap (The "div overlaps div" issue)**
- **Root Cause:** The `Header` component explicitly sets `zIndex: theme.zIndex.drawer + 1` (line 27). This forces the Header to render **on top of the Sidebar (Drawer)** when the sidebar is in temporary mode (mobile/tablet). This creates a visual bug where the Header "cuts through" or overlaps the navigation menu.
- **Action:**
  - Modify `client/src/components/Header.jsx` to remove the `zIndex` override.
  - This restores the correct stacking order: Sidebar (Drawer) > Header (AppBar), ensuring the menu always slides cleanly over the interface on all pages.

### **2. DocumentsDashboard.jsx Fixes & Polish**
- **Fix Crash Risk:** Add the missing `Assignment` icon import from `@mui/icons-material`.
- **Improve UX:** Replace the disruptive `window.alert()` popups with a non-blocking `Snackbar` notification system.
  - **Implementation:**
    - Introduce `snackbar` state (`open`, `message`, `severity`).
    - Add a `showSnackbar` helper function.
    - Replace all `alert()` calls with `showSnackbar()`.
    - Render the `<Snackbar>` component at the page root.

### **3. Verification Plan**
- I will verify that the `Assignment` icon is correctly imported.
- I will confirm that `Header.jsx` no longer has the z-index override.
- I will ensure the `DocumentsDashboard.jsx` code compiles without errors.
