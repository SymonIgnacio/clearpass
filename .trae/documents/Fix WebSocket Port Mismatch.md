# Critical Bug: WebSocket Port Mismatch

I have found the "Smoking Gun". The reason you are not seeing notifications is that **the Frontend is listening on the wrong port**.

## The Issue
- **Server**: Running on Port **3002** (as seen in your logs: `🚀 ClearPass Server started on port 3002`).
- **Frontend**: Hardcoded to connect to WebSocket on Port **3001** (`ws://localhost:3001/ws`).

## The Consequence
- The Backend successfully sends the notification (confirmed by logs).
- The Frontend is waiting for messages on a port that has no server (or a different server).
- **Result**: No real-time updates. The bell icon never changes. The dashboard never refreshes.

## The Fix
I will update `NotificationContext.jsx` to dynamically use the correct API URL/Port instead of a hardcoded value.
- Instead of `ws://localhost:3001/ws`, I will use the `API_URL` environment variable or derive it from the window location.
- This ensures that if the server moves to 3002, 3003, or production, the WebSocket connection follows it.

## Plan Execution
1.  **Frontend**: Update `client/src/contexts/NotificationContext.jsx` to fix the WebSocket URL.
2.  **Verify**: Once fixed, the frontend will successfully connect to the server's WebSocket, receive the "Document Rejected" event, and trigger the auto-refresh we built earlier.
