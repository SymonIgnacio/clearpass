I will systematically review and fix **every single test file** in the codebase to ensure 100% system health.

### Step 1: Foundation & Security Layer
I will fix tests related to core system stability and security controls.
- **Targets**: `auditLogger.test.js`, `rbacSmokeTokens.test.js`, `adminHierarchy.test.js`, `performance-security.test.js`.
- **Goal**: Ensure the database, logging, and permission systems are rock solid.

### Step 2: Core Business Logic (The "Ignored" Suites)
I will repair the currently disabled/ignored tests that cover the main application features.
- **Auth & Users**: `authController.test.js`, `controllers.test.js`, `controllers-expanded.test.js`.
- **Residents**: `residents.test.js`, `residentControllerUnit.test.js`.
- **Certificates**: `certificates.test.js`, `certificateRequestController.test.js`, `certificateTypeRoutes.test.js`.
- **Goal**: Fix the actual controller logic where these tests reveal broken functionality.

### Step 3: Integration & Workflows
I will fix the complex end-to-end workflow tests.
- **Targets**: `integration-features.test.js`, `api-integration.test.js`, `system-comprehensive.test.js`, `exhaustive-complete.test.js`.
- **Goal**: Resolve the "Pool is closed" errors and ensure complete user journeys (e.g., Request -> Approve -> Print) work seamlessly.

### Step 4: Specialized Features
I will fix the remaining specific feature tests.
- **Targets**: `pdf-generation.test.js`, `file-validation.test.js`, `data-export.test.js`, `templateRoutes.test.js`, and all document download tests.

I will proceed file-by-file or group-by-group, fixing both the **test code** and the **application code** as failures arise.
