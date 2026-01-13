I will conduct a rigorous, full-scope system verification by implementing a suite of specialized test files that target every layer of the application.

### **1. Comprehensive CRUD & Logic Verification**
**File:** `server/__tests__/crud-comprehensive.test.js`
*   **Scope:** Residents, Households, Blotter, Users, Certificate Requests.
*   **Test Cases:**
    *   **Create:** Verify DB insertion, default value assignment (e.g., "Active" status), and duplicate prevention logic.
    *   **Read:** Test pagination, search filters (by name, date, status), and relation loading (e.g., fetching Household with a Resident).
    *   **Update:** Test partial updates, validation of enum fields (e.g., "Civil Status"), and concurrency checks.
    *   **Delete:** Verify relational integrity (e.g., archiving a Resident updates Household member count).

### **2. PDF Generation & Reporting Analysis**
**File:** `server/__tests__/pdf-generation.test.js`
*   **Scope:** `ReportController` (Residents Master List, Blotter Reports).
*   **Methodology:**
    *   **Mocking:** Mock `pdfkit` to intercept document creation.
    *   **Verification:** Assert that `doc.text()` is called with correct data (Resident Names, Case Numbers) bound from the database.
    *   **Formatting:** Verify that headers, columns, and layout configurations (Landscape/Portrait) are applied correctly.

### **3. Integration & Cross-Feature Interactions**
**File:** `server/__tests__/integration-features.test.js`
*   **Scope:** Auth flows, Notifications, Audit Logging.
*   **Test Cases:**
    *   **Auth:** Login → MFA Challenge → Token Issuance → Protected Route Access.
    *   **Notification:** Mock `nodemailer` to verify email triggers upon User Registration and Document Request.
    *   **Audit Trail:** Perform a critical action (e.g., Delete User) and verify a corresponding entry in the `audit_logs` table.

### **4. Performance & Security Validation**
**File:** `server/__tests__/performance-security.test.js`
*   **Scope:** Load handling and Input sanitization.
*   **Test Cases:**
    *   **Security:** Inject SQL payloads and XSS scripts into search/input fields to verify sanitization.
    *   **Performance:** Execute 50+ parallel requests to `GET /residents` and `POST /auth/login` to measure response latency and database stability.
    *   **Error Recovery:** Simulate DB connection loss during a transaction to ensure clean rollback.

### **5. Frontend Validation**
**File:** `client/src/__tests__/Validation.test.jsx`
*   **Scope:** UI correctness and accessibility.
*   **Test Cases:** Verify form error states (required fields), ARIA attribute presence, and component rendering under "loading" and "error" states.

### **Execution & Reporting**
*   Run the full suite (`npm test`).
*   Generate a `COMPREHENSIVE_AUDIT_REPORT.md` detailing:
    *   Pass/Fail rates per module.
    *   Code path coverage analysis.
    *   Performance benchmarks (avg response time).
    *   Security resilience findings.
