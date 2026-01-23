I will improve the Bantay Chatbot UI to ensure suggested actions ("presets") are always accessible at the bottom of the chat window, even after the bot responds.

**Planned Changes:**

1.  **Update `client/src/components/Chatbot.jsx`**:
    *   Implement a **persistent "Quick Actions" bar** pinned just above the text input field.
    *   Create a `suggestedActions` state to manage the currently available options.
    *   Configure the chatbot to automatically show **Default Actions** (e.g., "Request Certificate", "File Complaint") if the bot's response doesn't provide specific follow-up options (like in the case of "Office Hours").
    *   Remove the inline action chips from the message history to prevent clutter and duplication.

This ensures that users always have one-click options available "at the bottom" to continue the conversation, addressing the issue where options scroll away or disappear.