I will implement the missing PDF generation endpoints for admin reports.

1. **Modify** **`server/controllers/adminController.js`**:

   * Import `PDFDocument` (pdfkit) and `axios`.

   * Add a new `generatePDFReport` function that:

     * Accepts the report type (`users`, `blotter`, `certificates`, `residents`, `system`, `security`, `ai`) as a route parameter.

     * Fetches the relevant data using the existing logic/queries for each report type.

     * Generates a formatted PDF document using `pdfkit`.

     * Streams the PDF response to the client.

   * Specific handling for each report type:

     * **Users**: Statistics on total, active, and role distribution.

     * **Blotter**: Case statistics and incident types.

     * **Certificates**: Issuance stats and types.

     * **Residents**: Population demographics and verification status.

     * **System**: Health metrics (uptime, memory) and database status.

     * **Security**: Login attempts and security events.

     * **AI**: Fetches analytics from the AI service (via `AI_SERVICE_URL`) or falls back to basic info if unavailable.

2. **Modify** **`server/routes/adminRoutes.js`**:

   * Register the new route: `GET /reports/pdf/:type`.

   * Apply `verifyToken` and `verifyRole([ROLES.ADMIN])` middleware for security.

3. **Verification**:

   * The frontend `AdminReports.jsx` is already configured to call this endpoint (`/api/admin/reports/pdf/:type`).

   * I will confirm the 404 errors are resolved and PDFs are generated.

