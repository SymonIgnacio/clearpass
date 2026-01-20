# Comprehensive Dynamic Certificate System Plan

This plan unifies the resident request flow and admin issuance process into a single, dynamic, template-driven system. It eliminates hardcoded logic in favor of a flexible database configuration.

## 1. Database Schema Migration
We will enhance the `document_templates` table to store not just the file, but the logic for filling it.

*   **Table**: `document_templates`
*   **New Columns**:
    *   `required_fields`: `JSON` - Stores the configuration for user inputs (e.g., `[{ "key": "reason", "label": "Reason for Request", "type": "text" }]`).
    *   `display_name`: `VARCHAR(255)` - The human-readable name (e.g., "Medico Legal Certificate").
    *   `is_custom`: `BOOLEAN` - Flags user-created templates vs. system defaults.

## 2. Admin: "Smart" Template Upload
**Feature**: Interactive Template Configuration Wizard
*   **Step 1: Upload**: Admin uploads a `.docx` file.
*   **Step 2: Analysis**: The backend parses the file (using `docxtemplater` logic) and returns a list of all `{placeholders}` found.
*   **Step 3: Configuration**: The Admin UI presents a mapping table:
    *   **System Fields**: Auto-matched (e.g., `{resident_name}` -> `Database: Full Name`).
    *   **Custom Fields**: For unknown tags (e.g., `{pet_name}`), the Admin configures the input:
        *   **Label**: "Name of Pet"
        *   **Type**: Text / Date / Number
        *   **Required**: Yes / No
*   **Step 4: Save**: The template file AND this configuration map are saved to the database.

## 3. Resident: Dynamic Request Form
**Feature**: Adaptive Request Page
*   **Logic**:
    1.  Resident selects a document type.
    2.  Frontend fetches the `required_fields` JSON for that type.
    3.  **Auto-Form Generation**:
        *   If the field is mapped to the DB (e.g., Name), it is hidden or shown as read-only.
        *   If the field is "Custom" (e.g., Reason, Pet Name), a corresponding input field is rendered.
    4.  **Submission**: The user's inputs are saved as a JSON object in the `request_data` column of `document_requests`.

## 4. Document Generation (Backend)
**Feature**: Unified Generation Engine
*   **Logic**:
    1.  Fetch the template file (blob) and the `request_data` JSON.
    2.  **Merge**: Combine the `resident` profile data (DB) with the `request_data` (User Input).
    3.  **Generate**: Use `docxtemplater` to fill the `.docx` template with this merged dataset.
    4.  **Output**: Convert to PDF (optional) or serve the filled DOCX.

## Execution Roadmap
1.  **Migration**: Update `document_templates` schema.
2.  **Backend**: Implement the template analysis endpoint (extract placeholders) and the dynamic save endpoint.
3.  **Admin UI**: Build the "Upload & Configure" wizard.
4.  **Resident UI**: Refactor `CertificateRequest.jsx` to render forms dynamically based on the selected template's config.
5.  **Seed**: Run a script to upload the 12 existing templates and configure their default mappings so they work immediately.
