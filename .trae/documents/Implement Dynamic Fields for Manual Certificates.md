# Enable Dynamic Fields for Manual Certificate Issuance

I will implement a system to automatically detect and display input fields for custom variables found in certificate templates (e.g., `{business_name}`, `{closure_date}`) during manual issuance.

## 1. Frontend: Dynamic Form Generation (`DocumentsDashboard.jsx`)
- **Placeholder Extraction Logic**:
    - Implement a function to scan the selected template's content (`main_content`, `header_text`, etc.) for variables using a regex pattern like `/{(\w+)}/g`.
    - Filter out standard system variables (e.g., `resident_name`, `address`, `date`, `captain_name`) to identify only the custom fields.
- **Dynamic State & UI**:
    - Create a new state `dynamicFields` to store values for these custom variables.
    - When a template is selected, automatically populate the form with `TextField` inputs for each detected custom variable.
- **Submission Update**:
    - Update `handleIssueCertificate` to collect these dynamic values and send them in a new `dynamic_data` object within the API request payload.

## 2. Backend: Data Handling (`certificateController.js`)
- **Capture Dynamic Data**:
    - Update the `create` function to accept `dynamic_data` from the request body.
- **Store in Request Log**:
    - Merge this `dynamic_data` into the `request_data` JSON column in the `document_requests` table.
    - This ensures that when the certificate is generated/downloaded, the `documentController` (which already merges `request_data`) has access to these custom values to fill the template correctly.

## Verification
- I will verify that selecting a "Business Closure" template (or similar) displays new inputs for its specific variables.
- I will verify that filling these inputs and issuing the certificate results in a generated document with the correct values populated.