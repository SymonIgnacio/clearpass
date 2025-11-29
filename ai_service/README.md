# Barangay AI Priority Service

This Python Flask service provides AI-powered priority calculation for social aid distribution in the barangay management system.

## Features

- **Priority Algorithm**: Determines social aid priority based on income, senior status, PWD status, and employment
- **REST API**: Simple HTTP endpoints for integration with Node.js backend
- **CORS Support**: Configured for cross-origin requests from frontend

## Priority Algorithm

### HIGH PRIORITY (Score: 80-100)
- Monthly income < ₱10,000
- OR Senior citizen (65+)
- OR Person with Disability (PWD)

### LOW PRIORITY (Score: 0-20)
- Monthly income > ₱20,000 AND Employed

### MEDIUM PRIORITY (Score: 40-60)
- All other cases

## API Endpoints

### POST /api/calculate-priority
Calculate priority for a resident.

**Request Body:**
```json
{
  "monthly_income": 8500,
  "is_senior": false,
  "is_pwd": true,
  "occupation": "Unemployed"
}
```

**Response:**
```json
{
  "priority": "HIGH",
  "score": 95,
  "reasons": ["PWD member", "Low income (< ₱10,000/month)"]
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "AI Priority Engine"
}
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- pip

### Installation

1. Create a virtual environment (recommended):
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
python suggestion_engine.py
```

The service will start on `http://localhost:5000` by default.

### Environment Variables

Create a `.env` file in the ai_service directory:

```env
FLASK_ENV=development
PORT=5000
DEBUG=True
CORS_ORIGINS=http://localhost:3001,http://localhost:5173
```

## Testing

Test the priority calculation:

```bash
curl -X POST http://localhost:5000/api/calculate-priority \
  -H "Content-Type: application/json" \
  -d '{"monthly_income": 8500, "is_senior": false, "is_pwd": true, "occupation": "Unemployed"}'
```

Expected response:
```json
{
  "priority": "HIGH",
  "score": 95,
  "reasons": ["PWD member", "Low income (< ₱10,000/month)"]
}
```

## Integration

This service is designed to be called by the Node.js backend via HTTP requests. The Node.js server should proxy requests to this AI service and return the results to the frontend.

## Development

- Uses Flask with CORS support
- Environment-based configuration
- Error handling for invalid requests
- Health check endpoint for monitoring
