I will fix the Security Audit PDF export issue and implement a table layout for the User Management Report.

1. **Fix Security Audit Export (`server/controllers/adminController.js`)**:

   * Identify the SQL query causing the issue: The `login_attempts` table uses the column `created_at`, but the current code queries `attempted_at`.

   * Correction: Change `attempted_at` to `created_at` in the `security` report section of `generatePDFReport`.

   * I will also apply this fix to the `getSecurityReport` function to ensure the dashboard widgets display correct data (currently showing 0s).

2. **Implement User Report Table (`server/controllers/adminController.js`)**:

   * Refactor the `users` report section in `generatePDFReport`.

   * Instead of a simple list, I will implement a structured table layout using `pdfkit`.

   * Define columns: **Username**, **Full Name**, **Status**, and **Role**.

   * Draw headers with a gray background.

   * Iterate through user records to draw rows with proper alignment and cell padding.

   * Add grid lines for better readability.

3. **Verification**:

   * I will verify the changes by generating the PDF again.

