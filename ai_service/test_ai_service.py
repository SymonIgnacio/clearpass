#!/usr/bin/env python3
"""
Simple AI Service for ClearPass Integration Testing
This is a minimal implementation for testing the AI integration endpoints.
"""

from flask import Flask, request, jsonify
import os
from datetime import datetime
import random

app = Flask(__name__)

# Configuration
PORT = int(os.getenv('PORT', 5001))
DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ClearPass AI Service',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/ocr/extract', methods=['POST'])
def ocr_extract():
    """OCR text extraction endpoint"""
    try:
        data = request.get_json()
        image_data = data.get('image_data')
        document_type = data.get('document_type', 'general')
        
        if not image_data:
            return jsonify({'error': 'image_data is required'}), 400
        
        # Mock OCR processing
        mock_text = "BARANGAY CLEARANCE\nThis is to certify that...\nResident Name: Juan Dela Cruz\nAddress: Sitio 1, Barangay Sample"
        mock_fields = {
            'document_type': 'Barangay Clearance',
            'resident_name': 'Juan Dela Cruz',
            'address': 'Sitio 1, Barangay Sample',
            'date_issued': datetime.now().strftime('%Y-%m-%d')
        }
        
        return jsonify({
            'text': mock_text,
            'fields': mock_fields,
            'confidence': round(random.uniform(0.85, 0.98), 2),
            'processing_time': round(random.uniform(1.2, 3.5), 2)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chatbot/query', methods=['POST'])
def chatbot_query():
    """Chatbot query processing endpoint"""
    try:
        data = request.get_json()
        message = data.get('message', '').lower()
        context = data.get('context', {})
        user_id = data.get('user_id')
        
        if not message:
            return jsonify({'error': 'message is required'}), 400
        
        # Simple intent recognition
        if 'certificate' in message or 'clearance' in message:
            intent = 'certificate_inquiry'
            response = "To request a barangay certificate, please visit the office with valid ID and fill out the request form. Processing takes 1-3 business days."
        elif 'blotter' in message or 'complaint' in message:
            intent = 'blotter_inquiry'
            response = "To file a blotter report, please visit the barangay office during business hours (8AM-5PM) with relevant documents and witness information."
        elif 'hours' in message or 'schedule' in message:
            intent = 'office_hours'
            response = "Barangay office hours: Monday to Friday, 8:00 AM to 5:00 PM. Closed on weekends and holidays."
        else:
            intent = 'general'
            response = "Hello! I'm here to help with barangay services. You can ask about certificates, blotter reports, office hours, or other barangay services."
        
        return jsonify({
            'response': response,
            'intent': intent,
            'confidence': round(random.uniform(0.75, 0.95), 2),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analytics/<analytics_type>', methods=['GET'])
def get_analytics(analytics_type):
    """Analytics endpoint"""
    try:
        period = request.args.get('period', '30d')
        
        # Mock analytics data
        if analytics_type == 'blotter':
            analytics_data = {
                'total_cases': random.randint(15, 45),
                'resolved_cases': random.randint(10, 30),
                'pending_cases': random.randint(3, 15),
                'trend': 'decreasing',
                'common_incidents': ['Noise Complaint', 'Property Dispute', 'Minor Altercation']
            }
        elif analytics_type == 'certificates':
            analytics_data = {
                'total_issued': random.randint(50, 150),
                'most_requested': 'Barangay Clearance',
                'average_processing_time': '2.3 days',
                'trend': 'stable'
            }
        else:
            analytics_data = {
                'residents': random.randint(800, 1200),
                'households': random.randint(200, 400),
                'active_cases': random.randint(5, 20),
                'certificates_issued': random.randint(30, 80)
            }
        
        return jsonify({
            'type': analytics_type,
            'period': period,
            'data': analytics_data,
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print(f"Starting ClearPass AI Service on port {PORT}")
    print(f"Health check: http://localhost:{PORT}/health")
    app.run(host='0.0.0.0', port=PORT, debug=DEBUG)