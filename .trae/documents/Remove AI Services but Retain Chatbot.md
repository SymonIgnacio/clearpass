I will remove the AI service components related to priority calculation, patrol suggestions, and general analytics, while retaining the chatbot functionality.

**Steps:**

1. **Modify AI Service (`ai_service/smart_suggestions.py`)**:

   * Remove `calculate_priority`, `suggest_patrol`, and `get_general_analytics` endpoints.

   * Remove unused helper functions (`analyze_crime_patterns`, `analyze_trends`, etc.) and imports.

   * Retain `/chatbot/message` and `/health` endpoints.

2. **Modify Node.js Server (`server/routes/aiRoutes.js`)**:

   * Remove `POST /priority` (Priority Calculation).

   * Remove `POST /patrol` (Patrol Suggestions - Python version).

   * Remove `GET /analytics` (General Analytics).

   * Retain `POST /chatbot` and `GET /health`.

   * Retain `GET /patrol-suggestions` (Node.js hybrid implementation) but it will no longer be used by the frontend.

3. **Modify Client Frontend**:

   * **`client/src/pages/AdminReports.jsx`**: Remove the "AI Insights" tab and its rendering logic.

   * **`client/src/pages/Dashboard.jsx`**: Remove the "AI Patrol Intelligence" card and the "AI Analysis" quick action button.

   * **`client/src/utils/dashboardAPI.js`**: Remove `getAIAnalytics` function.

4. **Verification**:

   * Verify the Chatbot still works (via code review/logic check).

   * Verify the Admin Reports and Dashboard load without errors (missing tabs/cards is expected).

