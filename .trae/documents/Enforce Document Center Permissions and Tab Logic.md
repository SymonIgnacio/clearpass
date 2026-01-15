I have verified the role mapping in `System_requirements.md` and will refactor `DocumentsDashboard.jsx` to align with the documentation and your requirements.

### **Corrected Role Mapping (Source of Truth):**
-   **IT Admin:** `1`
-   **Captain:** `2` (Read-Only)
-   **Secretary:** `3`
-   **Clerk:** `4`

### **Implementation Plan:**
I will update `client/src/pages/DocumentsDashboard.jsx` to:

1.  **Fix Role IDs:** Replace incorrect hardcoded numbers (e.g., using `3` for Clerk) with the correct ID `4`.
2.  **Tab Permissions & Visibility:**
    -   **Issue Certificates:** Visible to **Admin, Secretary, Clerk**. (Hidden for Captain as they are "Read-Only/No Encoding").
    -   **Certificate History:** Visible to **All Staff** (Admin, Captain, Secretary, Clerk).
    -   **Document Templates:** Visible to **Admin, Captain, Secretary**. (Hidden for Clerk).
    -   **Certificate Types:** Visible to **Admin, Captain, Secretary**. (Hidden for Clerk).
    -   **Document Analytics:** Visible to **Admin, Captain, Secretary**. (Hidden for Clerk).
3.  **Strict Action Restrictions:**
    -   **Management Actions (Create, Edit, Delete, Upload)** on Templates and Types will be restricted to **IT Admin (1)** ONLY.
    -   **Captain (2)** and **Secretary (3)** will have **Read-Only** access to the Templates and Types tabs (can view lists but no action buttons).
4.  **Data Loading:**
    -   Ensure `templates` and `certificate-types` are fetched for all roles that need them (including Clerk for issuing), regardless of tab visibility.

This ensures strict adherence to the "Captain Read-Only" rule and limits template management to the IT Admin as requested.