I will implement the requested changes to the analytics and export functionality.

### **1. Frontend: Update RondaAnalytics.jsx**
- **Remove UI Elements**: Remove the "Response Time" and "Coverage" cards from the dashboard summary.
- **Fix Export Functionality**:
  - Update `handleGenerateReport` to trigger a PDF download instead of a JSON file.
  - It will now redirect to `/admin/reports/pdf/ai?report_type=${selectedReport}` to leverage the backend's PDF generation.

### **2. Backend: Implement AI PDF Report Generation**
- **Update `server/controllers/adminController.js`**:
  - Locate the `generatePDFReport` function.
  - Rewrite the `type === 'ai'` block to fetch real data from the database using `knex` instead of calling an external AI service.
  - Implement data gathering for:
    - **Dashboard Summary**: Active cases, total incidents, trend direction.
    - **High Risk Areas**: Top 3 sitios with incidents.
    - **Patrol Suggestions**: Weekly incident counts per sitio and risk levels.
    - **Forecast Data**: Incident trends over time.
  - Ensure the PDF output includes these sections formatted cleanly.

### **3. Verify Export**
- The "Predictive Forecast Report" option in the export dialog will now produce a PDF containing the relevant forecast and analytics data.
