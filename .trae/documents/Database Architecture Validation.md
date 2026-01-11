I have analyzed the current system and identified that most of your requirements are already implemented, but there is a **critical security gap** regarding privilege escalation that needs to be fixed.

Here is the implementation plan:

### 1. Fix Critical Security Gap (Privilege Escalation)
*   **Problem:** Currently, the `createStaff` and `updateStaff` endpoints in `adminController.js` do not verify if the *requester* has a higher rank than the role they are assigning. A Level 2 officer could theoretically create a Level 1 Admin if they had access to the endpoint.
*   **Solution:** Implement a `validateHierarchy` middleware/helper.
    *   Ensure Requester Role Level < Target Role Level (assuming 1 is highest).
    *   Ensure Requester Role Level < Assigned Role Level.

### 2. Verify & Enhance Resident Management Module
*   **Status:** The backend (`residentController.js`) supports full CRUD (Create, Update, Archive).
*   **Action:** I will verify the frontend `Residents.jsx` (which I previously missed in the file list but is referenced) or creating a new `ResidentManagement.jsx` if the existing one is insufficient for "Account Status" management. *Note: `residentController.js` has an `archive` function but not a direct "toggle active" for the login user account linked to the resident. I will add this.*

### 3. Documentation
*   Create `docs/USER_MANAGEMENT_WORKFLOWS.md` detailing:
    *   Staff Hierarchy (Admin vs Officer).
    *   Permissions Matrix.
    *   Step-by-step workflows for creating staff and residents.

### 4. Verification
*   Add unit tests for the new `validateHierarchy` logic.
*   Verify the audit logs are capturing all these events (they seem to be covering most already).

I will start by fixing the security vulnerability in the Admin Controller.