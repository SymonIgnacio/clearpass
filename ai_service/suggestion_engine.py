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

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "AI Priority Engine"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
