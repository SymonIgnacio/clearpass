## What’s Going On Today
- The app is **mostly desktop-first**: the layout hard-codes a `280px` sidebar offset and uses a **permanent Drawer**, so small screens get cramped/shifted. The main shell is inline in [App.jsx](file:///c:/xampp/htdocs/clearpass/client/src/App.jsx#L315-L346).
- Dark mode is **partially prepared**: there are settings switches that write `userPreferences.darkMode`, but they’re currently disabled and the MUI theme is hard-coded to `palette.mode: 'light'` in [App.jsx](file:///c:/xampp/htdocs/clearpass/client/src/App.jsx#L62-L106).

## Goal
- Make the UI **mobile-friendly** (sidebar collapses, content fits, tables/dialogs scroll correctly).
- Make it **prettier** by letting the theme drive colors/spacings consistently.
- Add a real **dark mode** toggle that applies app-wide and persists.

## Plan
### 1) Add Real Dark Mode (Theme Mode State + Persistence)
- Create a small `ThemeModeContext` (or `ThemeModeProvider`) that:
  - stores `mode: 'light' | 'dark'` in React state
  - reads/writes `localStorage.userPreferences.darkMode` (you already use this key in [Settings.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/Settings.jsx#L56-L112))
  - exposes `toggleColorMode()` and `setColorMode(mode)`
- Update [App.jsx](file:///c:/xampp/htdocs/clearpass/client/src/App.jsx#L62-L534) to build the MUI theme from `mode` (instead of hard-coding `'light'`).
- Make sidebar and other hard-coded colors theme-aware (e.g., replace Drawer paper background `#f8f9fa` in [Sidebar.jsx](file:///c:/xampp/htdocs/clearpass/client/src/components/Sidebar.jsx#L272-L283) with theme tokens like `background.paper`).

### 2) Add a Dark Mode Toggle in the UI
- Add a simple toggle icon/button in the header ([Header.jsx](file:///c:/xampp/htdocs/clearpass/client/src/components/Header.jsx#L24-L99)) that calls the theme toggle.
- Enable the existing dark mode switches in:
  - [Settings.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/Settings.jsx#L752-L761)
  - [SuperAdminSettings.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/SuperAdminSettings.jsx)
  and wire them to the shared theme context (so the switch actually changes the theme).

### 3) Make the App Shell Responsive (Sidebar + Content)
- Extract the inline “shell” in [App.jsx](file:///c:/xampp/htdocs/clearpass/client/src/App.jsx#L315-L346) into a dedicated component (e.g., `components/AppShell.jsx`) so spacing is centralized.
- Update [Sidebar.jsx](file:///c:/xampp/htdocs/clearpass/client/src/components/Sidebar.jsx) to behave like:
  - `permanent` drawer on `md+`
  - `temporary` drawer (slide-in) on `sm/xs`
- Add a hamburger menu button in the header to open/close the mobile drawer.
- Replace the fixed `marginLeft: '280px'` with breakpoint-based layout:
  - `marginLeft: { xs: 0, md: drawerWidth }`

### 4) Fix the Biggest Mobile Overflow Spots (Tables, Dialogs, Menus)
- Add horizontal scrolling where tables are wide:
  - `TableContainer sx={{ overflowX: 'auto' }}` + `Table sx={{ minWidth: ... }}`
- Make dialogs full-screen on phones (`fullScreen={isSmDown}`) and adjust grids to `xs={12} sm={6}`.
- Priority targets based on current code hotspots:
  - [Users.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/Users.jsx)
  - [Residents.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/Residents.jsx)
  - [DocumentsDashboard.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/DocumentsDashboard.jsx)
  - [AdminReports.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/AdminReports.jsx)
  - [NotificationBell.jsx](file:///c:/xampp/htdocs/clearpass/client/src/components/NotificationBell.jsx) (menu width should be responsive)

### 5) Verification
- Run the existing test suite (`vitest run`) to ensure nothing breaks.
- Start the dev server and quickly sanity-check:
  - mobile width (Drawer collapses, content not clipped)
  - dark mode toggling and persistence after refresh
  - key pages with tables/dialogs scroll properly

## What You’ll Get After This
- A consistent responsive layout (desktop sidebar + mobile slide-in).
- Dark mode that works everywhere (Header toggle + Settings toggle).
- Cleaner look via theme-driven colors and spacing.

If you want, I can also add a “System / Follow device theme” option (uses `prefers-color-scheme`).