# UI/UX Improvements for Certificate Issuance

I will update `client/src/pages/DocumentsDashboard.jsx` to address the reported issues:

## 1. Fix "Compressed" Search Placeholder
- Change the grid column size for `SmartResidentSearch` from `xs={12} md={6}` to `xs={12}`. This will give the search bar the full width of the container, preventing the compressed look.

## 2. Update "Valid Until" Field
- Convert the "Valid Until" `TextField` to `type="date"`.
- Add `InputLabelProps={{ shrink: true }}` to ensure the label doesn't overlap with the date placeholder.

## 3. Remove "Control Number" Field
- Remove the "Control Number" input field entirely from the UI, as the system automatically generates this value upon issuance.

## 4. Fix "Create Certificate" Button & Auto-fill Certificate Type
- **Problem:** The button remains disabled because `manual_certificate_type` is required but wasn't being set when selecting a template.
- **Solution:** Update the Template `Select` component's `onChange` handler to automatically populate `manual_certificate_type` in the form data using the selected template's name. This ensures all required fields are present when a user selects a template and a resident.

## 5. Verification
- I will verify that selecting a template and a resident enables the "Create Certificate" button (provided "Purpose" is also filled).
