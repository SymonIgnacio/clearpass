I will implement the requested changes by upgrading the theming system for full dark mode support and adding a dedicated QR code generation feature.

### 1. Dark Mode & Theming Enhancements
- **System Preference Detection**: Update `ThemeModeContext.jsx` to automatically detect the user's system preference (`prefers-color-scheme`) if no manual override exists.
- **Theme Configuration**: Refine `App.jsx` theme definition to ensure all colors meet WCAG AA contrast ratios (4.5:1) in both modes.
- **Component Styling**: Ensure `MuiCard`, `MuiButton`, and inputs have proper borders and background colors in dark mode.

### 2. QR Code Generation Feature
- **New Page**: Create `src/pages/QRCodeGenerator.jsx` with:
    - Input fields for text/URL.
    - Customization options (size, foreground/background color, error correction level).
    - Live preview of the QR code.
    - "Download" button (PNG/JPG).
- **Library Integration**: Install and use `qrcode` library for generation.
- **Sidebar Integration**: Add "QR Generator" link to `Sidebar.jsx` under "Resident Services".
- **Modal Update**: Upgrade `QRCodeModal.jsx` to render actual QR codes instead of a placeholder icon.

### 3. Implementation Steps
1.  **Install Dependency**: `npm install qrcode`
2.  **Update Context**: Modify `src/contexts/ThemeModeContext.jsx` to respect system color scheme.
3.  **Refine Theme**: Update `src/App.jsx` with high-contrast colors and new route.
4.  **Create Generator**: Implement `src/pages/QRCodeGenerator.jsx`.
5.  **Update Navigation**: Add menu item to `src/components/Sidebar.jsx`.
6.  **Update Modal**: Refactor `src/components/QRCodeModal.jsx` to use the `qrcode` library.
