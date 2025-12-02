# Barangay Management System - Test Suite

Comprehensive automated test suite covering all modules, functionalities, and AI components of the Barangay Management System.

## 🧪 Test Coverage Overview

### **Backend API Tests (Jest + Supertest)**
- **Authentication & Authorization** - JWT, role-based access, user management
- **Resident Management** - CRUD operations, RBIM compliance, duplicate detection
- **Certificate Issuance** - Business rules, blotter blocking, QR validation
- **Blotter Management** - Incident reporting, Katarungang Pambarangay workflow
- **AI Integration** - Service communication, fallback mechanisms

### **Frontend Component Tests (React Testing Library + Vitest)**
- **App Component** - Authentication flow, routing, error handling
- **Page Components** - Dashboard, Residents, Certificates, etc.
- **UI Components** - Forms, data grids, navigation
- **Integration** - Component interaction, state management

### **AI Service Tests (Pytest)**
- **Chatbot Engine** - Intent classification, FAQ matching, fuzzy logic
- **Blotter Analytics** - Category counting, time-based grouping, forecasting
- **OCR Processing** - Text extraction, field parsing, error correction
- **Integration Workflows** - End-to-end AI pipelines

## 📁 Test Structure

```
tests/
├── __init__.py                           # Python package init
├── requirements.txt                      # Test dependencies
├── README.md                            # This file
├── sample_data/                         # Test fixtures
│   ├── sample_faq.json                  # FAQ test data
│   ├── sample_blotter.csv               # Blotter test data
│   ├── ocr_text_sample.txt              # OCR test data
│   └── README.md                        # Sample data docs
├── test_*.py                            # AI service tests (pytest)
├── server/__tests__/                    # Backend API tests (jest)
│   ├── authController.test.js           # Authentication tests
│   ├── residents.test.js                # Resident management tests
│   └── certificates.test.js             # Certificate issuance tests
└── client/src/__tests__/                # Frontend component tests (vitest)
    └── App.test.jsx                     # Main app component tests
```

## 🚀 Running Tests

### Prerequisites
```bash
# Install backend test dependencies
cd server
npm install

# Install frontend test dependencies
cd ../client
npm install

# Install AI service test dependencies
cd ../tests
pip install -r requirements.txt
```

### Run All Tests
```bash
# Backend API tests
cd server && npm test

# Frontend component tests
cd client && npm test

# AI service tests
cd tests && python -m pytest -v

# All tests with coverage
npm run test:all  # Custom script in root package.json
```

### Run Specific Test Categories
```bash
# Backend authentication tests
cd server && npm test -- authController.test.js

# AI chatbot tests
python -m pytest tests/test_chatbot_engine.py -v

# Frontend routing tests
cd client && npm test -- App.test.jsx

# Certificate business rules
cd server && npm test -- certificates.test.js
```

## 🔧 Test Configuration

### Backend Tests (Jest)
```javascript
// server/package.json
{
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": ["**/*.js", "!node_modules/**"],
    "setupFilesAfterEnv": ["<rootDir>/test-setup.js"]
  }
}
```

### Frontend Tests (Vitest)
```javascript
// client/package.json
{
  "test": "vitest",
  "test:ui": "vitest --ui"
}
```

### AI Tests (Pytest)
```python
# tests/requirements.txt
pytest>=7.0.0
pytest-mock>=3.10.0
pandas>=2.0.0
numpy>=1.24.0
matplotlib>=3.6.0
Pillow>=9.0.0
```

## 🧪 Critical Business Rules Tested

### **Certificate Issuance Blocking**
```javascript
// CRITICAL: Block clearance for active blotter cases
if (certificate_type === 'Barangay Clearance') {
  const blotterCheck = await db.execute(`
    SELECT COUNT(*) as active_cases FROM blotter
    WHERE respondent_id = ? AND status = 'Pending'
  `, [resident_id]);

  if (blotterCheck[0].active_cases > 0) {
    throw new Error('BLOCK ISSUANCE: Active blotter case found');
  }
}
```

### **RBIM Duplicate Detection**
```javascript
// Resident duplicate checking
const duplicates = await db.execute(`
  SELECT * FROM residents WHERE
  First_Name = ? AND Last_Name = ? AND Birthdate = ?
  AND Residency_Status = 'Active'
`, [first_name, last_name, birthdate]);
```

### **AI Priority Scoring**
```python
# Vulnerability assessment algorithm
vulnerability_score = 0
if is_senior: vulnerability_score += 40
if is_pwd: vulnerability_score += 35
if is_single_parent: vulnerability_score += 25
if income < 10000: vulnerability_score += 30
```

## 📊 Test Metrics & Coverage Goals

### **Coverage Targets**
- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: 90%+ API endpoints
- **E2E Tests**: 100% critical user journeys
- **AI Accuracy**: ±5% variance allowed

### **Performance Benchmarks**
- API Response Time: < 500ms
- AI Processing: < 2 seconds
- Database Queries: < 100ms

### **Business Rule Validation**
- ✅ Certificate blocking logic
- ✅ RBIM compliance checks
- ✅ AI priority algorithms
- ✅ Authentication hierarchies
- ✅ QR code validation

## 🔒 Security Tests Included

### **Input Validation**
- SQL injection prevention
- XSS protection
- File upload restrictions
- API rate limiting

### **Authentication Security**
- JWT token validation
- Password hashing verification
- Session management
- Role-based access control

### **Data Protection**
- Sensitive data masking
- Audit trail verification
- Database transaction integrity

## 🤖 AI Algorithm Tests

### **Chatbot Intelligence**
- Intent classification accuracy
- FAQ matching with fuzzy logic
- Context awareness
- Multi-language support

### **Predictive Analytics**
- Blotter trend forecasting
- Social aid priority scoring
- Patrol route optimization
- Emergency response prediction

### **OCR Processing**
- Text extraction accuracy
- Field recognition
- Error correction algorithms
- Multi-format support

## 📈 Continuous Integration

### **GitHub Actions Workflow**
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.8'
      - name: Install dependencies
        run: npm run install:all
      - name: Run tests
        run: npm run test:all
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 🚨 Test Failure Handling

### **Common Issues & Solutions**
1. **Database Connection**: Ensure MySQL is running with test database
2. **AI Service**: Verify Flask service is accessible on port 5000
3. **File Permissions**: Check upload directory permissions
4. **Environment Variables**: Verify all required .env variables

### **Debugging Tests**
```bash
# Run with verbose output
npm test -- --verbose

# Run single failing test
npm test -- --testNamePattern="should block clearance"

# Debug mode
npm test -- --inspect-brk
```

## 📝 Test Documentation

### **Writing New Tests**
1. Follow naming convention: `*.test.js` or `test_*.py`
2. Use descriptive test names
3. Mock external dependencies
4. Test both success and failure scenarios
5. Include business rule validation

### **Test Data Management**
- Use fixtures for consistent test data
- Avoid hardcoding test values
- Clean up after tests
- Use factories for complex objects

## 🎯 Test Categories Priority

### **Phase 1: Critical Functionality** ⭐⭐⭐
- Authentication & authorization
- Certificate issuance (business rules)
- Resident CRUD operations
- AI priority scoring

### **Phase 2: Core Features** ⭐⭐
- Blotter management
- QR code validation
- File upload/OCR processing
- Chatbot interactions

### **Phase 3: Advanced Features** ⭐
- Analytics & reporting
- Bulk operations
- Community programs
- SMS notifications

This comprehensive test suite ensures the Barangay Management System is robust, secure, and compliant with all business requirements. Regular test execution prevents regressions and validates AI algorithm accuracy.
