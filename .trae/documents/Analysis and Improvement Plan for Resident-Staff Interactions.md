### **Refined Improvement Plan**

I have revised the plan based on your specific requirements. We will move away from blanket blocking and implement precise, feature-rich tracking and notification systems.

#### **1. Document Request Logic Refinement**
*   **Current Behavior**: Blocks *all* requests if any active blotter case exists.
*   **New Logic**:
    *   **Selective Blocking**: Only block "Good Moral Character" and "Barangay Clearance" requests if the resident has an active case. Allow other certificates (e.g., Indigency, Residency).
    *   **Guest Handling**: Prevent guests (users with pending residency applications) from requesting *any* certificates until their residency is verified. They should see a "Verification Required" message instead of a generic error.
    *   **Implementation**: Modify `server/controllers/documentController.js` to check the `document_type` before applying the blotter block.

#### **2. Dedicated Tracking Pages**
*   **New Feature**: Create specific pages for residents to track their interactions in detail.
    *   **Request Tracking Page**: A timeline view for document requests (Submitted -> Under Review -> Ready for Pickup/Rejected). If rejected, show the *exact reason* (e.g., "Incomplete requirements").
    *   **Application Tracking Page**: For new applicants (guests), showing their verification progress. If rejected, display the reason provided by the admin.
    *   **Complaint Tracking Page**: A secure view for residents involved in a case (Complainant or Respondent) to see the status, hearing schedules, and outcomes.

#### **3. Enhanced Notification System**
*   **Logic**:
    *   **Rejection Notifications**: When an admin rejects an application or request, automatically send a notification. Clicking it redirects the user to the specific Tracking Page mentioned above.
    *   **Summons Notification**: When a staff member schedules a hearing or issues a summons (`Scheduled for Mediation`), automatically notify *both* the Complainant and the Respondent (if they have accounts linked to the system).
    *   **Implementation**: Update `blotterController.js` and `residentAuthRoutes.js` to trigger `createNotification` upon status changes.

#### **4. Clarifying Questions**
Before I finalize the code changes, I have one clarification:
*   **For "Guests" (Residency Applicants)**: Since they don't have a full account yet, should their "Application Tracking" be on a public status page (accessed via a tracking code) or should they be allowed to log in to a limited "Guest Dashboard" to see their status? *Assumption: They log in to a limited dashboard since you mentioned "notifies the resident... if they clicked the notification".*

### **Execution Steps**
1.  **Backend**: Modify `documentController.js` to apply selective blocking rules.
2.  **Backend**: Update `blotterController.js` to send notifications to both parties on summons issuance.
3.  **Frontend**: Create/Update `ResidentRequests.jsx` and `ResidentComplaints.jsx` to support the detailed timeline view.
4.  **Frontend**: Wire up the notification click handlers to redirect to these new pages.
