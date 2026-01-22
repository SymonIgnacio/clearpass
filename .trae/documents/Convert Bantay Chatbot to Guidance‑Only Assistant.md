## Goal
- Make Bantay a guidance-only assistant that gives step-by-step instructions for common barangay processes.
- Explicitly disable appointment scheduling and any booking-related follow-ups.

## Scope of Changes
- Frontend UI: render structured guides in the chat, remove scheduling prompts.
- AI Service (Python): intents and responses return step sequences for FAQs.
- Node API: keep /api/ai/chatbot proxy; block any booking-related actions.
- Content: author clear, accurate guides starting with “File a Complaint”.

## Implementation

### AI Service: Intents & Responses
- Update training and responses in [chatbot_data.py](file:///c:/xampp/htdocs/clearpass/ai_service/chatbot_data.py):
  - Remove/disable `appointment_request` and any booking actions.
  - Add guidance intents: `guide_file_complaint`, `guide_blotter_case`, `guide_barangay_clearance`, `guide_id_application`, `guide_residency_cert`, `guide_business_permit`.
  - For each intent, return a structured payload: `{type: 'guide', title, steps: [ ... ], resources: [links], disclaimers: [ ... ]}`.
- Adjust classifier in [chatbot_engine.py](file:///c:/xampp/htdocs/clearpass/ai_service/chatbot_engine.py):
  - Retrain with new phrases (English/Tagalog/Taglish variants) focused on guidance.
  - Keep fallback threshold; add synonyms for “how to”, “requirements”, “steps”.
- Optional dynamic FAQ:
  - Query `ai_chatbot_faq` (see [ai_tables_migration.sql](file:///c:/xampp/htdocs/clearpass/database/ai_tables_migration.sql#L30-L68)) to source steps, allowing content updates without code changes.

### Frontend: Chat UI Behavior
- In [Chatbot.jsx](file:///c:/xampp/htdocs/clearpass/client/src/components/Chatbot.jsx):
  - Add a GuideRenderer to display numbered steps, copy buttons, and quick-jump to sections.
  - Remove/hide action buttons that trigger booking (date/time/purpose collection).
  - Update quick-replies to guidance topics (e.g., “File a Complaint”, “Barangay Clearance”).
  - Show a persistent note: “Bantay provides guidance only and does not submit requests.”

### Node API: Proxy & Guards
- In [aiRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/aiRoutes.js#L23-L69):
  - Maintain POST `/api/ai/chatbot` proxy; ensure `verifyToken` stays.
  - Strip or ignore any legacy `actions` that imply booking; only pass back guides.
  - Sanitize inputs and log intent usage for analytics.

### Content: “File a Complaint” Guide
- Title: File a Complaint (Barangay)
- Steps:
  1. Confirm the incident is within barangay jurisdiction and within filing timeframe.
  2. Prepare details: who, what, when, where, and any witnesses.
  3. Gather documents: valid ID, supporting evidence (photos, messages), and witness contact.
  4. Visit the barangay hall; ask for the complaint/blotter form.
  5. Fill the form completely; be factual and concise.
  6. Submit the form with your ID; request a reference/case number.
  7. Attend mediation/hearing if scheduled; bring originals and arrive early.
  8. Follow up using your reference number; keep all receipts/notices.
- Resources: link to local complaint form (if available) and hotline.
- Disclaimers: Bantay does not accept complaints; emergencies require contacting authorities directly.

### Testing
- Python unit tests: map common phrasings to `guide_*` intents and verify step payload shape.
- Frontend tests: render GuideRenderer, ensure no booking UI appears.
- API integration test: `/api/ai/chatbot` returns `type: 'guide'` for complaint queries; booking queries receive guidance-only response.

### Acceptance Criteria
- Queries like “how do I file a complaint” show the above step-by-step guide.
- No appointment prompts or booking flows are ever shown.
- Quick-replies list guidance topics; selecting one displays the correct steps.
- All changes pass linting and tests.

## Open Questions
- Which top guidance topics beyond complaint should be prioritized (list up to 5)?
- Include Tagalog/Taglish responses or English-only?
- Provide downloadable forms or just instructions and links?
- Any barangay-specific policies to reflect (fees, hours, IDs accepted)?