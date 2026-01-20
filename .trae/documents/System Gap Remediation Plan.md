# System Remediation Plan: Smart Households & "No Fees"

## 1. Better Household Allocation: "Smart Address Clustering"
You asked if "auto-creation on signup" is the only way. **No, it is not.** In fact, that approach causes duplicate households (e.g., 5 family members = 5 households).

**The Better Way: Address-Based Clustering**
Instead of blindly creating a new household for every signup, we will implement this logic in `residentController.js` (Register function):

1.  **Search First**: When a user registers, the system will check the `households` table for an existing record with the same **Sitio** and **Street Address**.
2.  **Match Found?**:
    *   **Yes**: Automatically link the new resident to the **existing** `Household_ID`.
    *   **No**: Only *then* create a new Household.
3.  **Result**: Families living at the same address are automatically grouped into **one** Household unit, making your Census data accurate immediately.

---

## 2. "No Fees" Implementation (Purge)
We will completely remove the fee system.

### Phase 1: Database Schema Cleanup
*   `ALTER TABLE certificate_types DROP COLUMN fee;`
*   `ALTER TABLE certificates_log DROP COLUMN fee_amount;`

### Phase 2: Backend Logic Removal
*   **Controller**: Remove all fee calculations in `documentController.js`.
*   **Validation**: Remove fee requirements in `certificateTypeController.js`.

### Phase 3: Frontend UI Cleanup
*   **Certificates.jsx**: Remove fee display in tables and dropdowns.
*   **Admin Forms**: Remove the "Fee" input field.

---

## 3. Gap Remediation (Route Plumbing)
We will fix the 404 errors by adding the missing routes.
1.  **Programs**: Add `add-participant` & `notify-participants` routes.
2.  **Admin**: Add `ai-analytics` route.
3.  **Documents**: Add `generate` route.
4.  **Residents**: Add `/me` route.

## 4. Execution Plan
1.  **Fix Routes** (Immediate plumbing).
2.  **Purge Fees** (DB -> Backend -> Frontend).
3.  **Implement Smart Household Logic** (Update Registration flow).
