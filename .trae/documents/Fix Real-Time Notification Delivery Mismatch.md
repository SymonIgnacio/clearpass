I have identified the issue causing notifications to fail for residents (and other users).

### **Root Cause Analysis**
There is a mismatch between the data structure sent by the server and what the client expects:
1.  **Server-Side**: The `NotificationController` and global helpers send WebSocket messages with the notification content in a **`data`** property.
    *   File: `server/controllers/notificationController.js`
    *   Code: `wsService.sendToUser(userId, { type: 'notification', data: notification })`
2.  **Client-Side**: The `NotificationContext` attempts to read the notification content from a **`payload`** property, which does not exist.
    *   File: `client/src/contexts/NotificationContext.jsx`
    *   Code: `setNotifications(prev => [data.payload, ...prev])`

This results in the client receiving `undefined` for new real-time notifications, preventing them from appearing in the list or showing as popups.

### **Proposed Fix**
I will update the client-side code to match the server's data structure.

**Step 1: Update NotificationContext.jsx**
*   Modify `client/src/contexts/NotificationContext.jsx` to access `data.data` instead of `data.payload` in the WebSocket message handler.

### **Verification Plan**
Since I cannot interactively test the UI, I will verify the code changes by:
1.  Applying the fix to `client/src/contexts/NotificationContext.jsx`.
2.  Reviewing the file to ensure all references to `payload` in the WebSocket handler are updated to `data`.
