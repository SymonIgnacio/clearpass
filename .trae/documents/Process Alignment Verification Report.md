I will fix the user profile display issues in the sidebar by updating both the backend role mapping and the frontend display logic.

### **1. Backend Fixes (`server/controllers/authController.js`)**
- Update the SQL query in the `login` function to correctly map **Role 13** to **'Guest'**. Currently, it returns `NULL` for guests, causing the frontend to fallback to "Staff".
- Ensure the `CASE` statement covers all defined roles (`Guest`, `Resident`, etc.) to prevent future mismatches.

### **2. Frontend Fixes (`client/src/components/Sidebar.jsx`)**
- Update the profile section to prioritize displaying `user.full_name` over `user.username`.
- **Change:** `{user.username || 'User'}` → `{user.full_name || user.username || 'User'}`.
- This ensures the user's actual name (e.g., "Juan Dela Cruz") is shown instead of their system username or the generic "User" placeholder.

**Verification Plan:**
1.  **Login Test:** Log in as a user with **Role 13 (Guest)** and verify the sidebar displays **"Guest"** instead of "Staff".
2.  **Name Display:** Check that the user's **Full Name** appears in the sidebar instead of "User".
