from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import json
import random
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Mock data for patrol suggestions when AI service is not available
MOCK_PATROL_DATA = {
    "overall_risk_level": "MEDIUM",
    "risk_assessment": {
        "total_incidents": 12,
        "high_risk_sitios": ["Batia Proper", "Northville 5"],
        "peak_hours": "8PM-2AM",
        "trend": "STABLE"
    },
    "patrol_suggestions": [
        "Increase patrol presence in Batia Proper during evening hours",
        "Focus on theft prevention in Northville 5 commercial areas",
        "Monitor noise complaints in residential zones",
        "Establish additional checkpoints at high-traffic areas",
        "Coordinate with local PNP for joint patrols"
    ],
    "recommended_schedule": {
        "priority_areas": ["Batia Proper", "Northville 5", "St. Martha"],
        "suggested_tanods": 6,
        "shift_coverage": "18:00-06:00"
    },
    "generated_at": None,
    "fallback": True
}

@app.route('/api/calculate-priority', methods=['POST'])
def calculate_priority():
    """
    Calculate social aid priority based on resident data.

    Priority Algorithm:
    - HIGH PRIORITY: Income < ₱10,000/month OR Senior (65+) OR PWD
    - LOW PRIORITY: Income > ₱20,000/month AND Employed
    - MEDIUM PRIORITY: All other cases

    Request JSON:
    {
        "monthly_income": 8500,
        "is_senior": false,
        "is_pwd": true,
        "occupation": "Unemployed"
    }

    Response JSON:
    {
        "priority": "HIGH",
        "score": 95,
        "reasons": ["PWD member", "Low income"]
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Extract data with defaults
        monthly_income = data.get('monthly_income', 0)
        is_senior = data.get('is_senior', False)
        is_pwd = data.get('is_pwd', False)
        occupation = data.get('occupation', '').strip()

        # Determine employment status
        is_employed = bool(occupation and occupation.lower() != 'unemployed' and occupation.lower() != 'none')

        reasons = []
        priority_score = 50  # Base score

        # HIGH PRIORITY conditions
        if monthly_income < 10000:
            reasons.append("Low income (< ₱10,000/month)")
            priority_score += 40
        if is_senior:
            reasons.append("Senior citizen")
            priority_score += 30
        if is_pwd:
            reasons.append("PWD member")
            priority_score += 30

        # If any HIGH criteria met, it's HIGH
        if reasons:
            priority = "HIGH"
            priority_score = min(priority_score, 100)
        else:
            # Check LOW PRIORITY
            if monthly_income > 20000 and is_employed:
                priority = "LOW"
                priority_score = 10
                reasons.append("High income and employed")
            else:
                priority = "MEDIUM"
                priority_score = 50
                reasons.append("Moderate priority case")

        return jsonify({
            "priority": priority,
            "score": priority_score,
            "reasons": reasons
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/suggest-patrol', methods=['POST'])
def suggest_patrol():
    """
    AI-powered patrol deployment suggestions based on blotter data.

    Returns patrol recommendations and risk assessment.
    """
    try:
        data = request.get_json()
        blotter_data = data.get('blotter_data', [])

        # For now, return mock data based on blotter data length
        response_data = MOCK_PATROL_DATA.copy()
        response_data["generated_at"] = datetime.now().isoformat()
        response_data["risk_assessment"]["total_incidents"] = len(blotter_data)

        # Adjust risk level based on incident count
        if len(blotter_data) > 20:
            response_data["overall_risk_level"] = "HIGH"
            response_data["patrol_suggestions"].insert(0, "URGENT: Deploy maximum patrol resources immediately")
        elif len(blotter_data) > 10:
            response_data["overall_risk_level"] = "MEDIUM"
        else:
            response_data["overall_risk_level"] = "LOW"
            response_data["patrol_suggestions"] = [
                "Maintain regular patrol schedule",
                "Monitor community reports",
                "Conduct routine security checks"
            ]

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": str(e), "fallback": True, **MOCK_PATROL_DATA}), 500

@app.route('/chatbot/message', methods=['POST'])
def chatbot_message():
    """
    BANTAY Chatbot message processing endpoint.
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '').lower().strip()

        if not user_message:
            return jsonify({
                "response": "Hello! I'm BANTAY, your barangay assistant. How can I help you today?",
                "intent": "greeting",
                "confidence": 1.0,
                "actions": [],
                "appointment_booked": False,
                "requires_followup": False,
                "timestamp": datetime.now().isoformat()
            })

        # Simple intent detection and response logic
        response_data = {
            "response": "",
            "intent": "general_inquiry",
            "confidence": 0.8,
            "actions": [],
            "appointment_booked": False,
            "requires_followup": False,
            "timestamp": datetime.now().isoformat()
        }

        # Enhanced keyword matching for intents with better responses
        if any(word in user_message for word in ['certificate', 'clearance', 'residency', 'indigency', 'business', 'good moral']):
            response_data["intent"] = "certificate_inquiry"
            response_data["response"] = "We offer several types of certificates:\n\n• Barangay Clearance (₱50) - For general purposes\n• Certificate of Residency (₱30) - Proof of residence\n• Certificate of Indigency (Free) - For financial assistance\n• Business Clearance (₱100) - For business operations\n\nRequirements typically include: Valid ID, proof of residency, cedula, and applicable fees.\n\nWould you like to schedule an appointment to apply?"
            response_data["actions"] = ["Schedule appointment for certificate"]

        elif any(word in user_message for word in ['blotter', 'report', 'complaint', 'incident', 'file']):
            response_data["intent"] = "blotter_inquiry"
            response_data["response"] = "For filing a blotter report (complaint/incident):\n\n• Come to the barangay office with your valid ID\n• Bring at least one witness if possible\n• Provide detailed description of the incident\n• Any supporting evidence or documents\n\nOur barangay officers will mediate and help resolve the issue through the Katarungang Pambarangay process.\n\nWould you like to schedule an appointment?"
            response_data["actions"] = ["Schedule appointment for blotter filing"]

        elif any(word in user_message for word in ['appointment', 'schedule', 'meet', 'book', 'see']):
            response_data["intent"] = "appointment_request"
            response_data["response"] = "I can help you schedule an appointment for:\n\n• Certificate applications\n• Blotter report filing\n• General inquiries\n• Residency verification\n\nPlease specify what type of service you need, and provide your preferred date and time."
            response_data["requires_followup"] = True

        elif any(word in user_message for word in ['hours', 'open', 'close', 'time', 'office', 'schedule']):
            response_data["intent"] = "faq"
            response_data["response"] = "🏢 Barangay Office Hours:\n\n• Monday - Friday: 8:00 AM - 5:00 PM\n• Saturday: 8:00 AM - 12:00 NN\n• Sunday & Holidays: CLOSED\n\n📍 Location: Barangay Hall, [Your Barangay Name]\n📞 Contact: (02) 123-4567\n📧 Email: info@barangay-batia.gov.ph"

        elif any(word in user_message for word in ['thank', 'thanks', 'appreciate']):
            response_data["intent"] = "gratitude"
            response_data["response"] = "You're welcome! 👋 Feel free to ask me anything about barangay services. I'm here to help our community."

        elif any(word in user_message for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']):
            response_data["intent"] = "greeting"
            response_data["response"] = "Hello! 👋 I'm BANTAY, your barangay assistant. I can help you with:\n\n• 📄 Certificate requests and requirements\n• 📅 Appointment scheduling\n• 📝 Filing blotter reports\n• ℹ️ General barangay information\n\nWhat would you like to know?"

        elif any(word in user_message for word in ['bye', 'goodbye', 'see you']):
            response_data["intent"] = "farewell"
            response_data["response"] = "Goodbye! 👋 Thank you for using BANTAY. Have a great day!"

        else:
            # Try to provide helpful context even for unrecognized queries
            if any(word in user_message for word in ['fee', 'cost', 'price', 'payment']):
                response_data["intent"] = "fee_inquiry"
                response_data["response"] = "Certificate fees:\n• Barangay Clearance: ₱50\n• Certificate of Residency: ₱30\n• Certificate of Indigency: Free\n• Business Clearance: ₱100\n\nProcessing time is usually 10-15 minutes."
            elif any(word in user_message for word in ['contact', 'phone', 'email', 'address']):
                response_data["intent"] = "contact_inquiry"
                response_data["response"] = "📞 Contact Information:\n\n📍 Address: Barangay Hall, [Your Barangay Name]\n📞 Phone: (02) 123-4567\n📧 Email: info@barangay-batia.gov.ph\n🌐 Website: www.barangay-batia.gov.ph"
            else:
                response_data["response"] = "I understand you're asking about barangay services. 🤔 Could you please provide more details about what you need help with? I can assist with:\n\n• Certificate applications\n• Appointment scheduling\n• Blotter reports\n• Office information\n• Contact details\n\nTry asking something like 'How do I get a barangay clearance?' or 'What are your office hours?'"

        return jsonify(response_data)

    except Exception as e:
        return jsonify({
            "response": "Sorry, I'm having trouble processing your message right now. Please try again later.",
            "intent": "error",
            "confidence": 0.0,
            "actions": [],
            "appointment_booked": False,
            "requires_followup": False,
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "AI Priority Engine"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
