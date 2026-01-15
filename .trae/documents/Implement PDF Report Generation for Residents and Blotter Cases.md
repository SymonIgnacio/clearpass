I will resolve the "Failed to load PDF" error by implementing the backend PDF generation logic. Currently, the backend returns a JSON placeholder message, which the frontend tries to save as a PDF file, causing the error.

### **1. Create Report Controller (`server/controllers/reportController.js`)**
I will create a new controller to handle PDF generation requests. This controller will:
*   Use `pdfkit` to generate professional PDF documents.
*   Reuse the database connection to fetch real data.
*   Implement `generateResidentsPDF` to create the Residents Master List.
    *   It will accept filters: `search`, `gender`, `sitio`, `vulnerability`, `residency_status`, `dateFrom`, `dateTo`.
    *   It will generate a table with columns: Name, Age, Gender, Sitio, Status, Vulnerabilities.
*   Implement `generateBlotterPDF` to create the Blotter Cases Report.
    *   It will accept filters: `search`, `status`, `dateFrom`, `dateTo`.
    *   It will generate a table with columns: Case #, Incident Type, Status, Date, Location, Respondent.

### **2. Update Server Routes (`server/routes.js`)**
I will update the routes to use the new controller methods instead of the temporary JSON responses.
*   **Route:** `GET /admin/reports/pdf/residents` -> `reportController.generateResidentsPDF`
*   **Route:** `GET /admin/reports/pdf/blotter` -> `reportController.generateBlotterPDF`

### **3. Implementation Details**
*   **Header & Styling:** I will replicate the official header style found in `documentController.js` (Republic of the Philippines, Province of Bulacan, etc.) for consistency.
*   **Data Fetching:** I will use the existing query logic from `adminController.js` but adapt it to fetch **all** matching records (removing pagination limits) for the report.
*   **Error Handling:** The controller will handle database errors and return appropriate HTTP status codes, though the primary success path is streaming a PDF.

### **4. Verification**
*   **User Action:** Clicking "Export PDF" on the Residents or Blotter page.
*   **Expected Result:** The browser will download a valid `.pdf` file instead of a corrupt one. The file will open correctly in PDF viewers and contain the filtered list of records.
