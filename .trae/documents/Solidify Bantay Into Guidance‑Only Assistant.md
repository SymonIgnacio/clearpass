## How It Works Today
- Chat UI sends messages to backend and renders bot text, action chips, and typing state: [Chatbot.jsx](file:///c:/xampp/htdocs/clearpass/client/src/components/Chatbot.jsx).
- Python AI accepts messages, predicts intent, returns response payload: [suggestion_engine.py:chatbot_message](file:///c:/xampp/htdocs/clearpass/ai_service/suggestion_engine.py#L209-L258) using NLU: [chatbot_engine.py](file:///c:/xampp/htdocs/clearpass/ai_service/chatbot_engine.py) with training/responses: [chatbot_data.py](file:///c:/xampp/htdocs/clearpass/ai_service/chatbot_data.py).
- Node proxies /api/ai/chatbot and audits: [aiRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/aiRoutes.js#L33-L81).
- Resident complaint filing exists in‑app (not at the barangay desk):
  - Dashboard button → /resident/blotter-report: [ResidentDashboard.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/ResidentDashboard.jsx#L481-L494)
  - Form page: [ResidentBlotterReport.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/ResidentBlotterReport.jsx)
  - Submit → POST /api/blotter-complaints/submit: [blotterComplaintController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/blotterComplaintController.js#L37-L143)
- Resident certificate request flows:
  - Launcher & list: [ResidentCertificates.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/ResidentCertificates.jsx)
  - Dynamic request form: [CertificateRequest.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/CertificateRequest.jsx)
  - Server routes: [certificateRequestRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/certificateRequestRoutes.js) and controller [certificateRequestController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/certificateRequestController.js)

## Changes We Will Implement

### 1) Guidance‑Only Intents & Content (Python)
- Replace any “go to barangay hall” text with in‑app guidance that references the resident pages and actions.
- Add/expand guidance intents returning a structured payload `{type: 'guide', title, steps, fields, examples, links, disclaimers}`.
- Target intents:
  - guide_file_complaint
  - guide_barangay_clearance
  - guide_residency_certificate
  - guide_indigency_certificate
  - guide_track_requests
  - faq_hours, faq_contact (kept as info, not scheduling)
- Training phrases include English/Tagalog/Taglish “how to”, “paano”, “requirements”, “steps”.
- Dynamic content pulls labels from templates/certificate types when available to keep wording consistent.

### 2) Complaint Guide (Resident Side)
- Steps shown by Bantay (no scheduling, no desk referrals):
  1. Open Resident Dashboard → click File a Complaint or go to /resident/blotter-report.
  2. Fill Incident Type. If not in list, choose Others and specify.
  3. Select Location Sitio (where incident happened).
  4. Set Date & Time of Incident.
  5. Write Description (facts only: who, what, when, where; include witnesses).
  6. Optional Respondent Details: Name/Alias, Contact, Address.
  7. Optional Evidence Upload: images or PDF that support the incident.
  8. Submit. You’ll receive a case number; track status in My Blotter Complaints.
- Field definitions (what to put):
  - Incident Type: choose closest category; use Others for custom.
  - Location Sitio: exact sitio of the incident.
  - DateTime: the actual incident date/time.
  - Description: 3–6 sentences, factual timeline; avoid conjecture.
  - Respondent: only if known; leave blank if unknown.
  - Evidence: clear photos/screenshots; redact sensitive info when needed.
- Disclaimers: Bantay does not submit on your behalf; guests must verify before submission.
- References: [ResidentBlotterReport.jsx fields](file:///c:/xampp/htdocs/clearpass/client/src/pages/ResidentBlotterReport.jsx#L177-L292) and API [blotterComplaintController.js](file:///c:/xampp/htdocs/clearpass/server/controllers/blotterComplaintController.js#L96-L143).

### 3) Certificate Guides (Dynamic)
- Barangay Clearance:
  - Steps:
    1. Go to Certificates → Request Certificate.
    2. Select “Barangay Clearance”.
    3. Provide Purpose (e.g., Employment, School Requirement).
    4. Review auto‑filled resident details.
    5. Upload Valid ID (front and back).
    6. Submit and track in Requests.
  - Field definitions:
    - Purpose: short reason (English/Tagalog); avoid sensitive details.
    - Resident Info: ensure your profile is updated if incorrect.
    - ID Uploads: clear photos; full card visible; no glare.
  - References: [ResidentCertificates.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/ResidentCertificates.jsx#L211-L242), [CertificateRequest.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/CertificateRequest.jsx#L310-L369), templates [document_templates.js](file:///c:/xampp/htdocs/clearpass/server/migrations/20250105000000_document_templates.js).
- Certificate of Residency:
  - Include years_of_residency if present; same steps as clearance.
  - Define “Years of Residency”: full years living at your current address.
  - References: [document_templates.js](file:///c:/xampp/htdocs/clearpass/server/migrations/20250105000000_document_templates.js#L61-L76).
- Certificate of Indigency:
  - Steps identical; define specific_purpose and purpose: e.g., “Hospital Assistance”, “Scholarship”.
  - References: [document_templates.js](file:///c:/xampp/htdocs/clearpass/server/migrations/20250105000000_document_templates.js#L42-L56).
- Track Requests:
  - Guide users to /resident/requests; explain statuses and cancel rules.
  - References: [RequestHistory.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/RequestHistory.jsx).

### 4) Chat UI Enhancements (Frontend)
- Render guides with numbered steps, field definitions, examples, disclaimers.
- Replace any action chips that suggest scheduling/bookings with:
  - “Open File Complaint Page” → deep‑link to /resident/blotter-report.
  - “Open Request Certificate” → deep‑link to /resident/request-certificate.
  - “Open My Requests” → /resident/requests.
- Quick replies updated to guidance topics: File Complaint, Request Certificate, Track Requests, Office Hours, Contact.
- Persistent note: “Bantay gives guidance only and does not submit requests.”

### 5) Node Proxy Guard (Backend)
- Enforce guidance‑only: strip booking actions; never return follow‑up scheduling fields.
- Continue auditing intents; log guide usage frequency for analytics.

### 6) Testing
- Python unit tests: verify guide intents return structured payloads with steps/fields.
- Frontend tests: render GuideRenderer; deep‑link buttons navigate to the correct resident pages.
- Backend tests: proxy strips booking actions; returns guidance payload only.

### 7) Acceptance Criteria
- Clicking “File Complaint” shows the in‑app step‑by‑step guide referencing the resident form; no “go to barangay hall” phrasing.
- Similar guidance exists for Clearance, Residency, Indigency, and Track Requests with field definitions.
- Action chips provide deep links to resident pages; no scheduling or booking flows.
- All tests pass and linting has zero warnings.

## Clarifications
- Languages: bilingual guidance (English + Tagalog) or English‑only?
- Evidence upload constraints: confirm max size/types to mention in guidance.
- Any barangay‑specific template fields to highlight (fees, validity period)?
