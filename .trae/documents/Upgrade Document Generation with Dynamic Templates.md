# Document Generation System Upgrade Plan

I have analyzed the current codebase and found that while the frontend supports requesting documents and managing templates (including file uploads), the backend `documentController.js` currently relies on hardcoded PDF generation logic and ignores uploaded templates.

I will upgrade the system to support dynamic PDF form filling and DOCX templating as requested.

## 1. Install Dependencies
I will install the necessary libraries in the `server` directory to handle document manipulation:
- `pdf-lib`: For filling existing PDF forms.
- `docxtemplater`: For replacing tags in DOCX files.
- `pizzip`: Required by docxtemplater for zipping/unzipping.

## 2. Refactor `documentController.js`
I will modify the `downloadDocument` method and add helper functions to:
- **Check for Custom Templates**: Before generating a document, check the `document_templates` table for an uploaded file associated with the requested document type.
- **Dynamic Generation Strategy**:
    - **If a file exists**:
        - **PDF**: Load the file using `pdf-lib`, map resident/request data to form fields, flatten the form (make read-only), and return the result.
        - **DOCX**: Load the file using `pizzip`/`docxtemplater`, replace placeholders (e.g., `{first_name}`) with actual data, and return the generated DOCX.
    - **If no file exists**: Fallback to the existing `pdfkit` implementation to ensure legacy support.
- **Data Mapping**: Ensure resident data (Name, Address, Age, etc.) and Request data (Purpose, etc.) are merged into a single data object for the template engines.

## 3. Verification
- I will verify that the system correctly handles both the existing hardcoded templates (fallback) and new uploaded templates.
- I will ensure the correct MIME types (`application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) are set for the downloads.

## 4. User Interface
- The existing `DocumentsDashboard.jsx` and `CertificateRequest.jsx` are already well-setup to support this flow, so no major frontend changes are expected unless we encounter data mismatch issues.

This plan directly addresses the user's requirement for a "Document processing engine" that "Merges user-provided data with static template content" while preserving the original format.
