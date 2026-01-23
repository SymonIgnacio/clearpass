I will conduct a comprehensive functional audit of your ClearPass system using a layered approach to ensure all components (Client, Server, Database, AI) are working correctly.

### **Phase 1: Static Analysis & Environment Check**
*   **Environment Validation:** Run `npm run validate-env` to ensure all configuration files (`.env`) and secrets are correctly set up.
*   **Database Schema Audit:** Run `npm run db:audit` to verify the MySQL database structure matches the expected schema definition.
*   **Code Quality Check:** Run `npm run lint` to identify potential bugs, styling issues, and code quality problems in both Client and Server.

### **Phase 2: Automated Test Suite**
*   **Comprehensive Testing:** Execute `npm run test:all`. This master script runs:
    *   **Server Tests:** Jest unit and integration tests.
    *   **Client Tests:** Vitest component tests.
    *   **AI Service:** Python unit tests.

### **Phase 3: Live System Functional Audit**
*   **System Startup:** Launch the full stack (`npm run dev:all`) to spin up the React Client, Node.js Server, and Python AI Service.
*   **Functional Verification:** Run `npm run verify:completion` against the live system. This script will:
    *   **Boot Status:** Verify all services start correctly.
    *   **Connectivity:** Test Frontend-Backend and Backend-Database links.
    *   **API Health:** Ping critical endpoints (Residents, Blotter, Auth).
    *   **AI Integration:** Check if the Python priority engine is reachable.
    *   **Security:** Verify authentication and read-only protections.
*   **System Integration Tests:** Run `npm run test:system` to validate end-to-end flows like authentication and routing.

### **Phase 4: Reporting**
*   **Consolidated Report:** I will compile the results from all phases into a final report summarizing:
    *   **Overall System Health Score** (0-100%)
    *   **Pass/Fail Status** for critical features.
    *   **Identified Issues** (if any) with recommended fixes.
