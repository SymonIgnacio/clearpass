I have gathered all the necessary information and created a comprehensive plan to address your requests.

### **Revised Plan**

#### **1. Fix Guest Access (Immediate Priority)**
*   **Goal**: Resolve the "Failed to fetch documents" error.
*   **Action**: Update `server/routes/residentRoutes.js` to allow the `guest` role (Role 13) to access the `/residents/:id/documents` endpoint. This is a critical prerequisite for the rest of the changes.

#### **2. Implement Resident-Only Certificate Page**
*   **Goal**: Create a dedicated, simplified page for residents to view and request certificates, separate from the admin interface.
*   **Action**:
    *   Create `client/src/pages/ResidentCertificates.jsx`.
        *   **Features**: Table of *own* certificates (Control #, Type, Purpose, Date, Status).
        *   **Request Button**: Opens a modal to select Certificate Type and Purpose.
        *   **Guest Handling**: If Role 13 (Guest), the "Request Certificate" button will be disabled with a tooltip explaining that verification is required.
    *   **Route**: Register `/resident/certificates` in `App.jsx`.
    *   **Sidebar**: Update `Sidebar.jsx` to link "My Certificates" to this new page for Roles 12 & 13.

#### **3. Update Blotter & Sidebar for Guests**
*   **Goal**: Allow guests to see the Blotter page but prevent them from filing reports.
*   **Action**:
    *   **Sidebar**: Enable "Blotter" menu item for Role 13.
    *   **ResidentBlotterReport.jsx**: Add a check for Role 13. If true, disable the form inputs and submit button, showing an alert: "Please verify your residency to file a blotter report."

#### **4. Notification System (Summon Logic)**
*   **Goal**: Notify residents when a Blotter summon is issued.
*   **Action**:
    *   Update `server/controllers/blotterController.js` (update method).
    *   When a case status is updated to `Scheduled for Mediation` (or similar summon status), find the `complainant_resident_id` and `respondent_resident_id`.
    *   Create a notification record for these users: "You have been summoned for a hearing regarding Case #[Number] on [Date]."

#### **5. Vulnerable Group Tracking**
*   **Goal**: Show application tracking only for relevant users.
*   **Action**:
    *   In `Sidebar.jsx`, this is complex to filter purely by role. Instead, I will update the `ResidentDashboard` or `ResidentProfile` to include a specific "Vulnerability Application Status" section that only appears if the user has flagged themselves (e.g., `is_4ps` is true).
    *   For now, the "Application Status" (Documents) page serves this purpose, as it lists the specific documents (like 4Ps ID) and their status.

**Verification Plan:**
1.  **Guest Flow**: Log in as Guest -> Check Sidebar -> Visit Certificates (Button disabled) -> Visit Blotter (Form disabled) -> Visit Documents (No error).
2.  **Resident Flow**: Log in as Resident -> Request Certificate -> See it in the list.
3.  **Summon Flow**: Admin issues summon -> Resident sees notification (if header notification component exists and works).

I will start with **Phase 1 (Fix Access)** and **Phase 2 (New Certificate Page)** as they are the most substantial changes.
