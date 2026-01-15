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
    
    # Blotter/Complaint
    ("file a complaint", "blotter_inquiry"),
    ("report an incident", "blotter_inquiry"),
    ("blotter filing", "blotter_inquiry"),
    ("my neighbor is noisy", "blotter_inquiry"),
    ("report theft", "blotter_inquiry"),
    ("someone hurt me", "blotter_inquiry"),
    ("magrereklamo ako", "blotter_inquiry"),
    ("papa-blotter ako", "blotter_inquiry"),
    ("maingay ang kapitbahay", "blotter_inquiry"),
    ("may nagnakaw", "blotter_inquiry"),
    ("away magkapitbahay", "blotter_inquiry"),
    ("gusto ko magsumbong", "blotter_inquiry"),
    
    # Appointment
    ("schedule appointment", "appointment_request"),
    ("book a visit", "appointment_request"),
    ("meet the captain", "appointment_request"),
    ("can i go to the office", "appointment_request"),
    ("set a meeting", "appointment_request"),
    ("pwede ba magpa-schedule", "appointment_request"),
    ("kailan pwede pumunta", "appointment_request"),
    ("gusto ko makausap si kapitan", "appointment_request"),
    ("appointment para sa clearance", "appointment_request"),
    ("pupunta ako dyan", "appointment_request"),
    
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
    
    # Fee Inquiry
    ("how much is the fee", "fee_inquiry"),
    ("price of clearance", "fee_inquiry"),
    ("cost of documents", "fee_inquiry"),
    ("is it free", "fee_inquiry"),
    ("magkano ang bayad", "fee_inquiry"),
    ("libre ba ang indigency", "fee_inquiry"),
    ("magkano clearance", "fee_inquiry"),
    ("presyo ng permit", "fee_inquiry"),
]

INTENT_RESPONSES = {
    "greeting": {
        "text": "Hello! 👋 Ako si BANTAY, ang iyong barangay assistant. Matutulungan kita sa mga certificates, blotter, at schedule. Ano ang maitutulong ko?",
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
        "text": "Pwede kang mag-request ng mga sumusunod:\n\n• Barangay Clearance (₱50)\n• Certificate of Residency (₱30)\n• Certificate of Indigency (Libre)\n• Business Clearance (₱100)\n\nDalhin lang ang Valid ID at Cedula. Gusto mo bang mag-schedule ng appointment?",
        "actions": ["Schedule appointment"]
    },
    "blotter_inquiry": {
        "text": "Para mag-file ng reklamo o blotter:\n\n1. Pumunta sa Barangay Hall.\n2. Magdala ng Valid ID at ebidensya kung meron.\n3. Haharapin kayo ng Kagawad para sa mediation.\n\nGusto mo bang mag-book ng schedule?",
        "actions": ["Schedule appointment"]
    },
    "appointment_request": {
        "text": "Sige, tutulungan kita mag-schedule. Pakilagay ang petsa, oras, at sadya mo sa barangay.",
        "requires_followup": True,
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
    "fee_inquiry": {
        "text": "Presyo ng mga Dokumento:\n• Clearance: ₱50\n• Residency: ₱30\n• Business: ₱100\n• Indigency: Libre\n\nMay discount para sa Seniors at PWDs.",
        "actions": []
    },
    "fallback": {
        "text": "Pasensya na, hindi ko masyadong naintindihan. 🤔 Pwede mong itanong: 'Paano kumuha ng clearance?' o 'Magkano ang bayad?'",
        "actions": []
    }
}
