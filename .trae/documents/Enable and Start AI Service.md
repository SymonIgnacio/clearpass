I have identified the root cause of the 503 errors and will now fix it by enabling the AI service configuration and ensuring the service is running.

### The Problem
1.  **Service Disabled**: The `.env` file is missing `AI_SERVICE_ENABLED=true`. The backend code (`aiRoutes.js`) explicitly checks this variable and returns a 503 if it's missing or false.
2.  **Service Not Running**: The Python AI service is likely not running in the background, or if it is, the configuration might prevent it from being reached.

### The Fix
1.  **Enable AI Service**: Update `server/.env` to include `AI_SERVICE_ENABLED=true`.
2.  **Start AI Service**: Launch the Python AI service on port 5000 (matching the `.env` configuration `AI_SERVICE_URL=http://localhost:5000`).

### Execution Steps
1.  Update `server/.env` to set `AI_SERVICE_ENABLED=true`.
2.  Start the Python AI service using `python suggestion_engine.py` in a new terminal.
3.  Restart the Node.js server to pick up the new environment variables.
