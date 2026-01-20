I will perform a comprehensive **Capstone Defense Readiness Audit** to ensure your system is flawless for tomorrow.

### **Phase 1: Data Integrity & Health Fixes**
*   **Fix 4 "Zombie" Residents**: My scan found **4 residents with empty `Residency_Status`**. This is a data gap that could crash the dashboard during your demo. I will identify and fix them to 'Active'.
*   **Verify User-Resident Linkage**: Ensure all 12 "Resident" users are correctly linked to their profile data.

### **Phase 2: Certificate System Audit (The Core)**
*   **Template Management**:
    *   **Upload**: Create a test script to upload a `.docx` template via the API (simulating the frontend).
    *   **Delete**: Verify admin-only deletion works.
    *   **Priority Check**: Verify that **Database Templates** take precedence over the **Local File Fallback** I added earlier.
*   **Issuance Flow**:
    *   Generate a certificate using the new template logic.
    *   Verify the **QR Code** validation endpoint works for the newly issued certificate.

### **Phase 3: Blotter & Security Audit**
*   **Blotter Blocking Logic**: I noticed code that *blocks* certificates if a resident has an active case. I will **prove this works** by:
    1.  Creating a dummy "Active" blotter case for a test resident.
    2.  Attempting to request a certificate (Expect: **BLOCKED**).
    3.  Resolving the case.
    4.  Attempting request again (Expect: **ALLOWED**).
*   **RBAC (Role-Based Access Control)**:
    *   Verify `Secretary` (Role 3) can *approve* requests but `Resident` (Role 12) cannot.
    *   Verify only `Admin` (Role 1) can *delete* templates.

### **Phase 4: Frontend-Backend Alignment**
*   **Dashboard Sync**: Check that the "Pending Requests" count on the Admin Dashboard matches the actual database count (currently 6).
*   **Status Consistency**: Ensure the frontend status labels (e.g., "Verified", "Approved") match the backend enums exactly.

**Output**: A final **"System Health Report"** markdown file you can refer to during your defense, plus any code fixes applied.

**Confirm to proceed with this audit?**