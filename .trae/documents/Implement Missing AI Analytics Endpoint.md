I will fix the 404 error by implementing the missing API endpoints in both the Node.js backend and the Python AI service.

### The Issue
The frontend (`AdminReports.jsx`) is trying to fetch AI analytics from `GET /api/ai/analytics`, but this route **does not exist** in your Node.js backend (`aiRoutes.js`), nor does the corresponding endpoint exist in your Python AI service.

### The Fix
I will implement the missing "plumbing" to make the AI Insights tab work:

1.  **Update Python AI Service (`suggestion_engine.py`)**:
    *   Create a new endpoint `GET /analytics/general`.
    *   It will return the data the frontend expects: `model_accuracy`, `predictions_count`, and service status.
    *   *Bonus:* I'll make it read real stats from your `chatbot_engine` where possible (e.g., checking if the model is loaded).

2.  **Update Node.js Backend (`aiRoutes.js`)**:
    *   Add the missing `GET /analytics` route.
    *   Configure it to securely proxy the request to the new Python endpoint.

### Execution Steps
1.  Modify `ai_service/suggestion_engine.py` to add the `/analytics/general` endpoint.
2.  Modify `server/routes/aiRoutes.js` to add the `router.get('/analytics', ...)` handler.
3.  Restart the services (if needed) and verify the 404 is gone.
