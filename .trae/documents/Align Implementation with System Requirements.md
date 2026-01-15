I will align the implementation with the system requirements by updating the Resident Registration and Blotter Reporting modules.

**1. Resident Registration (`ResidentRegister.jsx`)**

* **Goal:** Implement "Auto-Text Requirements" logic.

* **Action:**

  * Add a **Post-Registration Modal** that appears immediately after successful signup.

  * This modal will explicitly list the required documents (Valid ID, 4Ps/PWD docs if applicable) that the resident needs to prepare for verification.

  * This replaces the simple "success message" with the required "automated messaging" simulation to inform residents of next steps.

**2. Blotter Reporting (`ResidentBlotterReport.jsx`)**

* **Goal:** Implement "Free-Text Field" for complaints.

* **Action:**

  * Remove the **Incident Type Dropdown** (which restricts choices).

  * Convert the `incident_type` field into a **Free-Text Input**, allowing residents to type the nature of their complaint freely (e.g., "Noise Barrage", "Neighbor Dispute") as per the requirement "let the resident type what report they will complain about".

