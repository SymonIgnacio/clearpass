# ClearPass Test Suite

## Overview
Automated test suite for the ClearPass Barangay Management System.

## Setup

```bash
cd tests
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run security tests only
npm run test:security
```

## Test Structure

```
tests/
├── __tests__/
│   ├── security.test.js       # SQL injection & XSS tests
│   ├── auth.test.js           # Authentication tests (TODO)
│   ├── residents.test.js      # Resident API tests (TODO)
│   └── certificates.test.js   # Certificate API tests (TODO)
├── package.json
└── README.md
```

## Current Coverage

- ✅ SQL Injection Prevention (6 payloads)
- ✅ XSS Prevention (4 payloads)
- ⏳ Authentication Tests (TODO)
- ⏳ API Integration Tests (TODO)
- ⏳ Unit Tests (TODO)

## Target Coverage

**Goal:** 80% code coverage

## Writing Tests

### Example Test

```javascript
describe('Resident API', () => {
  test('should create resident with valid data', async () => {
    const response = await request(baseURL)
      .post('/api/residents')
      .send({
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        birthdate: '1990-01-01',
        household_id: 'H-123'
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('resident_id');
  });
});
```

## Dependencies

- **jest**: Test framework
- **supertest**: HTTP assertions
- **@types/jest**: TypeScript definitions

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Run Tests
  run: |
    cd tests
    npm install
    npm test
```
