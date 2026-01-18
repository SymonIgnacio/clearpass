# Plan: Enable Local Network Access (Phone Support)

To allow you to access the system from your phone on the same Wi-Fi network, I need to adjust the network configurations to permit external connections and handle "localhost" resolution correctly.

## 1. Code Configuration Changes

### A. Update Server CORS (`server/index.js`)
**Goal**: Allow requests from any device on your local network (e.g., `192.168.x.x`), not just `localhost`.
**Action**: Modify the CORS origin check to accept local IP addresses.

### B. Optimize API URL Handling (`client/src/utils/api.js`)
**Goal**: Ensure the frontend on your phone talks to your computer, not itself.
**Action**: Update the default API URL logic to use the current window's hostname dynamically (e.g., `http://192.168.1.5:3002`) instead of hardcoding `localhost`.

## 2. Deployment Strategy for Phone Access

I recommend using the **Production Mode** for phone access because it serves both the Frontend and Backend on a single port (`3002`), eliminating complex proxy setup.

### Steps to Run:
1.  **Build**: `npm run build` (Compiles the frontend)
2.  **Start**: `npm run start:prod` (Runs the server which also serves the frontend)
3.  **Access**: On your phone, go to `http://<YOUR_COMPUTER_IP>:3002`

## 3. Execution Plan
1.  **Edit `server/index.js`**: Update CORS logic.
2.  **Edit `client/src/utils/api.js`**: Update API base URL logic.
3.  **Provide Guide**: I will output the final "How to Access on Phone" guide.
