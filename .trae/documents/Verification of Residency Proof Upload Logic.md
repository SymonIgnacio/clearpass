I will update the system to fix the "Staff" label issue and implement the document tracking features.

### **1. Fix "Staff" Label Issue (Backend)**
**File:** `server/routes/residentAuthRoutes.js`
*   **Problem:** The login API returns the user's role ID (e.g., 13) but not the role name. The frontend defaults to "Staff" if the name is missing.
*   **Fix:** Import `ROLE_NAMES` from `../config/roles` and include `role_name: ROLE_NAMES[effectiveRole]` in the login response.
*   **Result:** The sidebar will correctly display "Guest" or "Resident" instead of "Staff".

### **2. Enable Document Tracking for Guests (Backend)**
**File:** `server/controllers/residentController.js`
*   **Update `listDocuments` function:**
    *   Add logic to handle users without a `resident_id` (Guests).
    *   For Guests, look up their `application_id` using their email.
    *   Fetch documents from the `application_documents` table instead of `resident_documents`.
    *   **Result:** Guests will be able to see the status of their initial residency proof uploads.

### **3. Create "My Documents" Page (Frontend)**
**New File:** `client/src/pages/ResidentDocuments.jsx`
*   **Features:**
    *   A clean, professional table view of all uploaded documents.
    *   **Columns:** Document Type, File Name, Upload Date, Status (Pending/Verified/Rejected), and Admin Notes.
    *   **Visuals:** Color-coded status chips (Yellow=Pending, Green=Verified, Red=Rejected).

### **4. Professional Sidebar Update (Frontend)**
**File:** `client/src/components/Sidebar.jsx`
*   **Changes:**
    *   **Rename:** "My Services" -> **"Resident Portal"** (More formal).
    *   **Add:** "My Documents" link pointing to the new page.
    *   **Reorder:** Dashboard -> Profile -> My Documents -> Requests.

### **5. Dashboard "Account Review" Enhancement (Frontend)**
**File:** `client/src/pages/ResidentDashboard.jsx`
*   **Enhancement:**
    *   Update the "Account Under Review" section (seen by Guests).
    *   Add a **"Uploaded Documents Status"** list directly in this view.
    *   This gives immediate reassurance: *"You uploaded 'Valid ID' - Status: Pending"*.

### **Execution Steps**
1.  **Backend:** Apply fixes to `residentAuthRoutes.js` and `residentController.js`.
2.  **Frontend:** Create the new `ResidentDocuments.jsx` page.
3.  **Frontend:** Register the new route in `App.jsx`.
4.  **Frontend:** Update `Sidebar.jsx` with the new structure.
5.  **Frontend:** Enhance `ResidentDashboard.jsx` for guests.
