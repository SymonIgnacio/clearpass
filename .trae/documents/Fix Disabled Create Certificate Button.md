# Fix Disabled "Create Certificate" Button

I have identified the logic gap causing the button to remain disabled.

## 1. Audit Report: The Logic Gap
- **Issue**: The "Create Certificate" button's `disabled` condition checks for `certificateFormData.manual_resident_name`, `manual_certificate_type`, `manual_purpose`, and `selectedCertificateTemplate`.
- **The Gap**: It **DOES NOT** check if the `dynamicFields` (e.g., `business_name`, `date_closed`) are filled. However, this is NOT why the button is disabled in the user's screenshot. The screenshot shows all fields filled.
- **The Real Bug**: The `disabled` condition uses `!certificateFormData.manual_certificate_type`.
    - In my previous fix (Turn 1), I added logic to the `Select` component to update `manual_certificate_type` when a template is chosen.
    - **However**, looking at the screenshot, the user has selected a "Business Closure" template.
    - I need to verify if `manual_certificate_type` is actually being set correctly in the state.
    - **CRITICAL FINDING**: In the previous turn's code reading, I see:
      ```javascript
      <Select
        value={selectedCertificateTemplate}
        onChange={(e) => setSelectedCertificateTemplate(e.target.value)}
        // ...
      >
      ```
      **Wait!** In Turn 1, I applied a patch to update `manual_certificate_type` inside this `onChange`. But when I read the file just now (Turn 4), that logic is **MISSING** in the `Select` component (Lines 980-983). It seems the previous patch might have been reverted or I am misreading the line numbers.
      Let me re-read the file content from the latest tool output carefully.
      Ah, I see lines 979-989:
      ```javascript
      <Select
        value={selectedCertificateTemplate}
        onChange={(e) => setSelectedCertificateTemplate(e.target.value)}
        label="Choose Template *"
        required
      >
      ```
      **The logic to set `manual_certificate_type` is GONE.** This explains why the button is disabled: `certificateFormData.manual_certificate_type` remains empty because the `onChange` handler only updates `selectedCertificateTemplate`.

## 2. Plan to Fix
1.  **Restore the missing logic** in the `Select` `onChange` handler to set `manual_certificate_type` when a template is selected.
2.  **Enhance Validation**: I will also update the button's `disabled` condition to explicitly check if all *required* dynamic fields are filled, ensuring a robust validation.

## 3. Verification
- I will verify that selecting a template updates the `manual_certificate_type` state.
- I will verify that the button becomes enabled when all required fields are populated.
