I have updated the plan to include **Automatic Generation** for CTC and OR numbers, removing the need for manual input entirely.

### **Final Implementation Plan**

1.  **Auto-Generation Logic**:
    *   **CTC Number**: I will implement a generator in the backend that creates a unique Community Tax Certificate number (e.g., `CTC-2024-XXXXX`) automatically upon approval.
    *   **OR Number**: I will implement a similar generator for Official Receipt numbers (e.g., `OR-2024-XXXXX`).
    *   *Note:* These will be generated and saved to the database as soon as the document is approved/issued.

2.  **Updated Variable Mapping**:
    *   **Auto-Filled**: Name, Address, DOB, Place of Birth, Age, Civil Status, etc.
    *   **System-Generated**: `{ctc_no}`, `{or_no}`, `{issued_at}`, `{issued_on}`.
    *   **Resident Input**: `{purpose}`, `{specific_purpose}`, and document-specific fields (e.g., "Construction Location" for Building Permit).

3.  **No Manual Input Required**:
    *   Neither the Resident nor the Staff will need to type these numbers. They will appear automatically on the final document.

**Action Items:**
1.  **Update `DocumentController.js`**: Implement `_generateCTCNumber()` and `_generateORNumber()` methods.
2.  **Map Variables**: Ensure all 16 templates are mapped to these new auto-generated values.
3.  **Deliver Cheat Sheet**: Provide the final list of `{placeholders}` for you to update your files.

Shall I proceed with this fully automated approach?