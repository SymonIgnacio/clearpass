from flask import Flask, request, jsonify
from flask_cors import CORS
from flasgger import Swagger
import os
from dotenv import load_dotenv
from datetime import datetime
from chatbot_engine import chatbot

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
swagger = Swagger(app)

# Authentication Middleware
@app.before_request
def check_auth():
    # Skip auth for health check and swagger docs
    if request.path == '/health' or request.path.startswith('/apidocs') or request.path.startswith('/flasgger_static'):
        return
        
    # Get secret from env or use default for dev
    secret = os.environ.get('AI_SERVICE_SECRET', 'clearpass-ai-secret-dev')
    auth_header = request.headers.get('X-Service-Key')
    
    if auth_header != secret:
        return jsonify({"error": "Unauthorized access to AI Service"}), 401

# Ensure the chatbot model is trained with latest data at service start
try:
    chatbot.force_retrain()
except Exception:
    pass

@app.route('/chatbot/message', methods=['POST'])
def chatbot_message():
    """
    BANTAY Chatbot message processing endpoint using ML NLU.
    ---
    tags:
      - Chatbot
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            message:
              type: string
    responses:
      200:
        description: Chatbot response
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()

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

        # Use the ML Chatbot Engine to predict intent
        intent, confidence, response_info = chatbot.predict(user_message)
        
        response_data = {
            "response": response_info["text"],
            "intent": intent,
            "confidence": float(confidence),
            "actions": response_info.get("actions", []),
            "appointment_booked": False,
            "requires_followup": response_info.get("requires_followup", False),
            "type": response_info.get("type", "text"),
            "steps": response_info.get("steps", []),
            "resources": response_info.get("resources", []),
            "disclaimers": response_info.get("disclaimers", []),
            "timestamp": datetime.now().isoformat()
        }

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
    """
    Health check endpoint
    ---
    tags:
      - System
    responses:
      200:
        description: Service is healthy
    """
    return jsonify({
            "status": "healthy", 
            "service": "AI Priority Engine",
            "models": {
                "chatbot_nlu": "loaded" if chatbot.is_trained else "failed"
            }
        })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port)
