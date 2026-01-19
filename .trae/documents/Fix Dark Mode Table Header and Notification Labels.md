I will fix the UI color issues in dark mode and correct the notification badge text.

### **1. Fix Dark Mode Table Header Visibility**
*   **Problem**: The table header (`TableHead`) has a hardcoded background color `bgcolor: 'grey.50'` (line 122). In dark mode, this light grey background makes white text (if theme text color is white) unreadable, or if the text is dark, it looks out of place against the dark theme.
*   **Fix**: Remove the hardcoded `bgcolor: 'grey.50'` or change it to `bgcolor: 'background.paper'` (or a theme-aware color) so it adapts to dark mode. I will also ensure the text color is set to `text.primary` or inherits correctly.

### **2. Update Notification Badge Text**
*   **Problem**: The notification chips (spans) say "error" and "success" instead of "Rejected" and "Approved".
*   **Root Cause**: I previously updated the *backend* to send 'approved'/'rejected', and I updated `NotificationBell.jsx` to map these types to colors. However, `ResidentDocuments.jsx` (this file) has its own `getStatusChip` function (lines 67-86) which handles the **Document Status** display, but the user pointed out the **Notification** text in the second part of their query ("also this span span...").
*   **Wait**, looking at the user's input: "also this `span` `span` the namin is incorrect it should be "rejected" or "approved" not "error" and "success"".
    *   The user selected `span` elements with class `MuiChip-label`.
    *   If they are referring to the *Notifications* dropdown (which they complained about earlier), I already fixed `NotificationBell.jsx`.
    *   **However**, if they are referring to the **Table Status Chips** in `ResidentDocuments.jsx`, those *already* use the correct labels:
        ```javascript
        verified: { ..., label: 'Verified' },
        approved: { ..., label: 'Approved' },
        pending: { ..., label: 'Pending Review' },
        rejected: { ..., label: 'Rejected' }
        ```
    *   **Re-reading the user's input**: "also this `span` `span` the namin is incorrect it should be "rejected" or "approved" not "error" and "success"".
    *   The screenshot shows the **Notification Dropdown** (with "Beneficiary Status Rejected" and a red "error" chip).
    *   **Ah!** My previous fix for `NotificationBell.jsx` handled the *color mapping*, but maybe the backend is still sending "error" as the type for *old* notifications? Or maybe I didn't actually change the *label* rendering?
    *   In `NotificationBell.jsx`, I did:
        ```javascript
        <Chip label={notification.type} ... />
        ```
    *   This renders the raw type string.
    *   I updated the backend to send "rejected" instead of "error".
    *   **BUT**, for **existing** notifications in the database (created before my fix), the type is still stored as "error" or "success".
    *   **Fix**: I need to map the *display label* in `NotificationBell.jsx` as well, so that legacy "error" types display as "Rejected" and "success" types display as "Approved".

### **Plan Details**
1.  **Frontend (`ResidentDocuments.jsx`)**:
    *   Change `TableHead` background color to `background.paper` or remove the `bgcolor` prop to respect the theme.
    *   Ensure `TableCell` headers have appropriate contrast.

2.  **Frontend (`NotificationBell.jsx`)**:
    *   Update the rendering of the `Chip` label. Instead of directly using `notification.type`, use a helper function or map:
        ```javascript
        const getLabel = (type) => {
           if (type === 'error') return 'Rejected';
           if (type === 'success') return 'Approved';
           return type; // 'approved', 'rejected', 'warning', etc.
        }
        ```
    *   This ensures both old (legacy) and new notifications display the correct user-friendly text.

This addresses the "cant see the top of the th" issue and the "error/success" naming issue.