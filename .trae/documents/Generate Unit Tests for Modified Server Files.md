I will generate comprehensive unit tests for the modified and new files in the `server` directory. Based on the analysis of the changes, I will create the following test files in `server/__tests__/` to ensure 100% coverage and validate the business logic, including the critical blotter case blocking and audit logging.

### Test Plan

**1. Middleware Tests: `server/__tests__/auditLogger.test.js`**
*   **Target:** `server/middleware/auditLogger.js`
*   **Scope:**
    *   Verify `auditMiddleware` intercepts requests and logs to file/DB.
    *   Test `shouldAuditRequest` logic (sensitive endpoints, admin actions).
    *   Test `logAuditToDatabase` SQL execution and error handling.
    *   Validate event type determination (e.g., `LOGIN_SUCCESS`, `UNAUTHORIZED_ACCESS`).

**2. Controller Tests: `server/__tests__/certificateRequestController.test.js`**
*   **Target:** `server/controllers/certificateRequestController.js`
*   **Scope:**
    *   **`submitRequest`**: Test file validation, resident existence check, notification triggering, and DB insertion.
    *   **`updateRequestStatus`**: Test approval/rejection logic and status updates.
    *   **`getAllRequests`**: Test pagination and status filtering.
    *   **`cancelRequest`**: Test logic for cancelling pending requests.

**3. Controller Tests: `server/__tests__/documentController.test.js`**
*   **Target:** `server/controllers/documentController.js`
*   **Scope:**
    *   **Critical:** Test `createDocumentRequest` to ensure it **blocks** requests when active blotter cases exist.
    *   Test `validateDocument` expiry logic and QR verification.
    *   Test `downloadDocument` template selection (mocking PDF generation).
    *   Test `approveDocumentRequest` control number generation.

**4. Controller Tests: `server/__tests__/residentControllerUnit.test.js`**
*   **Target:** `server/controllers/residentController.js`
*   **Scope:**
    *   **`create`**: Test transaction management, password hashing, and user creation.
    *   **`checkDuplicate`**: Test logic for identifying duplicate residents.
    *   **`openRegister`**: Test public registration flow and validations.
    *   **`archive`**: Verify status update and household member count decrement.

**5. Route Integration Tests: `server/__tests__/templateRoutes.test.js`**
*   **Target:** `server/routes/templateRoutes.js`
*   **Scope:**
    *   Test CRUD operations (GET, POST, PUT, DELETE).
    *   Test file upload handling for templates.
    *   Test template duplication logic.

**6. Route Integration Tests: `server/__tests__/certificateTypeRoutes.test.js`**
*   **Target:** `server/routes/certificateTypeRoutes.js`
*   **Scope:**
    *   Test creating, updating, and deleting certificate types.
    *   Test validation of required fields (e.g., name, fee).
    *   Test dependency checks (prevent deleting types in use).

### Execution Steps
1.  Create the test files with the content prepared during analysis.
2.  Run the tests using `npm test` to verify they pass.
3.  Fix any issues if tests fail or if mocks are incorrect.
4.  Ensure all modified logic is covered.

I will start by creating the test files.