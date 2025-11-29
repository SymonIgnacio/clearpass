# Barangay Management System - Test Suite

This directory contains comprehensive tests for the Barangay Management System, ensuring all critical business rules and AI algorithms function correctly.

## Test Categories

### 1. Critical Business Rules Tests
- **Certificate-Blotter Integration**: Verifies that certificates cannot be issued to residents with active blotter cases
- **Blotter Status Management**: Tests proper status updates and their impact on certificate issuance
- **File**: `critical-business-rules.test.js`

### 2. AI Priority Algorithm Tests
- **Social Aid Prioritizer**: Tests the AI algorithm for determining social aid priority levels
- **Predictive Policing**: Tests patrol deployment recommendations based on blotter data
- **Node.js Integration**: Tests the full integration between Node.js backend and Python AI service
- **File**: `ai-priority-algorithm.test.js`

## Prerequisites

Before running tests, ensure all services are running:

1. **MySQL Database**: Running with the schema from `database/schema.sql`
2. **Node.js Backend**: `cd server && npm start`
3. **Python AI Service**: `cd ai_service && python smart_suggestions.py`

## Installation

```bash
cd tests
npm install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Scenarios Covered

### Critical Business Rules

#### Certificate-Blotter Integration
- ✅ Resident with "Pending" blotter case cannot get clearance
- ✅ Resident with "Forwarded to Lupon" status cannot get clearance
- ✅ Resident with resolved blotter case CAN get clearance
- ✅ Warning message displays correctly
- ✅ All certificate types check blotter status

#### Blotter Status Management
- ✅ Can create blotter with "Pending" status
- ✅ Can update status to "Forwarded to Lupon"
- ✅ Status changes reflect in certificate checks
- ✅ Proper status enum validation

### AI Priority Algorithm

#### Social Aid Prioritizer
- ✅ Senior with low income → HIGH priority
- ✅ PWD with moderate income → HIGH priority
- ✅ High income employed → LOW priority
- ✅ Moderate income unemployed → MEDIUM priority
- ✅ Multiple criteria (Senior + PWD) → HIGHEST priority
- ✅ Invalid input handling

#### Predictive Policing
- ✅ High risk (>5 incidents) → "Deploy 4 Tanods + Roving Patrol"
- ✅ Medium risk (2-4 incidents) → "Deploy 2 Tanods"
- ✅ Low risk (0-1 incidents) → "Standard Patrol (1 Tanod)"
- ✅ Hotspot area identification
- ✅ Empty blotter data handling

#### Integration Tests
- ✅ Node.js AI priority endpoint integration
- ✅ Node.js AI patrol suggestions endpoint integration
- ✅ Error handling for AI service unavailability

## Test Data

Tests automatically create and clean up test data:
- Test residents are created in the database
- Test blotter cases are created and resolved
- Test certificates are issued and cleaned up
- All test data is removed after test completion

## Expected Results

All tests should pass with the following success criteria:

### Business Rules Compliance
- Certificate issuance is properly blocked for residents with active cases
- Status updates work correctly
- Warning messages display appropriate information

### AI Algorithm Accuracy
- Priority scores match expected ranges (±5 points variance allowed)
- Patrol recommendations follow the specified logic
- Hotspot identification works correctly

## Troubleshooting

### Tests Failing Due to Service Unavailability
1. Ensure MySQL database is running and accessible
2. Ensure Node.js backend is running on port 3001
3. Ensure Python AI service is running on port 5000
4. Check database connection and credentials in `.env`

### Database Connection Issues
1. Verify MySQL is running
2. Check database credentials in `.env`
3. Ensure the database schema is properly imported

### AI Service Issues
1. Verify Python dependencies are installed: `pip install -r ai_service/requirements.txt`
2. Ensure Flask app is running: `python ai_service/smart_suggestions.py`
3. Check for port conflicts on port 5000

## Continuous Integration

These tests can be integrated into a CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    cd tests
    npm install
    npm test -- --coverage --watchAll=false
```

## Contributing

When adding new features:
1. Add corresponding tests in the appropriate test file
2. Ensure all existing tests still pass
3. Update this README with new test scenarios
4. Maintain test data cleanup practices
