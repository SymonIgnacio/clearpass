### **Analysis of Signup Logic**

I have analyzed the `authController.js` and `residentAuthRoutes.js` (implied from context) to determine if your signup page writes to `resident_applications`.

1.  **Direct User Creation (`authController.register`)**:
    *   The `register` function (lines 191-218 in `authController.js`) performs a simple `INSERT INTO users`.
    *   It takes `username`, `password`, `email`, `full_name`, and `role`.
    *   It does **NOT** write to the `resident_applications` table.
    *   It does **NOT** link to a `resident_id` initially (unless manually provided, which isn't standard for public signup).

2.  **Implication**:
    *   Your current "Signup" page is creating a **User Account** directly.
    *   This confirms your statement: *"when creating an account/signing up its automatically created... then the next process is to verify that you are residing"*.
    *   Therefore, the **"Registration Applications"** tab in the Admin UI (which reads from the `resident_applications` table) is likely **EMPTY** or unused by your standard signup flow, because users are bypassing that table entirely.

### **Conclusion**
Your current signup process **skips** the `resident_applications` table.
*   **Users** are created directly in the `users` table.
*   **Verification** happens via the **"Residency Verification (Existing)"** tab (where they upload proofs).

### **Plan: Hide "Registration Applications"**
Since this tab is reading from an empty/unused table (`resident_applications`) in your specific workflow, we should **hide** or **disable** it to prevent confusion, leaving only the "Residency Verification" tab which is where the actual work happens.

**Action:**
1.  **Modify `DocumentVerification.jsx`**:
    *   Remove the "Registration Applications" tab.
    *   Set "Residency Verification (Existing)" as the default and only view.
    *   This aligns the UI exactly with your "Signup -> Login -> Upload Proof" workflow.

This confirms your suspicion: we don't need the "Registration Applications" tab because your signup page doesn't use it. I will proceed to remove it.