# Testing Guide

## Test Coverage Status

**Current Coverage:** ~30% (Basic tests implemented)  
**Target Coverage:** 80%+  
**Status:** ✅ FOUNDATION COMPLETE

---

## Test Structure

### Unit Tests
Location: `server/__tests__/`

**Implemented:**
- ✅ `controllers.test.js` - Controller unit tests (8 tests)
  - Resident controller (4 tests)
  - User controller (1 test)
  - Admin controller (1 test)
  - Error handler (2 tests)

**To Implement:**
- [ ] Authentication middleware tests
- [ ] Validation middleware tests
- [ ] Database query tests
- [ ] Utility function tests

### Integration Tests
Location: `server/__tests__/integration/`

**To Implement:**
- [ ] Complete workflow tests (OCR → DB)
- [ ] API endpoint tests
- [ ] Authentication flow tests
- [ ] Certificate issuance workflow

### API Tests
Location: `server/__tests__/api/`

**To Implement:**
- [ ] All endpoint tests
- [ ] Authentication tests
- [ ] Authorization tests
- [ ] Error response tests

---

## Running Tests

### Install Dependencies
```bash
cd server
npm install --save-dev jest supertest @types/jest
```

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test controllers.test.js

# Watch mode
npm test -- --watch
```

### Test Scripts (package.json)
```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:verbose": "jest --verbose"
  }
}
```

---

## Test Patterns

### Controller Test Pattern
```javascript
describe('Controller Name', () => {
  let controller;
  let mockDb;
  
  beforeEach(() => {
    mockDb = {
      execute: jest.fn(),
      getConnection: jest.fn()
    };
    controller = require('../controllers/controllerName');
  });
  
  it('should handle success case', async () => {
    mockDb.execute.mockResolvedValue([[{ id: 1 }]]);
    
    const req = { app: { locals: { db: mockDb } } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    
    await controller.method(req, res);
    
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });
  
  it('should handle error case', async () => {
    mockDb.execute.mockRejectedValue(new Error('DB error'));
    
    const req = { app: { locals: { db: mockDb } } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    
    await controller.method(req, res);
    
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
```

### API Test Pattern
```javascript
const request = require('supertest');
const app = require('../index');

describe('API Endpoint', () => {
  it('should return 200 for valid request', async () => {
    const response = await request(app)
      .get('/api/residents')
      .set('Authorization', 'Bearer valid_token')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
  });
  
  it('should return 401 for missing token', async () => {
    await request(app)
      .get('/api/residents')
      .expect(401);
  });
});
```

### Middleware Test Pattern
```javascript
describe('Middleware Name', () => {
  it('should call next() on success', () => {
    const req = { headers: { authorization: 'Bearer token' } };
    const res = {};
    const next = jest.fn();
    
    middleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
  });
  
  it('should return error on failure', () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    
    middleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
```

---

## Test Coverage Goals

### Phase 1: Foundation (COMPLETED) ✅
- [x] Basic controller tests
- [x] Error handler tests
- [x] Test infrastructure setup
- **Coverage:** ~30%

### Phase 2: Core Functionality (Recommended)
- [ ] All controller methods
- [ ] Authentication middleware
- [ ] Validation middleware
- [ ] Database utilities
- **Target Coverage:** ~60%
- **Estimated Time:** 10-15 hours

### Phase 3: Comprehensive (Optional)
- [ ] Integration tests
- [ ] API endpoint tests
- [ ] Edge cases
- [ ] Performance tests
- **Target Coverage:** 80%+
- **Estimated Time:** 20-30 hours

---

## Mocking Strategies

### Database Mocking
```javascript
const mockDb = {
  execute: jest.fn(),
  getConnection: jest.fn(() => ({
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    execute: jest.fn()
  }))
};
```

### Request/Response Mocking
```javascript
const mockReq = {
  app: { locals: { db: mockDb } },
  params: { id: '123' },
  query: { page: 1, limit: 50 },
  body: { name: 'Test' },
  user: { id: 1, role: 'admin' }
};

const mockRes = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
  send: jest.fn()
};
```

### External Service Mocking
```javascript
jest.mock('axios');
const axios = require('axios');

axios.get.mockResolvedValue({ data: { result: 'success' } });
```

---

## Test Data

### Sample Test Data
```javascript
const testData = {
  resident: {
    Resident_ID: 'RES-TEST-001',
    First_Name: 'Juan',
    Last_Name: 'Dela Cruz',
    Birthdate: '1990-01-01',
    Gender: 'Male'
  },
  
  user: {
    id: 1,
    email: 'test@example.com',
    role: 'admin',
    status: 'active'
  },
  
  certificate: {
    control_no: 'CLR-TEST-001',
    resident_id: 'RES-TEST-001',
    certificate_type: 'Barangay Clearance',
    status: 'Released'
  }
};
```

---

## CI/CD Integration

### GitHub Actions (Future)
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

---

## Best Practices

### 1. Test Naming
```javascript
// Good
it('should return 404 when resident not found')
it('should create resident with valid data')

// Bad
it('test 1')
it('works')
```

### 2. Arrange-Act-Assert Pattern
```javascript
it('should do something', () => {
  // Arrange
  const input = { id: 1 };
  const expected = { id: 1, name: 'Test' };
  
  // Act
  const result = doSomething(input);
  
  // Assert
  expect(result).toEqual(expected);
});
```

### 3. Test Independence
```javascript
// Each test should be independent
beforeEach(() => {
  jest.clearAllMocks();
  // Reset state
});
```

### 4. Descriptive Assertions
```javascript
// Good
expect(result).toHaveProperty('data');
expect(result.data).toHaveLength(10);

// Bad
expect(result).toBeTruthy();
```

---

## Current Test Results

### Implemented Tests (8 total)
- ✅ Resident getAll - success case
- ✅ Resident getAll - error handling
- ✅ Resident getById - success case
- ✅ Resident getById - not found case
- ✅ User getAll - success case
- ✅ Admin getSummary - success case
- ✅ Error handler - AppError handling
- ✅ Error handler - ValidationError handling

### Test Execution
```bash
npm test

PASS  server/__tests__/controllers.test.js
  Resident Controller Tests
    ✓ should return paginated residents (5ms)
    ✓ should handle database errors (3ms)
    ✓ should return resident by ID (2ms)
    ✓ should return 404 if resident not found (2ms)
  User Controller Tests
    ✓ should return paginated users (2ms)
  Admin Controller Tests
    ✓ should return system summary (3ms)
  Error Handler Tests
    ✓ should handle AppError correctly (2ms)
    ✓ should handle validation errors (2ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Time:        2.5s
```

---

## Next Steps

### Immediate (Optional)
1. Add authentication middleware tests
2. Add validation middleware tests
3. Add more controller method tests

### Short-term (Recommended)
1. Achieve 60% coverage on critical paths
2. Add integration tests for main workflows
3. Set up CI/CD pipeline

### Long-term (Nice-to-have)
1. Achieve 80%+ coverage
2. Add performance tests
3. Add end-to-end tests
4. Automated test reporting

---

## Resources

- Jest Documentation: https://jestjs.io/
- Supertest Documentation: https://github.com/visionmedia/supertest
- Testing Best Practices: https://testingjavascript.com/

---

**Status:** ✅ FOUNDATION COMPLETE  
**Coverage:** ~30% (8 tests implemented)  
**Target:** 80%+ (60+ tests needed)  
**Recommendation:** Implement incrementally based on priority

**Last Updated:** January 2026
