Yes, the current code **perfectly aligns** with your description.

1.  **Residency Process:**
    *   **Code:** New accounts are created as **Guests (Role 13)**. They cannot access resident features until they upload proof and you approve them.
    *   **Your Request:** I will rename the "Registration Applications" page/menu to **"Residency Verification"** to make this clearer in the interface.

2.  **Vulnerability Process:**
    *   **Code:** Residents upload proof -> Status becomes "Pending" -> You manually Approve -> System updates their status (e.g., to PWD).
    *   **Status:** Aligned.

### **Action Plan**
I will rename the UI elements to match your terminology:
1.  **`Sidebar.jsx`:** Rename "Registration & Document Review" to **"Residency Verification"**.
2.  **`DocumentVerification.jsx`:** Rename the page title from "Registration Applications" to **"Residency Verification"**.
