"""
Training data for the Barangay Chatbot NLU model.
Contains labeled examples for intent classification and corresponding responses.
Includes English, Tagalog, and Taglish phrases for better localization.
"""

TRAINING_DATA = [
    # Greeting
    ("hello", "greeting"),
    ("hi there", "greeting"),
    ("good morning", "greeting"),
    ("good afternoon", "greeting"),
    ("hey bantay", "greeting"),
    ("how are you", "greeting"),
    ("kamusta", "greeting"),
    ("musta", "greeting"),
    ("magandang umaga", "greeting"),
    ("magandang hapon", "greeting"),
    ("oy", "greeting"),
    
    # Farewell
    ("goodbye", "farewell"),
    ("bye", "farewell"),
    ("see you later", "farewell"),
    ("thanks bye", "farewell"),
    ("paalam", "farewell"),
    ("alis na ko", "farewell"),
    ("sige bye", "farewell"),
    
    # Gratitude
    ("thank you", "gratitude"),
    ("thanks", "gratitude"),
    ("salamat", "gratitude"),
    ("appreciate it", "gratitude"),
    ("maraming salamat", "gratitude"),
    ("thank you po", "gratitude"),
    
    # Certificate Inquiry
    ("i need a clearance", "certificate_inquiry"),
    ("how to get barangay clearance", "certificate_inquiry"),
    ("certificate requirements", "certificate_inquiry"),
    ("indigency certificate", "certificate_inquiry"),
    ("residency proof", "certificate_inquiry"),
    ("business permit clearance", "certificate_inquiry"),
    ("document request", "certificate_inquiry"),
    ("paano kumuha ng clearance", "certificate_inquiry"),
    ("requirements para sa indigency", "certificate_inquiry"),
    ("kukuha ng cedula", "certificate_inquiry"),
    ("certificate of residency", "certificate_inquiry"),
    ("may bayad ba ang clearance", "certificate_inquiry"),
    ("papel para sa trabaho", "certificate_inquiry"),
    ("request ako ng document", "certificate_inquiry"),
    ("how to request certificate", "guide_barangay_clearance"),
    ("how to request barangay clearance", "guide_barangay_clearance"),
    ("how to request residency certificate", "guide_residency_certificate"),
    ("how to request indigency certificate", "guide_indigency_certificate"),
    
    # Blotter/Complaint
    ("file a complaint", "guide_file_complaint"),
    ("how to file a complaint", "guide_file_complaint"),
    ("paano mag file ng reklamo", "guide_file_complaint"),
    ("report an incident", "guide_file_complaint"),
    ("blotter filing", "guide_file_complaint"),
    ("my neighbor is noisy", "blotter_inquiry"),
    ("report theft", "blotter_inquiry"),
    ("someone hurt me", "blotter_inquiry"),
    ("magrereklamo ako", "blotter_inquiry"),
    ("papa-blotter ako", "blotter_inquiry"),
    ("maingay ang kapitbahay", "blotter_inquiry"),
    ("may nagnakaw", "blotter_inquiry"),
    ("away magkapitbahay", "blotter_inquiry"),
    ("gusto ko magsumbong", "blotter_inquiry"),
    
    # Certificates specific guides
    ("request certificate", "guide_barangay_clearance"),
    ("barangay clearance", "guide_barangay_clearance"),
    ("paano kumuha ng barangay clearance", "guide_barangay_clearance"),
    ("certificate of residency", "guide_residency_certificate"),
    ("residency certificate", "guide_residency_certificate"),
    ("bonafide residency", "guide_residency_certificate"),
    ("indigency certificate", "guide_indigency_certificate"),
    ("paano kumuha ng indigency", "guide_indigency_certificate"),
    ("track my requests", "guide_track_requests"),
    ("check my certificate requests", "guide_track_requests"),
    
    # FAQ - Hours
    ("office hours", "faq_hours"),
    ("when are you open", "faq_hours"),
    ("what time do you close", "faq_hours"),
    ("are you open on sundays", "faq_hours"),
    ("anong oras bukas", "faq_hours"),
    ("bukas ba kayo ngayon", "faq_hours"),
    ("hanggang anong oras kayo", "faq_hours"),
    ("may pasok ba sa sabado", "faq_hours"),
    
    # FAQ - Contact
    ("contact number", "faq_contact"),
    ("email address", "faq_contact"),
    ("where is the hall", "faq_contact"),
    ("location", "faq_contact"),
    ("ano number niyo", "faq_contact"),
    ("saan banda ang barangay hall", "faq_contact"),
    ("paano tumawag sa inyo", "faq_contact"),
]

INTENT_RESPONSES = {
    "greeting": {
        "text": "Hello! 👋 Ako si BANTAY, ang iyong barangay assistant. Tutulong ako sa step‑by‑step guides para sa certificates, blotter, at FAQs. Ano ang maitutulong ko?",
        "actions": []
    },
    "guide_file_complaint": {
        "type": "guide",
        "title": "File a Complaint (Barangay)",
        "steps": [
            "Open Resident Dashboard → click File a Complaint or go to /resident/blotter-report.",
            "Fill Incident Type. Use Others if your case is not listed.",
            "Select Location Sitio of the incident.",
            "Set Date and Time of Incident accurately.",
            "Write a factual Description (who, what, when, where, witnesses).",
            "Optional: Add Respondent Details (name/alias, contact, address) if known.",
            "Optional: Upload evidence (images/PDF) supporting your report.",
            "Submit to receive your case number. Track status in My Blotter Complaints."
        ],
        "fields": {
            "incident_type": "Choose closest category; use Others for custom type.",
            "location_sitio": "Sitio where incident happened.",
            "datetime_incident": "Actual incident date and time.",
            "description": "3–6 sentence factual narrative; avoid conjecture.",
            "respondent": "Only if known; leave blank if unknown.",
            "evidence": "Clear photos/screenshots/PDF; redact sensitive info."
        },
        "examples": {
            "description": "On Jan 10 at 8:30 PM in Northville 5, my neighbor played loud music despite requests to lower volume. Witness: Juan D."
        },
        "resources": [
            {"label": "Open File Complaint Page", "url": "/resident/blotter-report"},
            {"label": "View My Complaints", "url": "/resident/blotter-history"}
        ],
        "disclaimers": [
            "Bantay provides guidance only and does not submit on your behalf.",
            "Guests must verify residency before submission."
        ],
        "text": "Step‑by‑step: File a Complaint in your Resident Dashboard. Fill the Incident Type, Location Sitio, Date/Time, and Description. Optionally add Respondent details and upload evidence. Submit to receive a case number and track status.",
        "actions": []
    },
    "guide_barangay_clearance": {
        "type": "guide",
        "title": "Request Barangay Clearance",
        "steps": [
            "Go to Certificates → Request Certificate.",
            "Select Barangay Clearance.",
            "Provide Purpose (e.g., Employment, School Requirement).",
            "Review auto‑filled resident details; update your profile if needed.",
            "Upload Valid ID (front and back).",
            "Submit and track in My Requests."
        ],
        "fields": {
            "certificate_type": "Select 'Barangay Clearance'.",
            "purpose": "Short reason for requesting the document.",
            "id_front": "Clear photo of the front side of your ID.",
            "id_back": "Clear photo of the back side of your ID."
        },
        "examples": {
            "purpose": "Employment requirements for ABC Company."
        },
        "resources": [
            {"label": "Open Request Certificate", "url": "/resident/request-certificate"},
            {"label": "Open Create Request", "url": "/resident/create-request"},
            {"label": "Open My Requests", "url": "/resident/requests"}
        ],
        "disclaimers": [
            "Bantay provides guidance only and does not submit on your behalf."
        ],
        "text": "Request a Barangay Clearance: select type, add Purpose, upload ID front/back, then submit. Track in My Requests.",
        "actions": []
    },
    "guide_residency_certificate": {
        "type": "guide",
        "title": "Request Certificate of Residency",
        "steps": [
            "Go to Certificates → Request Certificate.",
            "Select Certificate of Residency.",
            "Provide Purpose and Years of Residency if required.",
            "Review auto‑filled resident details.",
            "Upload Valid ID (front and back).",
            "Submit and track in My Requests."
        ],
        "fields": {
            "years_of_residency": "Full years living at your current address.",
            "purpose": "Reason for requesting the certificate."
        },
        "examples": {
            "purpose": "Bank account opening requirement."
        },
        "resources": [
            {"label": "Open Request Certificate", "url": "/resident/request-certificate"},
            {"label": "Open My Requests", "url": "/resident/requests"}
        ],
        "disclaimers": [
            "Bantay provides guidance only and does not submit on your behalf."
        ],
        "text": "Request a Residency certificate: select type, add Purpose and Years of Residency if needed, upload IDs, submit.",
        "actions": []
    },
    "guide_indigency_certificate": {
        "type": "guide",
        "title": "Request Certificate of Indigency",
        "steps": [
            "Go to Certificates → Request Certificate.",
            "Select Certificate of Indigency.",
            "Provide Purpose and Specific Purpose (e.g., Hospital Assistance, Scholarship).",
            "Review auto‑filled resident details.",
            "Upload Valid ID (front and back).",
            "Submit and track in My Requests."
        ],
        "fields": {
            "purpose": "General reason for requesting indigency.",
            "specific_purpose": "More specific reason if required by the template."
        },
        "examples": {
            "specific_purpose": "Medical assistance application at Provincial Hospital."
        },
        "resources": [
            {"label": "Open Request Certificate", "url": "/resident/request-certificate"},
            {"label": "Open My Requests", "url": "/resident/requests"}
        ],
        "disclaimers": [
            "Bantay provides guidance only and does not submit on your behalf."
        ],
        "text": "Request an Indigency certificate: select type, add Purpose and Specific Purpose, upload IDs, submit.",
        "actions": []
    },
    "guide_track_requests": {
        "type": "guide",
        "title": "Track My Certificate Requests",
        "steps": [
            "Open My Requests page.",
            "Find your request by date or type.",
            "Check status (Pending, Approved, Rejected).",
            "Download issued certificates when available.",
            "Use Cancel if allowed by rules."
        ],
        "fields": {},
        "examples": {},
        "resources": [
            {"label": "Open My Requests", "url": "/resident/requests"}
        ],
        "disclaimers": [],
        "text": "Track your certificate requests and view statuses on the My Requests page.",
        "actions": []
    },
    "farewell": {
        "text": "Paalam! 👋 Salamat sa paggamit ng BANTAY. Ingat po kayo!",
        "actions": []
    },
    "gratitude": {
        "text": "Walang anuman! 👋 Nandito lang ako para tumulong sa barangay.",
        "actions": []
    },
    "certificate_inquiry": {
        "text": "Pwede kang mag‑request ng mga sumusunod:\n\n• Barangay Clearance\n• Certificate of Residency\n• Certificate of Indigency\n• Business Clearance\n\nSabihin mo lang kung alin ang kailangan mo at ibibigay ko ang step‑by‑step guide. Note: Bantay ay guidance‑only at hindi nagse‑submit ng requests.",
        "actions": []
    },
    "blotter_inquiry": {
        "text": "Makakatulong ako magbigay ng step‑by‑step guide sa pag‑file ng reklamo/blotter. Sabihin mo: “File a complaint” o “Paano magpa‑blotter?” para maipakita ang mga hakbang. Note: Bantay ay guidance‑only.",
        "actions": []
    },
    "faq_hours": {
        "text": "🏢 Oras ng Opisina:\nMon-Fri: 8:00 AM - 5:00 PM\nSat: 8:00 AM - 12:00 NN\nSun & Holidays: Sarado",
        "actions": []
    },
    "faq_contact": {
        "text": "📞 Contact Us:\nTelepono: (02) 123-4567\nEmail: info@barangay-batia.gov.ph\nAddress: Barangay Hall, Batia, Bocaue, Bulacan",
        "actions": []
    },
    "fallback": {
        "text": "Pasensya na, hindi ko masyadong naintindihan. 🤔 Pwede mong itanong: 'Paano kumuha ng clearance?' o 'Anong oras bukas ang barangay?'",
        "actions": []
    }
}
