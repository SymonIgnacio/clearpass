I will fix the reported `ReferenceError` crashes by adding the missing import statements to the affected files. After stabilizing the application, I will run the database seed script to populate the certificate templates as requested.

### Fix Runtime Errors
1.  **Update `DocumentsDashboard.jsx`**: Add missing import for `TemplateUploadWizard`.
2.  **Update `ResidentCertificates.jsx`**: Add missing import for `useAuth`.

### Database Initialization
1.  **Run Seed Script**: Execute `node scripts/seed_templates.cjs` to populate the `document_templates` table with the existing DOCX templates from the filesystem.

### Verification
1.  **Verify Fixes**: Ensure the dashboard and certificate pages load without errors.
2.  **Verify Seeding**: Confirm templates are visible in the database/UI.