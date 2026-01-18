# 🧪 AUTOMATED TEST SUITE - THEMIS BIOPROFILING

## 📋 Overview

Comprehensive automated test suite covering all critical system components, security requirements, and business logic.

## 🚀 Quick Start

### Run All Tests (Windows)
```bash
run-tests.bat
```

### Run All Tests (Manual)
```bash
cd server
npm test
```

### Run Specific Test Suite
```bash
cd server
npm test -- --testPathPattern=system-comprehensive.test.js
```

### Run Tests with Coverage
```bash
cd server
npm test -- --coverage
```

### Watch Mode (Development)
```bash
cd server
npm run test:watch
```

## 📊 Test Coverage

### 🔒 Security Tests (Priority: CRITICAL)
- ✅ Captain Read-Only Enforcement
  - Captain CANNOT create blotter records
  - Captain CANNOT update blotter records
  - Captain CANNOT delete blotter records
  - Captain CAN read blotter records
- ✅ Privilege Escalation Prevention
- ✅ Role-Based Access Control (RBAC)

### 🧪 Functional Tests (Priority: HIGH)
- ✅ Blotter CRUD Operations
  - Create with validation
  - Read with filters
  - Update with field validation
  - Delete with authorization
- ✅ Input Validation
  - Required fields enforcement
  - Respondent ID validation
  - Auto-generation of case numbers
- ✅ Data Integrity
  - JSON serialization
  - Foreign key validation

### 🎯 Integration Tests (Priority: HIGH)
- ✅ Role-Based Access Matrix
  - Admin (ID: 2) - Full Access
  - Secretary (ID: 3) - Full Access
  - Clerk (ID: 4) - Full Access
  - Captain (ID: 5) - Read-Only
  - Tanod (ID: 6) - Full Access
- ✅ Multi-Role Workflows
- ✅ Database Transaction Handling

### 🛡️ Error Handling Tests (Priority: MEDIUM)
- ✅ Database Connection Failures
- ✅ Invalid Input Handling
- ✅ Missing Required Fields
- ✅ Graceful Degradation

### 📊 System Health Checks (Priority: MEDIUM)
- ✅ Controller Method Availability
- ✅ Async Function Validation
- ✅ Module Export Verification

## 📈 Test Results Interpretation

### Success Indicators
```
✅ All tests passed
✅ 0 failed tests
✅ Coverage > 80%
```

### Failure Indicators
```
❌ Any failed tests
⚠️  Coverage < 80%
⚠️  Security tests failing
```

## 🔧 Test Configuration

### Jest Configuration
Located in: `server/package.json`

```json
{
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": ["**/*.js", "!node_modules/**"],
    "coverageDirectory": "coverage",
    "testMatch": ["**/__tests__/**/*.test.js"]
  }
}
```

### Test Setup
Located in: `server/test-setup.js`

## 📝 Test Files

| File | Purpose | Tests |
|------|---------|-------|
| `system-comprehensive.test.js` | Complete system validation | 25+ |
| `controllers.test.js` | Controller logic | 15+ |
| `api-integration.test.js` | API endpoints | 20+ |
| `authController.test.js` | Authentication | 10+ |
| `certificates.test.js` | Document generation | 8+ |
| `residents.test.js` | Resident management | 12+ |

## 🎯 Critical Test Cases

### 1. Captain Read-Only Enforcement (SECURITY)
```javascript
test('Captain CANNOT create blotter record', async () => {
  const req = { user: { role_id: 5, role: 'Captain' }, ... };
  await blotterController.create(req, res);
  expect(res.status).toHaveBeenCalledWith(403);
});
```

### 2. Input Validation (FUNCTIONAL)
```javascript
test('Rejects blotter creation with missing fields', async () => {
  const req = { body: { /* incomplete */ } };
  await blotterController.create(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});
```

### 3. Role-Based Access (INTEGRATION)
```javascript
roles.forEach(role => {
  test(`${role.name} access control`, async () => {
    // Verify role permissions
  });
});
```

## 🐛 Debugging Failed Tests

### View Detailed Output
```bash
npm test -- --verbose
```

### Run Single Test
```bash
npm test -- --testNamePattern="Captain CANNOT create"
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📊 Coverage Reports

### Generate HTML Report
```bash
npm test -- --coverage --coverageReporters=html
```

View report: `server/coverage/index.html`

### Coverage Thresholds
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests passing (`npm test`)
- [ ] Security tests passing (100%)
- [ ] Coverage > 80%
- [ ] No console errors
- [ ] Captain read-only verified
- [ ] RBAC matrix validated
- [ ] Error handling tested

## 🔄 Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: cd server && npm install
      - run: cd server && npm test
```

## 📞 Support

For test failures or issues:
1. Check test output for specific error
2. Review test file for expected behavior
3. Verify database connection
4. Check environment variables

## 🎉 Success Criteria

System is ready for deployment when:
- ✅ All 90+ tests passing
- ✅ Zero security vulnerabilities
- ✅ Captain read-only enforced
- ✅ Coverage > 80%
- ✅ No critical errors

---

**Last Updated:** 2025-01-12  
**Test Suite Version:** 1.0.0  
**Status:** ✅ Production Ready
