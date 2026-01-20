# Certificate Template Audit & Synchronization Plan

The goal is to ensure that every DOCX template in `c:\xampp\htdocs\clearpass\Certificate Templates\` contains the correct variable placeholders that match the backend's data generation logic. This guarantees that when a certificate is requested, the output document is populated correctly without empty or broken fields.

**User Requirement:** Ensure NO blank placeholders remain. If a placeholder exists in the document, it MUST have a corresponding specific variable in the backend data.

## 1. Audit Phase (Analysis)
I will systematically read and analyze the content of the DOCX templates to verify their internal variable structure. Since I cannot "visually" open Word files, I will use a script to extract the XML content of the `.docx` files (which are zipped XMLs) to find strings wrapped in `{}` or `{{}}`.

**Targets:**
*   `1 bgy clearance.docx`
*   `1 bonafide blank.docx`
*   `1 building blank.docx`
*   `1 closed biz blank.docx`
*   `1 cohabitation blank.docx`
*   `1 excavation blank.docx`
*   `1 fencing blank.docx`
*   `1 late registration.docx`
*   `CUSTOM INDIGENCY_1.docx`
*   `RESIDENCY (retype).docx`
*   `certification OJT.docx`
*   `good moral_1.docx`
*   `low income HOUSING 2 (Repaired).docx`

**Verification Criteria:**
*   **Exact Match**: Does `{resident_name}` in the doc match `resident_name` in the code?
*   **Completeness**: Are there any `{PLACEHOLDERS}` in the doc that the code *doesn't* know about?
*   **Consistency**: Are signatory variables consistent (`{captain_name}` vs `{punong_barangay}`)?

## 2. Synchronization Phase (Code Update)
Based on the audit, I will update `server/controllers/documentController.js` to ensure the `_mergeData` function provides **exactly** the keys that the templates expect.

*   **Standardize Keys**: Ensure the backend sends a superset of data covering all template variations.
*   **Fill Blanks**: If a template has a placeholder like `{civil_status}` that is currently undefined/blank in the code, I will add the logic to fetch and populate it.
*   **Default Values**: Implement fallback logic (e.g., "N/A" or empty string) for optional fields so that raw `{variable}` tags never appear in the final print.

## 3. Execution Steps
1.  **Extract Template Variables**: I will write a temporary Node.js script to read the `Certificate Templates` directory, unzip the `.docx` files, and regex search for placeholders.
2.  **Compare**: Map the found placeholders against the current `documentController.js` output.
3.  **Refactor Backend**: Update `documentController.js` to align perfectly with the templates, ensuring all discovered placeholders are populated.
4.  **Report**: I will provide a summary of which templates were checked and confirmed.
