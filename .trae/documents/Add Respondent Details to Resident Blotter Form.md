I will update the Resident Blotter Report form to include a structured "Respondent Details" section, similar to the admin interface but adapted for resident access (manual entry only, as residents cannot search the database).

### Frontend: `ResidentBlotterReport.jsx`
1.  **Add State**: Add `respondentData` state to track:
    -   `name`
    -   `alias`
    -   `address`
    -   `contact`
2.  **Add UI Section**: Insert a new "Respondent Details" section before the Incident Details.
    -   **Respondent Name** (TextField)
    -   **Alias** (TextField, Optional)
    -   **Address** (TextField)
    -   **Contact Number** (TextField)
3.  **Update Submit Logic**: Include these new fields in the API payload sent to `/blotter-complaints/submit`.

### Backend: `blotterComplaintController.js`
1.  **Update `submitComplaint`**:
    -   Extract `respondent_alias` and `respondent_contact` from `req.body`.
    -   Update the `respondent_details` JSON construction to include:
        ```javascript
        const respondent_details = respondent_name
          ? {
              name: respondent_name,
              alias: respondent_alias || '',
              address: respondent_address || 'Not specified',
              contact: respondent_contact || ''
            }
          : null;
        ```
    -   This ensures consistency with the admin's data structure.