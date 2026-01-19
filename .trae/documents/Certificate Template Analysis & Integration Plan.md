I will proceed with a comprehensive analysis and integration of the certificate templates.

### **Phase 1: Template Analysis (Python Script)**
I will create a Python tool (`tools/analyze_templates.py`) to inspect the `.docx` files in `C:\xampp\htdocs\clearpass\Certificate Templates\`.
- **Action**: The script will unzip the `.docx` files (XML-based) and use Regex to find all placeholders (e.g., `{resident_name}`, `{PURPOSE}`).
- **Outcome**: A detailed report of all variables required by the physical templates vs. what the system provides.
- **Note on .doc files**: The current system uses `docxtemplater` which **only supports .docx**. I will identify all legacy `.doc` files that need conversion.

### **Phase 2: System Integration (Code Update)**
I will modify `server/controllers/documentController.js` to bridge the gap between the database and the local file system.
- **Feature**: Add a fallback mechanism in `downloadDocument` and `_generateFromTemplate`.
- **Logic**: If a template is not found in the database, the system will search the `Certificate Templates` directory for a matching filename (e.g., `barangay_clearance.docx`).
- **Benefit**: This allows you to simply edit files in that folder and see changes immediately without database uploads.

### **Phase 3: Variable Mapping & Harmonization**
Based on the Phase 1 report, I will update `_mergeData` in `documentController.js`.
- **Action**: Ensure all variables found in the templates are populated.
- **Fixes**: Add aliases if needed (e.g., if template uses `{FULL_NAME}` but system provides `{resident_name}`, I will add `FULL_NAME: resident_name`).

### **Phase 4: Verification**
I will create a test script to simulate a certificate generation request.
- **Test**: Attempt to generate a PDF/DOCX from one of the local templates using dummy resident data.
- **Validation**: Ensure the output file is created and variables are replaced.

**Confirm to proceed with this plan?**