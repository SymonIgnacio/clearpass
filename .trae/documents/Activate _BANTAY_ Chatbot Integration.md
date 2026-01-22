I will remove the requested pages and implement the Resident Chatbot.

### 1. Clean Up Old AI Pages
- **Sidebar**: Remove "AI Insights", "Patrol AI", and "Ronda Analytics" links from `Sidebar.jsx`.
- **Routes**: Remove the following routes from `App.jsx`:
  - `/ai-dashboard`
  - `/ai-patrol`
  - `/ronda-analytics`
  - `/ai-analytics`
- **Files**: Delete the following files to completely remove the features:
  - `client/src/pages/AIPatrol.jsx`
  - `client/src/pages/RondaAnalytics.jsx`
  - `client/src/pages/ClerkAIInsights.jsx` (if it exists and is unused)

### 2. Implement Resident Chatbot
- **New Component**: Create `client/src/components/Chatbot.jsx`.
  - Floating action button (FAB) design.
  - Chat window with message history.
  - Connects to `POST /api/chatbot`.
  - Supports "Suggested Actions" from the bot.
- **Integration**: Add `<Chatbot />` to `ResidentDashboard.jsx`.
  - Ensure it only renders for residents.

This will strictly limit AI interaction to the Resident Chatbot "BANTAY" as requested.
