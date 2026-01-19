I will fix the notification badge text and update the frontend component to handle the new status types correctly.

### **1. Update Notification Component (`NotificationBell.jsx`)**
*   **Problem**: The component currently displays the `type` directly as the chip label (`label={notification.type}`) and uses a hardcoded `switch` statement for colors that only supports `success`, `warning`, and `error`.
*   **Fix**:
    *   Update `getTypeColor` to map `'approved'` to `'success'` (green) and `'rejected'` to `'error'` (red).
    *   Add a text mapping (optional, or just rely on the backend sending "approved"/"rejected" as the type, which it now does). Since I updated the backend to send `'approved'` and `'rejected'`, the label will automatically show "approved" and "rejected".
    *   The only missing piece is the **color mapping**.

### **Implementation Plan**
1.  **Modify `client/src/components/NotificationBell.jsx`**:
    *   Update the `getTypeColor` function:
        ```javascript
        const getTypeColor = (type) => {
          switch (type) {
            case 'success':
            case 'approved': return 'success'; // Map 'approved' to green
            case 'warning': return 'warning';
            case 'error':
            case 'rejected': return 'error';   // Map 'rejected' to red
            default: return 'info';
          }
        };
        ```
    *   This ensures that the new types I introduced in the backend (`approved`, `rejected`) render with the correct visual cues while displaying the desired text.

2.  **Verify Backend Changes**:
    *   I have already updated `secretaryRoutes.js` to sync the `resident_documents` status and send the new notification types. No further backend changes are needed for this specific request.

This completes the user's request:
1.  Document status is synced (Backend fix applied).
2.  Notification says "approved"/"rejected" (Backend sends these types).
3.  Notification colors are correct (Frontend fix to be applied).