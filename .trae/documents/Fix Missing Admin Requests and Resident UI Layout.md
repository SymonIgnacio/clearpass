I have analyzed the database (`barangay_management (10).sql`) and the backend code. Here is the situation and the plan to align everything.

### **System Analysis & Misalignment**

1.  **Database Structure**:
    *   **`users`**: Stores login accounts. "Guests" (Role 13) and "Residents" (Role 12).
    *   **`resident_documents`**: Stores files for users who *already have* a `Resident_ID` (verified residents).
    *   **`application_documents`**: Stores files for users who *do not* have a `Resident_ID` yet (new signups/guests).
2.  **The Problem**:
    *   When a Guest (new user) uploads a "Residency Verification" proof, it goes to **`application_documents`** (because they don't have a `Resident_ID` yet).
    *   The Admin Dashboard's "Residency Verification" tab calls an endpoint (`/resident-documents`) that **only queries `resident_documents`**.
    *   **Result**: New requests from Guests are completely invisible to the Admin.

### **The Plan: Unified Verification Flow**

I will fix this by merging the data sources for the Admin, so they see *all* requests in one place, regardless of whether it's a new Guest or an existing Resident.

#### **Step 1: Backend Fix (`server/routes/secretaryRoutes.js`)**
*   **Update `GET /resident-documents`**:
    *   Modify the query to `UNION` data from both `resident_documents` and `application_documents`.
    *   This ensures the Admin table populates with *all* pending requests.
*   **Update `POST /documents/:id/verify`**:
    *   Add logic to handle verification for both tables. If the document comes from an "Application", verifying it should also trigger the creation/linking of the Resident profile (or at least mark the application as reviewed).

#### **Step 2: Frontend Fixes**
*   **Resident Dashboard (`client/src/pages/ResidentDashboard.jsx`)**:
    *   Add CSS truncation to the "Recent Requests" list so filenames don't cramp the UI.
*   **Admin Dashboard (`client/src/pages/DocumentVerification.jsx`)**:
    *   Ensure the table column logic matches the unified data structure (e.g., displaying "Applicant Name" correctly).

#### **Step 3: Verification**
*   I will verify that a "Guest" upload appears in the Admin Dashboard.
*   I will verify that "Approve" works for these requests.

This approach respects your requirement to separate "Residency" from "Beneficiary" checks while ensuring no request gets lost.
