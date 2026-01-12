I will implement the requested changes to fix the resident selection issue, ensure data integrity, and add blotter history visibility.

### 1. Database Migrations
*   **Add Blotter-Resident Relationship Columns**: Create a migration to add `complainant_resident_id` and `respondent_resident_id` columns to the `blotter` table. This establishes the missing foreign key relationship required by the backend logic.
*   **Populate Missing Age Data**: Create a migration to update the `Age` column in the `residents` table by calculating it from the `Birthdate` for all existing records.

### 2. Backend Implementation (Server)
*   **Resident Controller (`residentController.js`)**:
    *   Update `create` and `update` methods to automatically calculate and save the `Age` based on `Birthdate`.
    *   Add a new method `getBlotterHistory` to retrieve all blotter cases where the resident is listed as a complainant or respondent.
*   **Resident Routes (`residentRoutes.js`)**:
    *   Add a new endpoint `GET /:id/blotter-history` to expose the history functionality.

### 3. Frontend Implementation (Client)
*   **Smart Complainant Input (`SmartComplainantInput.jsx`)**:
    *   Refactor `fetchResidents` to use server-side searching (via the `search` query parameter) instead of client-side filtering. This ensures all residents, including "Anna", can be found regardless of pagination limits.
*   **Resident Profile (`ResidentProfile.jsx`)**:
    *   Add a new "Blotter History" section to the profile view.
    *   Fetch and display the list of cases associated with the resident using the new API endpoint.

### 4. Verification
*   **Resident Selection**: Verify "Anna" appears in the complaint form search.
*   **Blotter Linking**: Create a test blotter case linked to a resident and verify it saves correctly.
*   **Age Calculation**: Check that creating/updating a resident automatically populates the correct age.
*   **History View**: Confirm the new blotter case appears in the resident's profile under "Blotter History".
