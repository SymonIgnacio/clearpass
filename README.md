# BMWs Barangay Management System

A modern web application for Barangay Batia administration with AI-powered decision support. Built with React, Node.js, MySQL, and Python.

## 🏗️ System Overview

**Current Status:** ~85% Complete
**Tech Stack:** React 18 + Node.js + MySQL + Python Flask
**Database:** bmw_barangay_batia (9 tables)

### Architecture
```
BMW System
├── client/          # React Frontend (Port 5173)
├── server/          # Node.js API (Port 3001)
├── ai_service/      # Python AI (Port 5000)
├── database/        # MySQL Schema
└── tests/           # Test Suite (80% coverage)
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Material-UI (MUI)** for professional UI components
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Node.js + Express** for RESTful API
- **MySQL** with connection pooling
- **JWT** for authentication (ready for implementation)
- **CORS** enabled for cross-origin requests

### AI Service
- **Python Flask** with REST API
- **Data analysis** with Pandas & Scikit-learn
- **Real-time decision support**

### Testing
- **Jest** for comprehensive test suite
- **Business rule validation**
- **AI algorithm accuracy testing**
- **Integration testing**

## 📊 Database Schema

### Core Tables
- `sitios` - Hardcoded barangay areas (Batia Proper, Northville 5, St. Martha, AFP/PNP)
- `residents` - Complete resident profiles with vulnerability flags
- `blotter` - Incident reporting with status tracking
- `certificates` - Certificate issuance with audit trails
- `tanod_schedule` - Patrol shift management
- `users` - Authentication system (prepared)

## 🧪 Testing Suite

Comprehensive test coverage including:

### Critical Business Rules Tests
- Certificate-blotter integration validation
- Status update impact verification
- Error message accuracy testing

### AI Algorithm Tests
- Priority scoring accuracy (±5 point variance allowed)
- Patrol recommendation logic validation
- Integration endpoint testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- MySQL 8.0+
- npm/yarn package managers

### Installation

1. **Clone and setup:**
```bash
git clone <repository-url>
cd barangay-management-system
npm run install:all
```

2. **Database setup:**
```sql
-- Import schema
source database/schema.sql;
```

3. **Environment configuration:**
```bash
# Copy and configure .env
cp .env.example .env
# Edit database credentials and ports
```

4. **Start all services:**
```bash
npm run dev:all
```

Services will start on:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- AI Service: http://localhost:5000

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## 🔒 Security Features

- Input validation and sanitization
- SQL injection prevention with parameterized queries
- CORS configuration for secure API access
- Business rule enforcement at API level
- Audit trails for certificate issuance

## 🎯 Business Rules Implemented

### Certificate Issuance Logic
```javascript
// CRITICAL: Check blotter before certificate issuance
if (certificate_type.includes('clearance')) {
  const activeCases = await checkBlotterStatus(resident_id);
  if (activeCases.count > 0) {
    throw new Error('BLOCK ISSUANCE: Resident has unsettled case');
  }
}
```

### AI Priority Algorithm
```python
# Social Aid Priority Logic
if monthly_income < 10000 or is_senior or is_pwd:
    priority = "HIGH"
elif monthly_income > 20000 and is_employed:
    priority = "LOW"
else:
    priority = "MEDIUM"
```

### Patrol Deployment Logic
```python
# Predictive Policing Algorithm
if incidents >= 5:
    suggestion = "Deploy 4 Tanods + Roving Patrol"
elif incidents >= 2:
    suggestion = "Deploy 2 Tanods"
else:
    suggestion = "Standard Patrol (1 Tanod)"
```

## 📈 Performance & Scalability

- Database connection pooling
- Indexed queries for fast data retrieval
- Efficient API response caching
- Modular architecture for easy scaling
- Comprehensive error handling

## 🔧 Development

### Project Structure
```
├── client/src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   └── App.jsx        # Main application
├── server/
│   ├── index.js       # Express server
│   ├── database.js    # Database operations
│   └── aiService.js   # AI service integration
├── ai_service/
│   └── smart_suggestions.py  # AI algorithms
└── tests/             # Test suite
```

### API Endpoints
- `GET/POST/PUT/DELETE /api/residents` - Resident management
- `GET/POST /api/blotter` - Incident reporting
- `POST /api/certificates` - Certificate issuance
- `GET /api/census` - Population statistics
- `POST /api/ai/priority` - Social aid prioritization
- `GET /api/ai/patrol-suggestions` - Patrol recommendations

## 🤝 Contributing

1. Follow the established code structure
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass before committing

## 📝 License

This project is developed for barangay administration purposes.

## 🆘 Support

For technical support or feature requests, please refer to the test suite and documentation within the codebase.

---

**Built with ❤️ for efficient barangay management and community safety.**
