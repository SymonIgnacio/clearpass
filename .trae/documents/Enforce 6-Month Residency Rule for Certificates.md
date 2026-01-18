I have finalized the plan to support **Manual Handwriting Fallback**.

### **The "Blank Line" Logic**
1.  **System Auto-Fill**: If the database has the data (e.g., Name, Address, Calculated Years), it will print it neatly.
2.  **Manual Override**: If the Staff enters a value in the dashboard (e.g., typing "5 Years" into the new input box), that value takes priority.
3.  **The Fallback (Handwriting Mode)**: If **neither** exists (no DB data AND no manual input), the system will leave the space **BLANK** (instead of printing "N/A" or "undefined"). This allows the Secretary to physically write on the printed paper.

**Action Items:**
1.  **Database**: Add `date_arrival` to registration (to support calculation).
2.  **Controller Update**:
    *   Change all defaults from `'N/A'` to `''` (empty string).
    *   Ensure manual inputs from the request body override database values.
3.  **Frontend (Admin Dashboard)**:
    *   Add a "Years of Residency" input field to the "Issue Certificate" modal.
    *   (Optional but recommended) Add generic "Override" fields for other variables if you want full control.

Shall I execute this "Blank-by-Default" strategy?