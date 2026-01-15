I will optimize the `__tests__/crud-comprehensive.test.js` test suite to reduce resource consumption, eliminate redundancies, and resolve the database lock timeouts.

### 1. Refactor Test Setup & Teardown
- **Move Authentication to `beforeAll`**: Currently, `authenticate()` runs before *every* test. I will move this to `beforeAll` to log in once as Admin and reuse the session cookie.
- **Create Reusable Resident Session**: I will also authenticate as a Resident once in `beforeAll` and store the agent for resident-specific tests.
- **Optimize Data Seeding**: Move `seedTestData` and `createAdminUser` to `beforeAll`.
- **Eliminate `beforeEach` Cleanup**: By ensuring all test data has unique identifiers (timestamps/random strings), I can remove `cleanupTestData` from `beforeEach`. This prevents the "Lock wait timeout" caused by cleanup scripts colliding with lagging test transactions. Cleanup will only happen in `afterAll`.

### 2. Implement Unique Test Data Generation
- Modify helper functions (`createTestResident`, `createTestBlotterCase`, etc.) to automatically append unique timestamps to emails, resident IDs, and case numbers.
- This ensures tests run in isolation without needing a database reset between each case.

### 3. Reduce Logging & Verbosity ("Token Consumption")
- Silence `console.error` and `console.warn` for expected failures (e.g., during negative testing like "Duplicate prevention logic") to keep the output clean.
- Remove redundant assertions that check the same properties multiple times.

### 4. Performance & Token Usage Monitoring
- I will add a simple benchmark reporter in `afterAll` that logs:
    - Total execution time.
    - Approximate "token" count (character count of logs/output).
- I will verify that all 21 tests pass with these optimizations.

### 5. Best Practices Documentation
- I will add a comment block at the top of the test file documenting these patterns (Unique IDs > Cleanup, Shared Auth > Individual Auth) for future reference.

### Proposed Changes Overview
- **`__tests__/crud-comprehensive.test.js`**: Massive refactor to implement the above points.
- **No changes to production code** (Controllers/Database) are required as the "Lock wait timeout" is a symptom of the test harness, not the app itself.
