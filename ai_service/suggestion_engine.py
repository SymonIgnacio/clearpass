from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "AI Priority Engine"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
